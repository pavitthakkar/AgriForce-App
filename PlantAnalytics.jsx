import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Leaf, Loader2, ImageIcon, StickyNote, Save } from "lucide-react";
import moment from "moment";

const HEALTH_COLORS = {
  poor: "#ef4444",
  fair: "#f59e0b",
  good: "#34d399",
  excellent: "#059669",
};
const HEALTH_LABELS = { poor: "Poor", fair: "Fair", good: "Good", excellent: "Excellent" };
const GROWTH_STAGES = ["seedling", "vegetative", "flowering", "fruiting", "mature"];
const METRIC_OPTIONS = [
  { key: "height_cm", label: "Height (cm)" },
  { key: "width_cm", label: "Width (cm)" },
  { key: "leaf_count", label: "Leaf Count" },
];

function buildWeeks() {
  const weeks = [];
  const today = moment().startOf("day");
  const start = today.clone().subtract(11, "weeks").startOf("week");
  let cur = start.clone();
  while (cur.isSameOrBefore(today, "day")) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = cur.clone().add(d, "days");
      week.push(day.isSameOrBefore(today, "day") ? day.format("YYYY-MM-DD") : null);
    }
    weeks.push(week);
    cur.add(7, "days");
  }
  return weeks;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const TODAY = moment().format("YYYY-MM-DD");

export default function PlantAnalytics({ farmId, canvasData }) {
  const plantModules = (canvasData.modules || []).filter((m) => m.type === "plant");

  const [selectedId, setSelectedId] = useState(plantModules[0]?.id || "");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("height_cm");

  // Today's measurement form state
  const [measure, setMeasure] = useState({ growth_stage: "", height_cm: "", width_cm: "", leaf_count: "" });
  const [savingMeasure, setSavingMeasure] = useState(false);

  const weeks = buildWeeks();

  useEffect(() => {
    if (selectedId) loadLogs(selectedId);
  }, [selectedId]);

  // Pre-fill today's measurements if a log exists
  useEffect(() => {
    const todayLog = logs.find((l) => l.date === TODAY);
    if (todayLog) {
      setMeasure({
        growth_stage: todayLog.growth_stage || "",
        height_cm: todayLog.height_cm ?? "",
        width_cm: todayLog.width_cm ?? "",
        leaf_count: todayLog.leaf_count ?? "",
      });
    } else {
      setMeasure({ growth_stage: "", height_cm: "", width_cm: "", leaf_count: "" });
    }
  }, [logs]);

  const loadLogs = async (moduleId) => {
    setLoading(true);
    const data = await base44.entities.PlantLog.filter({ farm_id: farmId, module_id: moduleId });
    setLogs(data);
    setLoading(false);
  };

  const handleSaveMeasurement = async () => {
    setSavingMeasure(true);
    const todayLog = logs.find((l) => l.date === TODAY);
    const payload = {
      farm_id: farmId,
      module_id: selectedId,
      date: TODAY,
      growth_stage: measure.growth_stage || undefined,
      height_cm: measure.height_cm !== "" ? parseFloat(measure.height_cm) : undefined,
      width_cm: measure.width_cm !== "" ? parseFloat(measure.width_cm) : undefined,
      leaf_count: measure.leaf_count !== "" ? parseInt(measure.leaf_count) : undefined,
    };
    if (todayLog) {
      await base44.entities.PlantLog.update(todayLog.id, payload);
    } else {
      await base44.entities.PlantLog.create(payload);
    }
    await loadLogs(selectedId);
    setSavingMeasure(false);
  };

  const logByDate = {};
  logs.forEach((l) => { logByDate[l.date] = l; });

  const selectedModule = plantModules.find((m) => m.id === selectedId);

  // Chart data — sorted by date, only entries with the selected metric
  const chartData = [...logs]
    .filter((l) => l[selectedMetric] != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: moment(l.date).format("MMM D"), value: l[selectedMetric] }));

  if (plantModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-3">
        <Leaf className="w-10 h-10 opacity-30" />
        <p className="text-sm">No plant modules in this farm yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-8">
      {/* 1. Module selector */}
      <div className="flex items-center gap-4">
        <div className="w-72">
          <Label className="text-sm font-medium mb-1.5 block">Select Plant Module</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a plant…" />
            </SelectTrigger>
            <SelectContent>
              {plantModules.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 text-primary" />
                    <span>{m.data?.name || "Unnamed Plant"}</span>
                    {m.data?.snapLabel && (
                      <span className="text-muted-foreground text-xs">· {m.data.snapLabel}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedModule && (
          <div className="mt-5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedModule.data?.name}</span>
            {selectedModule.data?.snapLabel && ` · ${selectedModule.data.snapLabel}`}
            {" · "}{logs.length} log{logs.length !== 1 ? "s" : ""} recorded
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* 2. Health Tracker Grid */}
          <div>
            <h2 className="text-base font-semibold mb-4">Health Tracker — Last 12 Weeks</h2>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex gap-1.5">
                <div className="flex flex-col gap-1.5 mr-1">
                  {DAYS.map((d, i) => (
                    <div key={i} className="w-4 h-4 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                      {i % 2 === 1 ? d : ""}
                    </div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1.5">
                    {week.map((date, di) => {
                      const log = date ? logByDate[date] : null;
                      const color = log?.health_status ? HEALTH_COLORS[log.health_status] : null;
                      const isToday = date === TODAY;
                      return (
                        <div
                          key={di}
                          title={date ? `${date}${log?.health_status ? ` — ${HEALTH_LABELS[log.health_status]}` : ""}` : ""}
                          className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                          style={{
                            backgroundColor: color || "hsl(var(--muted))",
                            outline: isToday ? "2px solid hsl(var(--primary))" : "none",
                            outlineOffset: "1px",
                            opacity: date ? 1 : 0,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-muted border border-border" />
                  <span className="text-xs text-muted-foreground">No data</span>
                </div>
                {Object.entries(HEALTH_COLORS).map(([k, c]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-xs text-muted-foreground capitalize">{k}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Measurement Recorder (Today) */}
          <div>
            <h2 className="text-base font-semibold mb-1">Today's Measurements</h2>
            <p className="text-xs text-muted-foreground mb-4">{moment(TODAY).format("dddd, MMMM D, YYYY")}</p>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Growth Stage</Label>
                  <Select value={measure.growth_stage} onValueChange={(v) => setMeasure({ ...measure, growth_stage: v })}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROWTH_STAGES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Height (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={measure.height_cm}
                    onChange={(e) => setMeasure({ ...measure, height_cm: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Width (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={measure.width_cm}
                    onChange={(e) => setMeasure({ ...measure, width_cm: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Leaf Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={measure.leaf_count}
                    onChange={(e) => setMeasure({ ...measure, leaf_count: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="e.g. 6"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveMeasurement} disabled={savingMeasure} className="gap-2">
                  <Save className="w-3.5 h-3.5" />
                  {savingMeasure ? "Saving…" : "Save Measurements"}
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Growth Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Growth Over Time</h2>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              {chartData.length < 2 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Not enough data yet — log measurements on multiple days to see a graph.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={METRIC_OPTIONS.find((m) => m.key === selectedMetric)?.label}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 5. Journal History */}
          <div>
            <h2 className="text-base font-semibold mb-4">Journal History</h2>
            {logs.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No journal entries yet for this plant.
              </div>
            ) : (
              <div className="space-y-3">
                {[...logs]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => (
                    <div key={log.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            {moment(log.date).format("ddd, MMM D, YYYY")}
                          </span>
                          {log.growth_stage && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                              {log.growth_stage}
                            </span>
                          )}
                        </div>
                        {log.health_status && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize text-white"
                            style={{ backgroundColor: HEALTH_COLORS[log.health_status] }}
                          >
                            {log.health_status}
                          </span>
                        )}
                      </div>

                      {/* Measurements inline */}
                      {(log.height_cm != null || log.width_cm != null || log.leaf_count != null) && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {log.height_cm != null && <span>📏 {log.height_cm} cm tall</span>}
                          {log.width_cm != null && <span>↔ {log.width_cm} cm wide</span>}
                          {log.leaf_count != null && <span>🌿 {log.leaf_count} leaves</span>}
                        </div>
                      )}

                      {log.note && (
                        <div className="flex gap-2 text-sm">
                          <StickyNote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-muted-foreground whitespace-pre-wrap">{log.note}</p>
                        </div>
                      )}

                      {log.photo_url && (
                        <div className="flex gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          <img
                            src={log.photo_url}
                            alt={`Plant on ${log.date}`}
                            className="rounded-lg max-h-48 object-cover border border-border"
                          />
                        </div>
                      )}

                      {!log.note && !log.photo_url && log.height_cm == null && log.width_cm == null && log.leaf_count == null && (
                        <p className="text-xs text-muted-foreground italic">Health status logged only.</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}