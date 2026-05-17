import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

const HEALTH_OPTIONS = ["poor", "fair", "good", "excellent"];
const HEALTH_COLORS = {
  poor: "text-red-500",
  fair: "text-amber-500",
  good: "text-emerald-500",
  excellent: "text-emerald-700",
};

export default function PlantJournal({ module, farmId }) {
  const today = moment().format("YYYY-MM-DD");
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [healthInput, setHealthInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    loadLog();
  }, [module.id]);

  const loadLog = async () => {
    setLoading(true);
    const logs = await base44.entities.PlantLog.filter({
      farm_id: farmId,
      module_id: module.id,
      date: today,
    });
    const existing = logs[0] || null;
    setLog(existing);
    setHealthInput(existing?.health_status || "");
    setNoteInput("");
    setLoading(false);
  };

  const saveHealth = async (value) => {
    setHealthInput(value);
    setSaving(true);
    if (log) {
      const updated = await base44.entities.PlantLog.update(log.id, { health_status: value });
      setLog(updated);
    } else {
      const created = await base44.entities.PlantLog.create({
        farm_id: farmId,
        module_id: module.id,
        date: today,
        health_status: value,
      });
      setLog(created);
    }
    setSaving(false);
  };

  const addNote = async () => {
    if (!noteInput.trim()) return;
    setSaving(true);
    const combined = log?.note
      ? `${log.note}\n\n[${moment().format("h:mm A")}] ${noteInput.trim()}`
      : `[${moment().format("h:mm A")}] ${noteInput.trim()}`;
    if (log) {
      const updated = await base44.entities.PlantLog.update(log.id, { note: combined });
      setLog(updated);
    } else {
      const created = await base44.entities.PlantLog.create({
        farm_id: farmId,
        module_id: module.id,
        date: today,
        note: combined,
      });
      setLog(created);
    }
    setNoteInput("");
    setSaving(false);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (log) {
      const updated = await base44.entities.PlantLog.update(log.id, { photo_url: file_url });
      setLog(updated);
    } else {
      const created = await base44.entities.PlantLog.create({
        farm_id: farmId,
        module_id: module.id,
        date: today,
        photo_url: file_url,
      });
      setLog(created);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{today}</span>
        {saving && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
      </div>

      {/* Health Status */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Health Status</Label>
        <Select value={healthInput} onValueChange={saveHealth}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select status…" />
          </SelectTrigger>
          <SelectContent>
            {HEALTH_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                <span className={`capitalize font-medium ${HEALTH_COLORS[opt]}`}>{opt}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Daily Notes */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Daily Notes</Label>
        {log?.note ? (
          <div className="text-xs text-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap max-h-36 overflow-y-auto">
            {log.note}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No notes yet</p>
        )}
        <div className="flex gap-2 mt-2">
          <Textarea
            placeholder="Add a daily observation…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className="text-sm min-h-[64px] resize-none"
            onKeyDown={(e) => e.key === "Enter" && e.metaKey && addNote()}
          />
          <Button
            size="icon"
            className="shrink-0 self-end h-9 w-9"
            onClick={addNote}
            disabled={!noteInput.trim() || saving}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Photo */}
      <div>
        <Label className="text-sm font-semibold mb-1.5 block">Today's Photo</Label>
        {log?.photo_url ? (
          <div className="relative">
            <img src={log.photo_url} alt="Plant" className="w-full rounded-lg object-cover max-h-40" />
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full gap-2 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              Replace Photo
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            Add Photo
          </Button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
      </div>
    </div>
  );
}