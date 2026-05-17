import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Trash2, LogOut, ShieldAlert, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Delete all user's farms first
    const farms = await base44.entities.Farm.filter({ created_by: user.email });
    await Promise.all(farms.map((f) => base44.entities.Farm.delete(f.id)));
    logout();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account details</p>
      </div>

      {/* Profile Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Profile
        </h2>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Full Name</Label>
          <div className="h-9 px-3 flex items-center text-sm bg-muted rounded-md border border-border text-muted-foreground">
            {user?.full_name || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email Address</Label>
          <div className="h-9 px-3 flex items-center text-sm bg-muted rounded-md border border-border text-muted-foreground gap-2">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            {user?.email || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <div className="h-9 px-3 flex items-center text-sm bg-muted rounded-md border border-border text-muted-foreground capitalize">
            {user?.role || "user"}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <LogOut className="w-4 h-4 text-primary" /> Session
        </h2>
        <p className="text-sm text-muted-foreground">Sign out of your AgriForce account on this device.</p>
        <Button variant="outline" onClick={() => logout()} className="gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2 text-destructive">
          <ShieldAlert className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account. This will remove all your farms and data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all associated farms, plant logs, and environment data. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}