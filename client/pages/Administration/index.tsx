import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { LOCATIONS } from "@/data/locations";
import { APP_USERS } from "@/data/users";
import { toast } from "sonner";

const ISSUE_CATEGORIES = [
  "Inventory", "Insurance", "Staffing", "Workflow Delay", "Technology",
  "Vendor", "Shipping", "Prescription Clarification", "Capacity", "Other",
];

const SERVICE_TARGETS = [
  { metric: "Prescription Turnaround Time", target: "35 minutes", current: "38 min" },
  { metric: "Service Level %", target: "≥95%", current: "89%" },
  { metric: "Exception Resolution Time", target: "≤2 business days", current: "2.4 days" },
  { metric: "Critical Exception Response", target: "≤30 minutes", current: "22 min" },
  { metric: "Backlog Clearance", target: "Same business day", current: "1.1 days" },
];

export default function Administration() {
  const { currentUserRole, setCurrentUserRole, userName, setUserName, userEmail, setUserEmail } = useAppContext();
  const [editingTargets, setEditingTargets] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Application settings, role management, and configuration (Demo)
        </p>
      </div>

      <div className="px-6 pb-6 space-y-4 max-w-5xl">
        {/* Current user settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon="user" className="w-4 h-4 text-primary" />
              User Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">User Role (Demo Switcher)</Label>
                <Select value={currentUserRole} onValueChange={(v) => setCurrentUserRole(v as typeof currentUserRole)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharmacy Staff">Pharmacy Staff</SelectItem>
                    <SelectItem value="Pharmacy Manager">Pharmacy Manager</SelectItem>
                    <SelectItem value="Pharmacy Administrator">Pharmacy Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Default Location</Label>
                <Select defaultValue="loc-01">
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notification Preference</Label>
                <Select defaultValue="Both">
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="In-App">In-App</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dashboard Default Date Range</Label>
                <Select defaultValue="30d">
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="14d">Last 14 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Button size="sm" onClick={() => { setUserName(editName); setUserEmail(editEmail); toast.success("Preferences saved"); }}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon="shield" className="w-4 h-4 text-primary" />
              Application Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  role: "Pharmacy Staff",
                  permissions: ["Create issues for assigned locations", "Update issues assigned to them", "View own location dashboard", "Add notes to assigned exceptions"],
                  color: "bg-blue-100 text-blue-800 border-blue-200",
                },
                {
                  role: "Pharmacy Manager",
                  permissions: ["All Staff permissions", "View all issues for their locations", "Reassign work to staff", "Manage location-level metrics", "Export operational data"],
                  color: "bg-purple-100 text-purple-800 border-purple-200",
                },
                {
                  role: "Pharmacy Administrator",
                  permissions: ["All Manager permissions", "View all locations and data", "Manage configuration & targets", "Manage user roles and access", "System-wide reporting", "Manage categories & assignments"],
                  color: "bg-green-100 text-green-800 border-green-200",
                },
              ].map((r) => (
                <div key={r.role} className="rounded-lg border p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${r.color}`}>{r.role}</span>
                    {r.role === currentUserRole && <Badge variant="default" className="text-[10px]">Active</Badge>}
                  </div>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 mt-1">
                    {r.permissions.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service targets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="target" className="w-4 h-4 text-primary" />
                Service-Level Targets
              </CardTitle>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setEditingTargets(!editingTargets)}>
                {editingTargets ? "Cancel" : "Edit Targets"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">Metric</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">Target</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">Current Performance</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {SERVICE_TARGETS.map((t) => (
                  <tr key={t.metric} className="border-b border-border/50">
                    <td className="py-2.5 text-xs font-medium">{t.metric}</td>
                    <td className="py-2.5 text-xs">{editingTargets ? <Input defaultValue={t.target} className="h-7 text-xs w-32" /> : t.target}</td>
                    <td className="py-2.5 text-xs">{t.current}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                        parseFloat(t.current) <= parseFloat(t.target.replace(/[^\d.]/g, "")) || t.current.includes("22")
                          ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {parseFloat(t.current) <= parseFloat(t.target.replace(/[^\d.]/g, "")) || t.current.includes("22") ? "On Target" : "Below Target"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editingTargets && (
              <div className="mt-3">
                <Button size="sm" onClick={() => { setEditingTargets(false); toast.success("Targets updated (demo)"); }}>
                  Save Targets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon="tags" className="w-4 h-4 text-primary" />
              Manage Issue Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ISSUE_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-muted/40 text-xs">
                  {c}
                  <button className="text-muted-foreground hover:text-red-600 transition-colors">
                    <Icon icon="x" className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                <Icon icon="plus" className="w-3 h-3" /> Add Category
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Icon icon="users" className="w-4 h-4 text-primary" />
              Assignment Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {APP_USERS.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-md border bg-background text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon icon="user" className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-muted-foreground text-[10px]">{u.role} • {LOCATIONS.find((l) => l.id === u.defaultLocation)?.name.split(" ").slice(0, 2).join(" ")}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{u.role.split(" ").pop()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
