import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import PlantJournal from "./PlantJournal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function ModuleConfigDialog({ module, onUpdate, onDelete, onClose, farmId }) {
  const [data, setData] = useState({ ...module });
  const [customLighting, setCustomLighting] = useState("");

  const isStructure = module.moduleKind === "structure";
  const isPlant = module.type === "plant";
  const isLighting = module.type === "lighting";
  const isPipe = module.type === "pipe";

  const handleSave = () => {
    onUpdate(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-end">
      <div className="w-80 h-full bg-card border-l border-border shadow-xl overflow-y-auto p-5 space-y-5 animate-in slide-in-from-right">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-lg">
            {isStructure
              ? "Structure Settings"
              : isPlant
              ? "Plant Module"
              : isLighting
              ? "Lighting Module"
              : "Irrigation Pipe"}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Structure Config */}
        {isStructure && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Label</Label>
              <Input
                value={data.label || ""}
                onChange={(e) => setData({ ...data, label: e.target.value })}
                className="mt-1"
              />
            </div>

            {data.type === "rack" && (
              <>
                <div>
                  <Label className="text-sm">Rows: {data.rows}</Label>
                  <Slider
                    value={[data.rows]}
                    onValueChange={([v]) => setData({ ...data, rows: v })}
                    min={1}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Columns: {data.cols}</Label>
                  <Slider
                    value={[data.cols]}
                    onValueChange={([v]) => setData({ ...data, cols: v })}
                    min={1}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Cell Width: {data.cellWidth}px</Label>
                  <Slider
                    value={[data.cellWidth]}
                    onValueChange={([v]) => setData({ ...data, cellWidth: v })}
                    min={40}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Cell Height: {data.cellHeight}px</Label>
                  <Slider
                    value={[data.cellHeight]}
                    onValueChange={([v]) => setData({ ...data, cellHeight: v })}
                    min={40}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {data.type === "tower" && (
              <>
                <div>
                  <Label className="text-sm">Spots: {data.spots}</Label>
                  <Slider
                    value={[data.spots]}
                    onValueChange={([v]) => setData({ ...data, spots: v })}
                    min={2}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Tower Height: {data.towerHeight}px</Label>
                  <Slider
                    value={[data.towerHeight]}
                    onValueChange={([v]) => setData({ ...data, towerHeight: v })}
                    min={100}
                    max={800}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {data.type === "a_frame" && (
              <>
                <div>
                  <Label className="text-sm">
                    Slots Per Side: {data.slotsPerSide}
                  </Label>
                  <Slider
                    value={[data.slotsPerSide]}
                    onValueChange={([v]) =>
                      setData({ ...data, slotsPerSide: v })
                    }
                    min={2}
                    max={15}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Width: {data.width}px</Label>
                  <Slider
                    value={[data.width]}
                    onValueChange={([v]) => setData({ ...data, width: v })}
                    min={100}
                    max={600}
                    step={10}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Height: {data.height}px</Label>
                  <Slider
                    value={[data.height]}
                    onValueChange={([v]) => setData({ ...data, height: v })}
                    min={80}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Plant Config */}
        {isPlant && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Plant Name</Label>
              <Input
                value={data.data?.name || ""}
                onChange={(e) =>
                  setData({ ...data, data: { ...data.data, name: e.target.value } })
                }
                className="mt-1"
              />
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Plant Journal — Today</p>
              <PlantJournal module={module} farmId={farmId} />
            </div>
          </div>
        )}

        {/* Lighting Config */}
        {isLighting && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Lighting Type</Label>
              <Select
                value={
                  LIGHTING_OPTIONS.includes(data.data?.lightingType)
                    ? data.data.lightingType
                    : "other"
                }
                onValueChange={(val) => {
                  if (val === "other") {
                    setCustomLighting(data.data?.lightingType || "");
                    setData({
                      ...data,
                      data: { ...data.data, lightingType: "" },
                    });
                  } else {
                    setData({
                      ...data,
                      data: { ...data.data, lightingType: val },
                    });
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIGHTING_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "other" ? "Other (custom)" : opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!LIGHTING_OPTIONS.includes(data.data?.lightingType) ||
              data.data?.lightingType === "") && (
              <div>
                <Label className="text-sm">Custom Lighting Type</Label>
                <Input
                  value={customLighting}
                  onChange={(e) => {
                    setCustomLighting(e.target.value);
                    setData({
                      ...data,
                      data: { ...data.data, lightingType: e.target.value },
                    });
                  }}
                  className="mt-1"
                  placeholder="Enter custom type..."
                />
              </div>
            )}
          </div>
        )}

        {isPipe && (
          <p className="text-sm text-muted-foreground">
            Irrigation pipe with {module.points?.length || 0} points.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(module.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}