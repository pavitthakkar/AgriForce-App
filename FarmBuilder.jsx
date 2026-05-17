import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import FarmToolbar from "../components/farm/FarmToolbar";
import FarmCanvas from "../components/farm/FarmCanvas";
import ModuleConfigDialog from "../components/farm/ModuleConfigDialog";
import FarmSetupDialog from "../components/farm/FarmSetupDialog";
import PlantAnalytics from "../components/farm/PlantAnalytics";
import EnvironmentTab from "../components/farm/EnvironmentTab";
import AIChat from "../components/farm/AIChat";

const DEFAULT_CANVAS = {
  modules: [],
  structures: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export default function FarmBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isNew = id === "new";

  const [farm, setFarm] = useState(null);
  const [farmName, setFarmName] = useState("Untitled Farm");
  const [farmType, setFarmType] = useState("");
  const [canvasData, setCanvasData] = useState(DEFAULT_CANVAS);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(isNew);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!isNew) {
      loadFarm();
    }
  }, [id]);

  const loadFarm = async () => {
    const data = await base44.entities.Farm.filter({ id });
    if (data.length > 0) {
      const f = data[0];
      setFarm(f);
      setFarmName(f.name);
      setFarmType(f.farm_type);
      const parsed = f.canvas_data ? JSON.parse(f.canvas_data) : DEFAULT_CANVAS;
      setCanvasData(parsed);
      setHistory([parsed]);
      setHistoryIndex(0);
    }
    setLoading(false);
  };

  const pushHistory = useCallback((newData) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newData];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setCanvasData(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setCanvasData(history[historyIndex + 1]);
    }
  };

  const updateCanvas = useCallback((updater) => {
    setCanvasData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: farmName,
      farm_type: farmType,
      canvas_data: JSON.stringify(canvasData),
    };

    if (farm) {
      await base44.entities.Farm.update(farm.id, payload);
      toast.success("Farm saved");
    } else {
      const created = await base44.entities.Farm.create(payload);
      setFarm(created);
      navigate(`/farm/${created.id}`, { replace: true });
      toast.success("Farm created!");
    }
    setSaving(false);
  };

  const handleSetupComplete = (name, type) => {
    setFarmName(name);
    setFarmType(type);
    setShowSetup(false);
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowConfig(true);
  };

  const handleModuleUpdate = (updatedModule) => {
    if (updatedModule.moduleKind === "structure") {
      const { moduleKind, ...structData } = updatedModule;
      updateCanvas((prev) => ({
        ...prev,
        structures: prev.structures.map((s) =>
          s.id === structData.id ? structData : s
        ),
      }));
    } else {
      updateCanvas((prev) => ({
        ...prev,
        modules: prev.modules.map((m) =>
          m.id === updatedModule.id ? updatedModule : m
        ),
      }));
    }
    setShowConfig(false);
    setSelectedModule(null);
  };

  const handleModuleDelete = (moduleId) => {
    updateCanvas((prev) => ({
      ...prev,
      structures: prev.structures.filter((s) => s.id !== moduleId),
      modules: prev.modules.filter((m) => m.id !== moduleId),
    }));
    setShowConfig(false);
    setSelectedModule(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showSetup) {
    return <FarmSetupDialog onComplete={handleSetupComplete} onCancel={isNew && !farm ? () => navigate("/dashboard") : () => setShowSetup(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card/90 backdrop-blur-sm flex items-center justify-between px-3 gap-2 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" />
            <Input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="h-8 w-40 sm:w-56 text-sm font-medium border-none bg-transparent shadow-none focus-visible:ring-1 px-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border bg-card shrink-0">
        {["builder", "analytics", "environment", "ai"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "builder" ? "Builder" : tab === "analytics" ? "Analytics" : tab === "environment" ? "Environment" : "AI Assistant"}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "builder" ? (
          <>
            <FarmToolbar
              farmType={farmType}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              canvasData={canvasData}
              updateCanvas={updateCanvas}
            />
            <FarmCanvas
              farmType={farmType}
              canvasData={canvasData}
              updateCanvas={updateCanvas}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onModuleClick={handleModuleClick}
            />
          </>
        ) : activeTab === "analytics" ? (
          <PlantAnalytics farmId={farm?.id} canvasData={canvasData} />
        ) : activeTab === "environment" ? (
          <EnvironmentTab farmId={farm?.id} />
        ) : (
          <AIChat farm={farm} canvasData={canvasData} />
        )}
      </div>

      {showConfig && selectedModule && (
        <ModuleConfigDialog
          module={selectedModule}
          onUpdate={handleModuleUpdate}
          onDelete={handleModuleDelete}
          farmId={farm?.id}
          onClose={() => {
            setShowConfig(false);
            setSelectedModule(null);
          }}
        />
      )}
    </div>
  );
}