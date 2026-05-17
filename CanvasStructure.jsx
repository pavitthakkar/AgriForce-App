export default function CanvasStructure({ structure, onDragStart, onClick }) {
  const { type, x, y, label } = structure;

  // Settings button — positioned top-right of structure, stops mousedown so it doesn't trigger drag
  function SettingsButton({ bx, by }) {
    return (
      <g
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{ cursor: "pointer" }}
      >
        <rect x={bx} y={by} width={24} height={18} rx={5}
          fill="hsl(152, 30%, 88%)" stroke="hsl(152, 35%, 60%)" strokeWidth={1.2} />
        <text x={bx + 12} y={by + 12.5} textAnchor="middle" fontSize={11}
          fill="hsl(152, 40%, 28%)" fontFamily="var(--font-body)" fontWeight={700}>···</text>
      </g>
    );
  }

  if (type === "rack") {
    const { rows, cols, cellWidth, cellHeight } = structure;
    const totalW = cols * cellWidth;
    const totalH = rows * cellHeight;

    return (
      <g onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }} style={{ cursor: "move" }}>
        <rect x={x} y={y} width={totalW} height={totalH} rx={6}
          fill="hsl(145, 30%, 96%)" stroke="hsl(152, 40%, 70%)" strokeWidth={2} strokeDasharray="6 3" />

        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <rect key={`${r}-${c}`}
              x={x + c * cellWidth + 4} y={y + r * cellHeight + 4}
              width={cellWidth - 8} height={cellHeight - 8}
              rx={4} fill="white" stroke="hsl(152, 35%, 78%)" strokeWidth={1.5} strokeDasharray="4 2" />
          ))
        )}

        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <text key={`lbl-${r}-${c}`}
              x={x + c * cellWidth + cellWidth / 2} y={y + r * cellHeight + cellHeight / 2 + 4}
              textAnchor="middle" fontSize={10} fill="hsl(152, 30%, 65%)" fontFamily="var(--font-body)">
              R{r + 1}C{c + 1}
            </text>
          ))
        )}

        {/* Rack name — left aligned so button doesn't overlap */}
        <text x={x} y={y - 8} textAnchor="start" fontSize={13} fontWeight={600}
          fill="hsl(160, 30%, 25%)" fontFamily="var(--font-heading)">{label}</text>

        {/* Settings button — top right corner */}
        <SettingsButton bx={x + totalW - 26} by={y - 22} />
      </g>
    );
  }

  if (type === "tower") {
    const { spots, towerHeight } = structure;
    const towerW = 50;
    const spotSpacing = towerHeight / (spots + 1);

    return (
      <g onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }} style={{ cursor: "move" }}>
        <rect x={x} y={y} width={towerW} height={towerHeight} rx={towerW / 2}
          fill="hsl(200, 20%, 95%)" stroke="hsl(200, 30%, 70%)" strokeWidth={2} />

        {Array.from({ length: spots }).map((_, i) => {
          const cy = y + spotSpacing * (i + 1);
          return (
            <g key={i}>
              <circle cx={x + towerW / 2} cy={cy} r={14} fill="white"
                stroke="hsl(152, 35%, 70%)" strokeWidth={1.5} strokeDasharray="4 2" />
              <text x={x + towerW / 2} y={cy + 4} textAnchor="middle" fontSize={8}
                fill="hsl(152, 30%, 65%)" fontFamily="var(--font-body)">S{i + 1}</text>
            </g>
          );
        })}

        <text x={x} y={y - 10} textAnchor="start" fontSize={13} fontWeight={600}
          fill="hsl(200, 30%, 25%)" fontFamily="var(--font-heading)">{label}</text>
        <SettingsButton bx={x + towerW - 26} by={y - 24} />
      </g>
    );
  }

  if (type === "a_frame") {
    const { slotsPerSide, width: frameW, height: frameH } = structure;
    const peakX = x + frameW / 2;
    const bottomY = y + frameH;

    return (
      <g onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }} style={{ cursor: "move" }}>
        <polygon points={`${peakX},${y} ${x},${bottomY} ${x + frameW},${bottomY}`}
          fill="hsl(40, 30%, 96%)" stroke="hsl(40, 40%, 65%)" strokeWidth={2} />

        {Array.from({ length: slotsPerSide }).map((_, i) => {
          const t = (i + 1) / (slotsPerSide + 1);
          const lx = peakX + (x - peakX) * t;
          const rx = peakX + (x + frameW - peakX) * t;
          const sy = y + (bottomY - y) * t;
          return (
            <g key={i}>
              <rect x={lx - 15} y={sy - 10} width={30} height={20} rx={4} fill="white"
                stroke="hsl(152, 35%, 70%)" strokeWidth={1.5} strokeDasharray="4 2" />
              <text x={lx} y={sy + 4} textAnchor="middle" fontSize={7}
                fill="hsl(152, 30%, 65%)" fontFamily="var(--font-body)">L{i + 1}</text>
              <rect x={rx - 15} y={sy - 10} width={30} height={20} rx={4} fill="white"
                stroke="hsl(152, 35%, 70%)" strokeWidth={1.5} strokeDasharray="4 2" />
              <text x={rx} y={sy + 4} textAnchor="middle" fontSize={7}
                fill="hsl(152, 30%, 65%)" fontFamily="var(--font-body)">R{i + 1}</text>
            </g>
          );
        })}

        <text x={x} y={y - 12} textAnchor="start" fontSize={13} fontWeight={600}
          fill="hsl(40, 30%, 30%)" fontFamily="var(--font-heading)">{label}</text>
        <SettingsButton bx={x + frameW - 26} by={y - 26} />
      </g>
    );
  }

  return null;
}