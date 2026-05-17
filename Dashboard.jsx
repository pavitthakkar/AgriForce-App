import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Sprout, MoreVertical, Trash2, Pencil, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FarmCard from "../components/farm/FarmCard";

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    const user = await base44.auth.me();
    const data = await base44.entities.Farm.filter({ created_by: user.email }, "-updated_date");
    setFarms(data);
    setLoading(false);
  };

  const deleteFarm = async (id) => {
    await base44.entities.Farm.delete(id);
    setFarms((prev) => prev.filter((f) => f.id !== id));
  };

  const duplicateFarm = async (farm) => {
    const newFarm = await base44.entities.Farm.create({
      name: `${farm.name} (Copy)`,
      farm_type: farm.farm_type,
      canvas_data: farm.canvas_data,
      notes: farm.notes,
    });
    setFarms((prev) => [newFarm, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          Your Farms
        </h1>
        <p className="text-muted-foreground mt-2">
          Build and manage your vertical farm layouts
        </p>
      </div>

      {farms.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 sm:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading text-xl font-semibold mb-2">
            No farms yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first vertical farm layout and start building a digital replica of your setup.
          </p>
          <Link to="/farm/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Farm
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            to="/farm/new"
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-200 min-h-[200px]"
          >
            <Plus className="w-8 h-8" />
            <span className="font-medium">New Farm</span>
          </Link>

          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onDelete={deleteFarm}
              onDuplicate={duplicateFarm}
            />
          ))}
        </div>
      )}
    </div>
  );
}