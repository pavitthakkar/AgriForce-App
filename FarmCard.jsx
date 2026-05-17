import { Link } from "react-router-dom";
import { MoreVertical, Trash2, Copy, Grid3X3, CircleDot, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import moment from "moment";

const FARM_TYPE_LABELS = {
  vertical_rack: "Vertical Rack",
  tower: "Tower System",
  a_frame: "A-Frame System",
};

const FARM_TYPE_ICONS = {
  vertical_rack: Grid3X3,
  tower: CircleDot,
  a_frame: Triangle,
};

const FARM_TYPE_COLORS = {
  vertical_rack: "bg-emerald-100 text-emerald-700",
  tower: "bg-sky-100 text-sky-700",
  a_frame: "bg-amber-100 text-amber-700",
};

export default function FarmCard({ farm, onDelete, onDuplicate }) {
  const Icon = FARM_TYPE_ICONS[farm.farm_type] || Grid3X3;
  const colorClass = FARM_TYPE_COLORS[farm.farm_type] || "bg-muted text-muted-foreground";

  const getModuleCount = () => {
    if (!farm.canvas_data) return 0;
    try {
      const data = JSON.parse(farm.canvas_data);
      return data.modules ? data.modules.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <Link to={`/farm/${farm.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground">
            {moment(farm.updated_date).fromNow()}
          </span>
        </div>

        <h3 className="font-heading font-semibold text-lg mb-1 truncate">
          {farm.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {FARM_TYPE_LABELS[farm.farm_type]} · {getModuleCount()} modules
        </p>

        {farm.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {farm.notes}
          </p>
        )}
      </Link>

      <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(farm)}>
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(farm.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}