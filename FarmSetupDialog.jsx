import { useState } from "react";
import { Grid3X3, CircleDot, Triangle, Sprout, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FARM_TYPES = [
  {
    id: "vertical_rack",
    label: "Vertical Rack",
    desc: "Rows and columns of growing trays on shelving units",
    icon: Grid3X3,
    color: "border-emerald-300 bg-emerald-50 text-emerald-700",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500/30",
  },
  {
    id: "tower",
    label: "Tower System",
    desc: "Vertical towers with planting spots along their height",
    icon: CircleDot,
    color: "border-sky-300 bg-sky-50 text-sky-700",
    activeColor: "border-sky-500 bg-sky-100 ring-2 ring-sky-500/30",
  },
  {
    id: "a_frame",
    label: "A-Frame",
    desc: "A-shaped frames that hold plants on angled surfaces",
    icon: Triangle,
    color: "border-amber-300 bg-amber-50 text-amber-700",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-500/30",
  },
];

export default function FarmSetupDialog({ onComplete, onCancel }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative">
        {onCancel && (
          <button onClick={onCancel} className="absolute -top-2 right-0 p-1.5 rounded-full hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            Create New Farm
          </h1>
          <p className="text-muted-foreground mt-2">
            Name your farm and choose the farming system
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Farm Name</Label>
            <Input
              placeholder="e.g. Greenhouse A, Indoor Lab..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Farm Type</Label>
            <div className="grid gap-3">
              {FARM_TYPES.map((ft) => {
                const Icon = ft.icon;
                const isActive = type === ft.id;
                return (
                  <button
                    key={ft.id}
                    onClick={() => setType(ft.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isActive ? ft.activeColor : `${ft.color} hover:shadow-md`
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-semibold">{ft.label}</div>
                      <div className="text-sm opacity-75">{ft.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => onComplete(name || "Untitled Farm", type)}
            disabled={!type}
            size="lg"
            className="w-full gap-2"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}