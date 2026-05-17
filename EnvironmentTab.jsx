import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Thermometer, Droplets, Wind, Sun, FlaskConical, Waves, StickyNote, Trash2 } from "lucide-react";
import moment from "moment";

const FIELDS = [
  { key: "temperature_c", label: "Temperature", unit: "°C", icon: Thermometer, placeholder: "e.g. 22", step: "0.1" },
  { key: "humidity_pct", label: "Humidity", unit: "%", icon: Droplets, placeholder: "e.g. 65", step: "0.1" },
  { key: "co2_ppm", label: "CO₂", unit: "ppm", icon: Wind, placeholder: "e.g. 800", step: "1" },
  { key: "light_intensity_lux", label: "Light Intensity", unit: "lux", icon: Sun, placeholder: "e.g. 5000", step: "1" },
  { key: "airflow_ms", label: "Airflow", unit: "m/s", icon: Waves, placeholder: "e.g. 0.5", step: "0.01" },
  { key: "water_ph", label: "Water pH", unit: "pH", icon: FlaskConical, placeholder: "e.g. 6.2", step: "0.1" },
];

const emptyForm = () => ({ temperature_c: "", humidity_pct: "", co2_ppm: "", light_intensity_lux: "", airflow_ms: "", water_ph: "", note: "" });

export default function EnvironmentTab({ farmId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (farmId) loadLogs();
  }, [farmId]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await base44.entities.EnvironmentLog.filter({ farm_id: farmId });
    setLogs(data.sort((a, b) => b.created_date?.localeCompare?.(a.created_date) || 0));
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { farm_id: farmId, note: form.note || undefined };
    FIELDS.forEach(({ key }) => {
      if (form[key] !== "") payload[key] = parseFloat(form[key]);
    });
    await base44.entities.EnvironmentLog.create(payload);
    setForm(emptyForm());
    await loadLogs();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    await base44.entities.EnvironmentLog.delete(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  };

  const hasAnyValue = FIELDS.some(({ key }) => form[key] !== "");

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-8">
      {/* Recorder */}
      <div>
        <h2 className="text-base font-semibold mb-1">Log Environment Reading</h2>
        <p className="text-xs text-muted-foreground mb-4">{moment().format("dddd, MMMM D, YYYY · h:mm A")}</p>
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FIELDS.map(({ key, label, unit, icon: Icon, placeholder, step }) => (
              <div key={key}>
                <Label className="text-xs mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {label}
                  <span className="text-muted-foreground/70">({unit})</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={step}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="h-8 text-sm"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs mb-1.5 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
              Note (optional)
            </Label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="h-8 text-sm"
              placeholder="Any observations…"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving || !hasAnyValue} className="gap-2">
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Log Reading"}
            </Button>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold mb-4">Reading History</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            No environment readings logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {moment(log.created_date).format("ddd, MMM D, YYYY · h:mm A")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id}
                  >
                    {deletingId === log.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FIELDS.map(({ key, label, unit, icon: Icon }) =>
                    log[key] != null ? (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-medium">{log[key]} {unit}</span>
                      </div>
                    ) : null
                  )}
                </div>

                {log.note && (
                  <div className="flex gap-2 text-sm border-t border-border pt-3">
                    <StickyNote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{log.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}