import { useState } from "react";
import {
  Leaf,
  Lightbulb,
  Droplets,
  Grid3X3,
  CircleDot,
  Triangle,
  ChevronDown,
  Plus,
  Pipette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

const LIGHTING_OPTIONS = [
  "LED Full Spectrum",
  "LED Red/Blue",
  "T5 Fluorescent",
  "T8 Fluorescent",
  "HPS (High Pressure Sodium)",
  "Metal Halide",
  "CMH (Ceramic Metal Halide)",
  "Plasma Grow Lights",
  "other",
];

function ToolSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-accent/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function FarmToolbar({
  farmType,
  activeTool,
  setActiveTool,
  canvasData,
  updateCanvas,
}) {
  const [plantName, setPlantName] = useState("");
  const [lightingType, setLightingType] = useState("");
  const [customLighting, setCustomLighting] = useState("");

  const addStructure = () => {
    const id = `struct_${Date.now()}`;
    let structure;

    if (farmType === "vertical_rack") {
      structure = {
        id,
        type: "rack",
        x: 100,
        y: 100,
        rows: 4,
        cols: 6,
        cellWidth: 80,
        cellHeight: 70,
        label: `Rack ${(canvasData.structures?.length || 0) + 1}`,
      };
    } else if (farmType === "tower") {
      structure = {
        id,
        type: "tower",
        x: 200,
        y: 150,
        spots: 8,
        radius: 30,
        towerHeight: 400,
        label: `Tower ${(canvasData.structures?.length || 0) + 1}`,
      };
    } else {
      structure = {
        id,
        type: "a_frame",
        x: 150,
        y: 100,
        slotsPerSide: 6,
        width: 300,
        height: 250,
        label: `A-Frame ${(canvasData.structures?.length || 0) + 1}`,
      };
    }

    updateCanvas((prev) => ({
      ...prev,
      structures: [...(prev.structures || []), structure],
    }));
  };

  const startPlantDrag = () => {
    if (!plantName.trim()) return;
    setActiveTool({
      type: "plant",
      data: { name: plantName.trim() },
    });
    setPlantName("");
  };

  const startLightingDrag = () => {
    const finalType =
      lightingType === "other" ? customLighting.trim() : lightingType;
    if (!finalType) return;
    setActiveTool({
      type: "lighting",
      data: { lightingType: finalType },
    });
    setLightingType("");
    setCustomLighting("");
  };

  const startIrrigationDraw = () => {
    setActiveTool(
      activeTool?.type === "irrigation" ? null : { type: "irrigation" }
    );
  };

  const FARM_ICON =
    farmType === "tower"
      ? CircleDot
      : farmType === "a_frame"
      ? Triangle
      : Grid3X3;

  return (
    <div className="w-64 border-r border-border bg-card shrink-0 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="py-3 space-y-1">
          {/* Structure */}
          <ToolSection title="Structure" icon={FARM_ICON} defaultOpen={true}>
            <Button
              onClick={addStructure}
              variant="outline"
              size="sm"
              className="w-full gap-2 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add{" "}
              {farmType === "vertical_rack"
                ? "Rack"
                : farmType === "tower"
                ? "Tower"
                : "A-Frame"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Add a structure, then drag it on the canvas. Click to configure.
            </p>
          </ToolSection>

          {/* Plants */}
          <ToolSection title="Plants" icon={Leaf}>
            <div className="space-y-2 mt-1">
              <Input
                placeholder="Type plant name..."
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && startPlantDrag()}
              />
              <Button
                onClick={startPlantDrag}
                disabled={!plantName.trim()}
                size="sm"
                className="w-full gap-2"
              >
                <Leaf className="w-3.5 h-3.5" />
                Place Plant
              </Button>
              <p className="text-xs text-muted-foreground">
                Type a plant name and click to place it on the canvas.
              </p>
            </div>
          </ToolSection>

          {/* Lighting */}
          <ToolSection title="Lighting" icon={Lightbulb}>
            <div className="space-y-2 mt-1">
              <Select value={lightingType} onValueChange={setLightingType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {LIGHTING_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "other" ? "Other (custom)" : opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lightingType === "other" && (
                <Input
                  placeholder="Custom lighting type..."
                  value={customLighting}
                  onChange={(e) => setCustomLighting(e.target.value)}
                  className="h-8 text-sm"
                />
              )}
              <Button
                onClick={startLightingDrag}
                disabled={
                  !lightingType ||
                  (lightingType === "other" && !customLighting.trim())
                }
                size="sm"
                variant="outline"
                className="w-full gap-2"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Place Light
              </Button>
            </div>
          </ToolSection>

          {/* Irrigation */}
          <ToolSection title="Irrigation" icon={Droplets}>
            <div className="space-y-2 mt-1">
              <Button
                onClick={startIrrigationDraw}
                size="sm"
                variant={activeTool?.type === "irrigation" ? "default" : "outline"}
                className="w-full gap-2"
              >
                <Pipette className="w-3.5 h-3.5" />
                {activeTool?.type === "irrigation"
                  ? "Drawing Pipe..."
                  : "Draw Pipe"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Click any two cells to automatically connect them with a pipe.
              </p>
            </div>
          </ToolSection>
        </div>
      </ScrollArea>

      {/* Module Count */}
      <div className="border-t border-border p-3 text-xs text-muted-foreground">
        {canvasData.structures?.length || 0} structures ·{" "}
        {canvasData.modules?.length || 0} modules
      </div>
    </div>
  );
}