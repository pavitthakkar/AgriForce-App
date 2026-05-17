import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CanvasStructure from "./CanvasStructure";
import CanvasModule from "./CanvasModule";
import CanvasPipe from "./CanvasPipe";

// Build snap targets from structures (center + snap coords per cell/spot/slot)
export function getSnapTargets(structures) {
  const targets = [];
  for (const s of structures || []) {
    if (s.type === "rack") {
      const structBottom = s.y + s.rows * s.cellHeight;
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          const cx = s.x + c * s.cellWidth + s.cellWidth / 2;
          const cy = s.y + r * s.cellHeight + s.cellHeight / 2;
          targets.push({
            id: `${s.id}_r${r}c${c}`,
            label: `${s.label} R${r + 1}C${c + 1}`,
            cx, cy,
            cellW: s.cellWidth - 12,
            cellH: s.cellHeight - 12,
            cellX: s.x + c * s.cellWidth + 6,
            cellY: s.y + r * s.cellHeight + 6,
            structBottom,
          });
        }
      }
    } else if (s.type === "tower") {
      const towerW = 50;
      const spotSpacing = s.towerHeight / (s.spots + 1);
      const structBottom = s.y + s.towerHeight;
      for (let i = 0; i < s.spots; i++) {
        const cy = s.y + spotSpacing * (i + 1);
        targets.push({
          id: `${s.id}_s${i}`,
          label: `${s.label} Spot ${i + 1}`,
          cx: s.x + towerW / 2, cy,
          cellW: 26, cellH: 26,
          cellX: s.x + towerW / 2 - 13,
          cellY: cy - 13,
          structBottom,
        });
      }
    } else if (s.type === "a_frame") {
      const peakX = s.x + s.width / 2;
      const bottomY = s.y + s.height;
      const structBottom = bottomY;
      for (let i = 0; i < s.slotsPerSide; i++) {
        const t = (i + 1) / (s.slotsPerSide + 1);
        const lx = peakX + (s.x - peakX) * t;
        const rx = peakX + (s.x + s.width - peakX) * t;
        const sy = s.y + (bottomY - s.y) * t;
        targets.push({ id: `${s.id}_l${i}`, label: `${s.label} L${i + 1}`, cx: lx, cy: sy, cellW: 30, cellH: 20, cellX: lx - 15, cellY: sy - 10, structBottom });
        targets.push({ id: `${s.id}_r${i}`, label: `${s.label} R${i + 1}`, cx: rx, cy: sy, cellW: 30, cellH: 20, cellX: rx - 15, cellY: sy - 10, structBottom });
      }
    }
  }
  return targets;
}

function findNearestSnap(pt, structures, threshold = 70) {
  const targets = getSnapTargets(structures);
  let best = null, bestDist = threshold;
  for (const t of targets) {
    const d = Math.hypot(pt.x - t.cx, pt.y - t.cy);
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

// Place plant in lower portion of cell, light as thin top strip — so they coexist
function getPlantSnapPos(t) {
  const pad = 4;
  const size = Math.min(t.cellW, t.cellH) - pad * 2;
  return { x: t.cellX + (t.cellW - size) / 2, y: t.cellY + (t.cellH - size) / 2, w: size, h: size };
}
function getLightSnapPos(t) {
  return { x: t.cellX, y: t.cellY, w: t.cellW, h: Math.max(12, Math.round(t.cellH * 0.25)) };
}

export default function FarmCanvas({
  farmType, canvasData, updateCanvas, activeTool, setActiveTool, onModuleClick,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [zoomInput, setZoomInput] = useState("100");
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null); // { id, kind, offsetX, offsetY, currentX, currentY }
  const [pipeStart, setPipeStart] = useState(null); // first cell clicked for irrigation
  const [snapHighlight, setSnapHighlight] = useState(null);

  const isDraggingRef = useRef(false);
  const mouseDownPtRef = useRef(null);

  useEffect(() => {
    setZoomInput(Math.round(viewport.zoom * 100).toString());
  }, [viewport.zoom]);

  const getSvgPoint = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport((prev) => ({ ...prev, zoom: Math.max(0.05, Math.min(5, prev.zoom * delta)) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) { el.addEventListener("wheel", handleWheel, { passive: false }); return () => el.removeEventListener("wheel", handleWheel); }
  }, [handleWheel]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setActiveTool(null); setPipeStart(null); setSnapHighlight(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Global mouseup to always release drag
  useEffect(() => {
    const onUp = (e) => {
      if (isDraggingRef.current && dragState) {
        // Snap on release
        const pt = getSvgPoint(e);
        const snap = findNearestSnap(pt, canvasData.structures, 70);
        if (snap) {
          const pos = dragState.modType === "lighting" ? getLightSnapPos(snap) : getPlantSnapPos(snap);
          updateCanvas((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
              m.id === dragState.id ? { ...m, x: pos.x, y: pos.y, width: pos.w, height: pos.h, data: { ...m.data, snapLabel: snap.label } } : m
            ),
          }));
        }
      }
      isDraggingRef.current = false;
      mouseDownPtRef.current = null;
      setDragState(null);
      setIsPanning(false);
      setSnapHighlight(null);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [dragState, canvasData.structures, getSvgPoint, updateCanvas]);

  const handleMouseDown = (e) => {
    mouseDownPtRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    if ((e.target === svgRef.current || e.target.classList.contains("canvas-bg")) && !activeTool) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  const handleMouseMove = (e) => {
    if (mouseDownPtRef.current) {
      const dx = e.clientX - mouseDownPtRef.current.x;
      const dy = e.clientY - mouseDownPtRef.current.y;
      if (Math.hypot(dx, dy) > 5) isDraggingRef.current = true;
    }

    if (isPanning && !dragState) {
      setViewport((prev) => ({ ...prev, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    }

    if (dragState) {
      const pt = getSvgPoint(e);
      const newX = pt.x - dragState.offsetX;
      const newY = pt.y - dragState.offsetY;

      // Always snap to nearest cell while dragging
      const snap = findNearestSnap(pt, canvasData.structures, 70);
      setSnapHighlight(snap);

      if (dragState.kind === "structure") {
        const dx = newX - dragState.structX;
        const dy = newY - dragState.structY;
        updateCanvas((prev) => ({
          ...prev,
          structures: prev.structures.map((s) => s.id === dragState.id ? { ...s, x: newX, y: newY } : s),
          modules: prev.modules.map((m) => {
            const attached = dragState.attachedModules?.find((a) => a.id === m.id);
            if (!attached) return m;
            if (m.type === "pipe") {
              return { ...m, points: attached.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
            }
            return { ...m, x: attached.x + dx, y: attached.y + dy };
          }),
        }));
      } else {
        if (snap) {
          const pos = dragState.modType === "lighting" ? getLightSnapPos(snap) : getPlantSnapPos(snap);
          updateCanvas((prev) => ({
            ...prev,
            modules: prev.modules.map((m) => m.id === dragState.id ? { ...m, x: pos.x, y: pos.y, width: pos.w, height: pos.h, data: { ...m.data, snapLabel: snap.label } } : m),
          }));
        } else {
          updateCanvas((prev) => ({
            ...prev,
            modules: prev.modules.map((m) => m.id === dragState.id ? { ...m, x: newX, y: newY } : m),
          }));
        }
      }
    }

    // Snap preview when placing new module
    if ((activeTool?.type === "plant" || activeTool?.type === "lighting") && svgRef.current) {
      const pt = getSvgPoint(e);
      setSnapHighlight(findNearestSnap(pt, canvasData.structures));
    }
  };

  const handleCanvasClick = (e) => {
    if (isDraggingRef.current) return;
    const pt = getSvgPoint(e);

    if (activeTool?.type === "plant") {
      const snap = findNearestSnap(pt, canvasData.structures);
      const pos = snap ? getPlantSnapPos(snap) : { x: pt.x - 18, y: pt.y - 18, w: 36, h: 36 };
      updateCanvas((prev) => ({
        ...prev,
        modules: [...prev.modules, { id: `mod_${Date.now()}`, type: "plant", x: pos.x, y: pos.y, width: pos.w, height: pos.h, data: { name: activeTool.data.name, snapLabel: snap?.label } }],
      }));
      setActiveTool(null);
      setSnapHighlight(null);
      return;
    }

    if (activeTool?.type === "lighting") {
      const snap = findNearestSnap(pt, canvasData.structures);
      const pos = snap ? getLightSnapPos(snap) : { x: pt.x - 25, y: pt.y - 6, w: 50, h: 12 };
      updateCanvas((prev) => ({
        ...prev,
        modules: [...prev.modules, { id: `mod_${Date.now()}`, type: "lighting", x: pos.x, y: pos.y, width: pos.w, height: pos.h, data: { lightingType: activeTool.data.lightingType, snapLabel: snap?.label } }],
      }));
      setActiveTool(null);
      setSnapHighlight(null);
      return;
    }

    if (activeTool?.type === "irrigation") {
      const snap = findNearestSnap(pt, canvasData.structures, 80);
      if (!snap) return;
      if (!pipeStart) {
        setPipeStart(snap);
      } else {
        // Route pipe just below the bottom of the cells (stays inside the rack)
        const routeY = Math.max(pipeStart.cellY + pipeStart.cellH + 5, snap.cellY + snap.cellH + 5);
        updateCanvas((prev) => ({
          ...prev,
          modules: [...prev.modules, {
            id: `mod_${Date.now()}`,
            type: "pipe",
            points: [
              { x: pipeStart.cx, y: pipeStart.cellY + pipeStart.cellH },
              { x: pipeStart.cx, y: routeY },
              { x: snap.cx, y: routeY },
              { x: snap.cx, y: snap.cellY + snap.cellH },
            ],
            data: { from: pipeStart.label, to: snap.label },
          }],
        }));
        setPipeStart(null);
        setActiveTool(null);
      }
      return;
    }
  };

  const startModuleDrag = (mod, e) => {
    e.stopPropagation();
    const pt = getSvgPoint(e);
    mouseDownPtRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    setDragState({ id: mod.id, kind: "module", modType: mod.type, offsetX: pt.x - mod.x, offsetY: pt.y - mod.y });
  };

  const startStructureDrag = (structId, e) => {
    e.stopPropagation();
    const pt = getSvgPoint(e);
    const s = canvasData.structures.find((s) => s.id === structId);
    mouseDownPtRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    // Snapshot initial positions of all modules/pipes belonging to this structure
    const prefix = `${structId}_`;
    const attachedModules = canvasData.modules
      .filter((m) => {
        if (m.type === "pipe") {
          return m.data?.from?.startsWith(s.label + " ") || m.data?.to?.startsWith(s.label + " ");
        }
        return m.data?.snapLabel?.startsWith(s.label + " ");
      })
      .map((m) => ({ id: m.id, x: m.x, y: m.y, points: m.points }));

    setDragState({ id: structId, kind: "structure", offsetX: pt.x - s.x, offsetY: pt.y - s.y, structX: s.x, structY: s.y, attachedModules });
  };

  const safeClick = (item) => {
    if (isDraggingRef.current) return;
    onModuleClick(item);
  };

  const applyZoom = (z) => setViewport((prev) => ({ ...prev, zoom: Math.max(0.05, Math.min(5, z)) }));
  const handleZoomBlur = () => { const v = parseFloat(zoomInput); if (!isNaN(v)) applyZoom(v / 100); else setZoomInput(Math.round(viewport.zoom * 100).toString()); };

  const fitAll = () => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const structs = canvasData.structures || [];
    if (!structs.length) { setViewport({ x: 0, y: 0, zoom: 1 }); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of structs) {
      const w = s.type === "rack" ? s.cols * s.cellWidth : s.type === "tower" ? 50 : s.width;
      const h = s.type === "rack" ? s.rows * s.cellHeight : s.type === "tower" ? s.towerHeight : s.height;
      minX = Math.min(minX, s.x); minY = Math.min(minY, s.y); maxX = Math.max(maxX, s.x + w); maxY = Math.max(maxY, s.y + h);
    }
    const pad = 60;
    const cw = maxX - minX + pad * 2, ch = maxY - minY + pad * 2;
    const zoom = Math.min(rect.width / cw, rect.height / ch, 2);
    setViewport({ zoom, x: (rect.width - cw * zoom) / 2 - (minX - pad) * zoom, y: (rect.height - ch * zoom) / 2 - (minY - pad) * zoom });
  };

  const cursorClass = activeTool ? "cursor-crosshair" : isPanning ? "cursor-grabbing" : "cursor-grab";

  return (
    <div ref={containerRef} className={`flex-1 relative overflow-hidden bg-muted/30 ${cursorClass} select-none`}>
      <svg ref={svgRef} className="w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onClick={handleCanvasClick}>
        <defs>
          <pattern id="grid" width={20 * viewport.zoom} height={20 * viewport.zoom} patternUnits="userSpaceOnUse" x={viewport.x % (20 * viewport.zoom)} y={viewport.y % (20 * viewport.zoom)}>
            <circle cx={1} cy={1} r={0.8} fill="hsl(var(--border))" opacity={0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="canvas-bg" />

        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {(canvasData.structures || []).map((struct) => (
            <CanvasStructure key={struct.id} structure={struct}
              onDragStart={(e) => startStructureDrag(struct.id, e)}
              onClick={() => safeClick({ ...struct, moduleKind: "structure" })} />
          ))}

          {/* Snap highlight */}
          {snapHighlight && (
            <rect x={snapHighlight.cellX} y={snapHighlight.cellY} width={snapHighlight.cellW} height={snapHighlight.cellH}
              rx={5} fill="hsl(152, 60%, 50%)" opacity={0.2} stroke="hsl(152, 60%, 45%)" strokeWidth={2} strokeDasharray="5 3" />
          )}

          {/* Pipe start indicator */}
          {pipeStart && (
            <circle cx={pipeStart.cx} cy={pipeStart.cy} r={8} fill="hsl(200, 70%, 50%)" opacity={0.5} />
          )}

          {(canvasData.modules || []).filter((m) => m.type === "pipe").map((pipe) => (
            <CanvasPipe key={pipe.id} pipe={pipe} onClick={() => safeClick(pipe)} />
          ))}

          {(canvasData.modules || []).filter((m) => m.type !== "pipe").map((mod) => (
            <CanvasModule key={mod.id} module={mod}
              onDragStart={(e) => startModuleDrag(mod, e)}
              onClick={() => safeClick(mod)} />
          ))}
        </g>
      </svg>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyZoom(viewport.zoom * 0.8)}><ZoomOut className="w-4 h-4" /></Button>
        <Input value={zoomInput} onChange={(e) => setZoomInput(e.target.value)} onBlur={handleZoomBlur} onKeyDown={(e) => e.key === "Enter" && handleZoomBlur()} className="h-7 w-14 text-center text-xs border-muted px-1" />
        <span className="text-xs text-muted-foreground">%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyZoom(viewport.zoom * 1.2)}><ZoomIn className="w-4 h-4" /></Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={fitAll}><Maximize2 className="w-3 h-3 mr-1" />Fit</Button>
      </div>

      {/* Tool hint */}
      {activeTool && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-2 shadow-lg text-sm flex items-center gap-2 pointer-events-none">
          <span className="font-medium">
            {activeTool.type === "plant" ? `Placing: ${activeTool.data.name} — click a cell to snap`
              : activeTool.type === "lighting" ? `Placing: ${activeTool.data.lightingType} — click a cell to snap`
              : pipeStart ? `Pipe from: ${pipeStart.label} — click destination cell`
              : "Click a cell to start pipe"}
          </span>
        </div>
      )}

      {snapHighlight && activeTool && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium shadow-md pointer-events-none">
          {snapHighlight.label}
        </div>
      )}
    </div>
  );
}