import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, Pin, PinOff, Plus, ChevronLeft, Trash2, Camera, X, ScanSearch } from "lucide-react";
import moment from "moment";

function buildFarmContext(farm, canvasData, envLogs, plantLogs) {
  const structures = canvasData.structures || [];
  const modules = canvasData.modules || [];
  const plantModules = modules.filter((m) => m.type === "plant");
  const lightModules = modules.filter((m) => m.type === "lighting");
  const pipes = modules.filter((m) => m.type === "pipe");

  let ctx = `FARM OVERVIEW\nName: ${farm?.name || "Unknown"}\nType: ${farm?.farm_type || "Unknown"}\n\n`;

  ctx += `STRUCTURES (${structures.length} total)\n`;
  structures.forEach((s) => {
    if (s.type === "rack") ctx += `- Rack "${s.label}": ${s.rows} rows × ${s.cols} cols (cell size ${s.cellWidth}×${s.cellHeight}px)\n`;
    else if (s.type === "tower") ctx += `- Tower "${s.label}": ${s.spots} planting spots, height ${s.towerHeight}px\n`;
    else if (s.type === "a_frame") ctx += `- A-Frame "${s.label}": ${s.slotsPerSide} slots per side\n`;
  });

  ctx += `\nPLANT MODULES (${plantModules.length} total)\n`;
  plantModules.length === 0
    ? (ctx += `- None placed yet\n`)
    : plantModules.forEach((m) => { ctx += `- Plant: "${m.data?.name || "Unnamed"}" at ${m.data?.snapLabel || "free-placed"}\n`; });

  ctx += `\nLIGHTING MODULES (${lightModules.length} total)\n`;
  lightModules.length === 0
    ? (ctx += `- None placed yet\n`)
    : lightModules.forEach((m) => { ctx += `- Light: "${m.data?.lightingType || "Unknown type"}" at ${m.data?.snapLabel || "free-placed"}\n`; });

  ctx += `\nIRRIGATION PIPES: ${pipes.length}\n`;

  const weekAgo = moment().subtract(7, "days");
  const recentEnv = envLogs.filter((l) => moment(l.created_date).isAfter(weekAgo))
    .sort((a, b) => b.created_date?.localeCompare?.(a.created_date) || 0);

  ctx += `\nENVIRONMENT READINGS — LAST 7 DAYS (${recentEnv.length} readings)\n`;
  recentEnv.length === 0 ? (ctx += `- No readings in the past 7 days\n`) : recentEnv.forEach((l) => {
    const parts = [];
    if (l.temperature_c != null) parts.push(`Temp: ${l.temperature_c}°C`);
    if (l.humidity_pct != null) parts.push(`Humidity: ${l.humidity_pct}%`);
    if (l.co2_ppm != null) parts.push(`CO₂: ${l.co2_ppm}ppm`);
    if (l.light_intensity_lux != null) parts.push(`Light: ${l.light_intensity_lux}lux`);
    if (l.airflow_ms != null) parts.push(`Airflow: ${l.airflow_ms}m/s`);
    if (l.water_ph != null) parts.push(`pH: ${l.water_ph}`);
    ctx += `[${moment(l.created_date).format("MMM D, h:mm A")}] ${parts.join(" | ")}${l.note ? ` — ${l.note}` : ""}\n`;
  });

  ctx += `\nPLANT HEALTH & GROWTH LOGS\n`;
  if (plantLogs.length === 0) {
    ctx += `- No plant logs recorded yet\n`;
  } else {
    const byModule = {};
    plantLogs.forEach((l) => { if (!byModule[l.module_id]) byModule[l.module_id] = []; byModule[l.module_id].push(l); });
    Object.entries(byModule).forEach(([moduleId, logs]) => {
      const mod = plantModules.find((m) => m.id === moduleId);
      ctx += `Plant "${mod?.data?.name || "Unknown"}" at ${mod?.data?.snapLabel || "unknown"} (${logs.length} entries):\n`;
      [...logs].sort((a, b) => b.date?.localeCompare?.(a.date) || 0).slice(0, 10).forEach((l) => {
        const parts = [];
        if (l.health_status) parts.push(`Health: ${l.health_status}`);
        if (l.growth_stage) parts.push(`Stage: ${l.growth_stage}`);
        if (l.height_cm != null) parts.push(`Height: ${l.height_cm}cm`);
        if (l.width_cm != null) parts.push(`Width: ${l.width_cm}cm`);
        if (l.leaf_count != null) parts.push(`Leaves: ${l.leaf_count}`);
        ctx += `  [${l.date}] ${parts.join(" | ")}${l.note ? ` — ${l.note}` : ""}\n`;
      });
    });
  }
  return ctx;
}

const SYSTEM_PROMPT = (farmContext) => `You are an expert vertical farming assistant with deep knowledge of hydroponics, controlled environment agriculture, plant biology, lighting, and nutrient management.

You have full visibility into this specific farm's current state. Use this context to give accurate, specific answers. Always reference actual data from the farm when relevant.

--- CURRENT FARM DATA ---
${farmContext}
--- END FARM DATA ---

Guidelines:
- Answer questions about the farm using the data above (plant counts, light types, environmental readings, etc.)
- Identify problems and suggest actionable solutions based on real readings
- Be concise and practical
- If asked about data that isn't logged yet, say so clearly`;

const INITIAL_MESSAGE = (farmName) => ({
  role: "assistant",
  content: `Hi! I'm your farm assistant. I have full context of **${farmName || "your farm"}** — its layout, plant modules, lighting, environment readings, and plant health logs. Ask me anything!`,
});

export default function AIChat({ farm, canvasData }) {
  const [view, setView] = useState("chat"); // "chat" | "pinned"
  const [messages, setMessages] = useState([INITIAL_MESSAGE(farm?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [envLogs, setEnvLogs] = useState([]);
  const [plantLogs, setPlantLogs] = useState([]);
  const [contextReady, setContextReady] = useState(false);
  const [pinnedConvos, setPinnedConvos] = useState([]);
  const [pinning, setPinning] = useState(false);
  const [currentConvoId, setCurrentConvoId] = useState(null); // id if loaded from pinned
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { if (farm?.id) { loadContext(); loadPinned(); } }, [farm?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const loadContext = async () => {
    const [envData, plantData] = await Promise.all([
      base44.entities.EnvironmentLog.filter({ farm_id: farm.id }),
      base44.entities.PlantLog.filter({ farm_id: farm.id }),
    ]);
    setEnvLogs(envData);
    setPlantLogs(plantData);
    setContextReady(true);
  };

  const loadPinned = async () => {
    const data = await base44.entities.AIConversation.filter({ farm_id: farm.id });
    setPinnedConvos(data.sort((a, b) => b.created_date?.localeCompare?.(a.created_date) || 0));
  };

const sendMessage = async () => {
  if (!input.trim() || loading) return;
  const userMsg = { role: "user", content: input.trim() };
  const newMessages = [...messages, userMsg];
  setMessages(newMessages);
  setInput("");
  setLoading(true);

  try {
    const farmContext = buildFarmContext(farm, canvasData, envLogs, plantLogs);
    const history = newMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const response = await fetch("https://pavsts-agriforce-rag-system.hf.space/chat", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `${SYSTEM_PROMPT(farmContext)}\n\nConversation so far:\n${history}\n\nUser: ${input.trim()}`,
        session_id: farm?.id || "default"
      })
    });

    const data = await response.json();
    const assistantMsg = {
      role: "assistant",
      content: data.response || "Sorry, I couldn't generate a response."
    };

    const finalMessages = [...newMessages, assistantMsg];
    setMessages(finalMessages);

    // Auto-update pinned convo if currently viewing one
    if (currentConvoId) {
      await base44.entities.AIConversation.update(currentConvoId, {
        messages: JSON.stringify(finalMessages)
      });
      loadPinned();
    }
  } catch (error) {
    setMessages([...newMessages, {
      role: "assistant",
      content: "Sorry, I couldn't connect to the AI backend. Make sure the server is running."
    }]);
  } finally {
    setLoading(false);
  }
};

  const handlePin = async () => {
    setPinning(true);
    // Generate a short title from first user message
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
      : `Chat — ${moment().format("MMM D, h:mm A")}`;

    if (currentConvoId) {
      await base44.entities.AIConversation.update(currentConvoId, { messages: JSON.stringify(messages), title });
    } else {
      const created = await base44.entities.AIConversation.create({
        farm_id: farm.id,
        title,
        messages: JSON.stringify(messages),
        pinned: true,
      });
      setCurrentConvoId(created.id);
    }
    await loadPinned();
    setPinning(false);
  };

  const handleUnpin = async () => {
    if (!currentConvoId) return;
    await base44.entities.AIConversation.delete(currentConvoId);
    setCurrentConvoId(null);
    await loadPinned();
  };

  const loadConvo = (convo) => {
    setMessages(JSON.parse(convo.messages));
    setCurrentConvoId(convo.id);
    setView("chat");
  };

  const newChat = () => {
    setMessages([INITIAL_MESSAGE(farm?.name)]);
    setCurrentConvoId(null);
    setInput("");
  };

  const deleteConvo = async (id) => {
    setDeletingId(id);
    await base44.entities.AIConversation.delete(id);
    if (currentConvoId === id) { newChat(); }
    await loadPinned();
    setDeletingId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const analyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzingImage(true);

    const userMsg = { role: "user", content: "📷 Image sent for analysis", image: imagePreview };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    clearImage();

    try {
      const farmContext = buildFarmContext(farm, canvasData, envLogs, plantLogs);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("question", `You are an expert vertical farming assistant analyzing a crop image for a specific farm. 

      Here is the current farm data:
      ${farmContext}

      Please analyze this image and provide:
      1) Plant/crop identification
      2) Health assessment
      3) Any visible diseases, pests or deficiencies
      4) Specific recommendations based on THIS farm's actual data (reference real readings like lighting, temperature, humidity where relevant)`);

      const response = await fetch("https://pavsts-agriforce-rag-system.hf.space/analyze-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const assistantMsg = {
        role: "assistant",
        content: data.response || data.result || "Sorry, I couldn't analyze the image.",
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      if (currentConvoId) {
        await base44.entities.AIConversation.update(currentConvoId, { messages: JSON.stringify(finalMessages) });
        loadPinned();
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't analyze the image. Make sure the server is running." }]);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const isPinned = !!currentConvoId;
  const hasUserMessage = messages.some((m) => m.role === "user");

  if (view === "pinned") {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("chat")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-semibold">Pinned Conversations</h2>
          <span className="text-xs text-muted-foreground">({pinnedConvos.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
          {pinnedConvos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No pinned conversations yet. Start a chat and click the pin button to save it.
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedConvos.map((convo) => {
                const msgs = JSON.parse(convo.messages || "[]");
                const preview = msgs.filter((m) => m.role === "user")[0]?.content || "No messages";
                return (
                  <div key={convo.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:border-primary/40 transition-colors cursor-pointer group" onClick={() => loadConvo(convo)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{convo.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{preview}</p>
                      <p className="text-xs text-muted-foreground mt-1">{moment(convo.created_date).format("MMM D, YYYY · h:mm A")} · {msgs.length} messages</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteConvo(convo.id); }}
                      disabled={deletingId === convo.id}
                    >
                      {deletingId === convo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Chat toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          {currentConvoId && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium flex items-center gap-1">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {!currentConvoId && hasUserMessage && (
            <span className="text-xs text-muted-foreground">Unsaved conversation</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setView("pinned")}>
            <Pin className="w-3.5 h-3.5" />
            Pinned ({pinnedConvos.length})
          </Button>
          {hasUserMessage && (
            isPinned ? (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={handleUnpin} disabled={pinning}>
                <PinOff className="w-3.5 h-3.5" /> Unpin
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePin} disabled={pinning}>
                {pinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pin className="w-3.5 h-3.5" />}
                Pin
              </Button>
            )
          )}
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={newChat}>
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border text-foreground rounded-tl-sm"
            }`}>
              {msg.image && (
                <img src={msg.image} alt="uploaded" className="rounded-lg mb-2 max-w-[200px] max-h-[200px] object-cover" />
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!contextReady && (
        <div className="text-center py-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading farm context…
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Image preview */}
          {imagePreview && (
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-3">
              <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{imageFile?.name}</p>
                <p className="text-xs text-muted-foreground">Ready to analyze</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button onClick={analyzeImage} disabled={analyzingImage} size="sm" className="gap-1.5 h-8">
                  {analyzingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanSearch className="w-3.5 h-3.5" />}
                  Analyze Image
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearImage}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || analyzingImage}
              title="Upload image for analysis"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your farm…"
              className="flex-1"
              disabled={loading || analyzingImage}
            />
            <Button onClick={sendMessage} disabled={loading || analyzingImage || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          AI has full access to your farm layout, environment readings, and plant logs.
        </p>
      </div>
    </div>
  );
}