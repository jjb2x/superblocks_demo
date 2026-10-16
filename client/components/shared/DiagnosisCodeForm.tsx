import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";

// Synthetic ICD-10 reference list (demo only)
const ICD10_CODES: Record<string, string> = {
  "E11.9": "Type 2 diabetes mellitus without complications",
  "I10": "Essential (primary) hypertension",
  "E78.5": "Hyperlipidemia, unspecified",
  "J45.909": "Unspecified asthma, uncomplicated",
  "N18.3": "Chronic kidney disease, stage 3",
  "Z94.0": "Kidney transplant status",
  "I48.91": "Unspecified atrial fibrillation",
  "F32.9": "Major depressive disorder, single episode, unspecified",
};

interface DiagnosisEntry {
  id: number;
  code: string;
  description: string;
  type: "Primary" | "Secondary";
}

export default function DiagnosisCodeForm() {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Primary" | "Secondary">("Primary");
  const [entries, setEntries] = useState<DiagnosisEntry[]>([]);

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase();
    setCode(upper);
    if (ICD10_CODES[upper]) setDescription(ICD10_CODES[upper]);
  };

  const handleAdd = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Enter a diagnosis code");
      return;
    }
    setEntries((prev) => [
      ...prev,
      { id: Date.now(), code: trimmed, description: description.trim() || "—", type },
    ]);
    setCode("");
    setDescription("");
    setType("Secondary");
    toast.success(`Added ${trimmed}`);
  };

  const handleRemove = (id: number) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
            <Icon icon="stethoscope" className="w-3.5 h-3.5 text-teal-700" />
          </div>
          Diagnosis Codes
          <span className="text-[10px] font-normal text-muted-foreground">(demo only, not saved)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_130px_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="dx-code" className="text-xs">ICD-10 Code</Label>
            <Input
              id="dx-code"
              list="dx-code-options"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g. E11.9"
              className="h-8 text-xs font-mono"
            />
            <datalist id="dx-code-options">
              {Object.entries(ICD10_CODES).map(([c, d]) => (
                <option key={c} value={c}>{d}</option>
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dx-desc" className="text-xs">Description</Label>
            <Input
              id="dx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Auto-fills for known codes"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dx-type" className="text-xs">Type</Label>
            <select
              id="dx-type"
              value={type}
              onChange={(e) => setType(e.target.value as "Primary" | "Secondary")}
              className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={handleAdd}>
            <Icon icon="plus" className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        {entries.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Code</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono font-medium">{e.code}</td>
                    <td className="px-3 py-2">{e.description}</td>
                    <td className="px-3 py-2">{e.type}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        aria-label={`Remove ${e.code}`}
                        onClick={() => handleRemove(e.id)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Icon icon="x" className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">No diagnosis codes added yet</p>
        )}
      </CardContent>
    </Card>
  );
}
