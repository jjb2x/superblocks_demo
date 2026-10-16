import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import EpicLiveFeed from "@/components/shared/EpicLiveFeed";
import PhoneMockup from "@/components/shared/PhoneMockup";
import TechnicalArchitecture from "@/components/shared/TechnicalArchitecture";
import DiagnosisCodeForm from "@/components/shared/DiagnosisCodeForm";

// --- Simulated Data ---

interface Message {
  id: string;
  sender: string;
  role: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

const MESSAGES: Message[] = [
  { id: "m1", sender: "Dr. Sarah Mitchell", role: "Endocrinology", subject: "Insulin dose adjustment", preview: "Please increase Lantus to 22 units at bedtime per latest A1c...", timestamp: "Today, 2:14 PM", unread: true },
  { id: "m2", sender: "PharmD Jennifer Wu", role: "Clinical Pharmacy", subject: "Warfarin therapy update", preview: "INR result 2.8 — within range. Continue current dosing...", timestamp: "Today, 11:30 AM", unread: true },
  { id: "m3", sender: "Dr. Marcus Torres", role: "Cardiology", subject: "Statin therapy question", preview: "Patient reports myalgia with atorvastatin. Consider switch to rosuvastatin...", timestamp: "Yesterday, 4:45 PM", unread: false },
  { id: "m4", sender: "RN Patricia Adams", role: "Oncology Infusion", subject: "Chemotherapy pre-med timing", preview: "Confirming ondansetron 30 min prior to infusion start tomorrow...", timestamp: "Yesterday, 1:20 PM", unread: false },
  { id: "m5", sender: "Dr. Kevin Park", role: "Pulmonology", subject: "Inhaler technique follow-up", preview: "Patient may benefit from spacer device with current MDI...", timestamp: "Jul 27, 9:55 AM", unread: false },
];

interface MedResult {
  name: string;
  strength: string;
  form: string;
  ndc: string;
  formulary: "Preferred" | "Non-Preferred" | "Specialty" | "Generic";
  interactions: string;
}

const MEDICATIONS_DB: MedResult[] = [
  { name: "Metformin HCl", strength: "500 mg", form: "Tablet", ndc: "00093-1048-01", formulary: "Generic", interactions: "Contrast dye (hold 48h)" },
  { name: "Metformin HCl ER", strength: "750 mg", form: "Extended-Release Tablet", ndc: "00378-7152-91", formulary: "Generic", interactions: "Alcohol, iodinated contrast" },
  { name: "Metoprolol Succinate ER", strength: "50 mg", form: "Extended-Release Tablet", ndc: "00378-1353-01", formulary: "Preferred", interactions: "Verapamil, Clonidine" },
  { name: "Atorvastatin Calcium", strength: "40 mg", form: "Tablet", ndc: "00071-0157-23", formulary: "Generic", interactions: "Cyclosporine, Gemfibrozil" },
  { name: "Lisinopril", strength: "10 mg", form: "Tablet", ndc: "00093-1040-01", formulary: "Generic", interactions: "K+ supplements, NSAIDs" },
  { name: "Amlodipine Besylate", strength: "5 mg", form: "Tablet", ndc: "00069-1530-66", formulary: "Generic", interactions: "Simvastatin (dose limit)" },
  { name: "Tacrolimus", strength: "1 mg", form: "Capsule", ndc: "00469-0617-73", formulary: "Specialty", interactions: "Strong CYP3A4 inhibitors" },
  { name: "Humira (Adalimumab)", strength: "40 mg/0.8mL", form: "Prefilled Syringe", ndc: "00074-4339-02", formulary: "Specialty", interactions: "Live vaccines, Anakinra" },
  { name: "Ozempic (Semaglutide)", strength: "1 mg/dose", form: "Pen Injector", ndc: "00169-4132-12", formulary: "Non-Preferred", interactions: "Insulin (hypoglycemia risk)" },
  { name: "Warfarin Sodium", strength: "5 mg", form: "Tablet", ndc: "00056-0172-70", formulary: "Generic", interactions: "Amiodarone, NSAIDs, Vitamin K" },
];

interface PriorAuth {
  id: string;
  patientId: string;
  medication: string;
  status: "Submitted" | "Approved" | "Denied" | "Pending";
  payer: string;
  submittedDate: string;
  daysPending: number;
}

const PRIOR_AUTHS: PriorAuth[] = [
  { id: "PA-2024-0891", patientId: "PT-***3318", medication: "Humira 40mg", status: "Approved", payer: "BlueCross TN", submittedDate: "Jul 22, 2025", daysPending: 0 },
  { id: "PA-2024-0904", patientId: "PT-***8830", medication: "Ozempic 1mg", status: "Pending", payer: "Aetna", submittedDate: "Jul 25, 2025", daysPending: 4 },
  { id: "PA-2024-0912", patientId: "PT-***5126", medication: "Xeljanz 5mg", status: "Submitted", payer: "Cigna", submittedDate: "Jul 27, 2025", daysPending: 2 },
  { id: "PA-2024-0887", patientId: "PT-***7291", medication: "Dupixent 300mg", status: "Denied", payer: "UnitedHealth", submittedDate: "Jul 18, 2025", daysPending: 0 },
  { id: "PA-2024-0920", patientId: "PT-***4410", medication: "Entresto 97/103mg", status: "Pending", payer: "Humana", submittedDate: "Jul 28, 2025", daysPending: 1 },
  { id: "PA-2024-0918", patientId: "PT-***6690", medication: "Keytruda 200mg", status: "Submitted", payer: "BlueCross TN", submittedDate: "Jul 26, 2025", daysPending: 3 },
];

interface RefillRequest {
  id: string;
  patientId: string;
  medication: string;
  lastFillDate: string;
  daysSupply: number;
  status: "pending" | "approved" | "denied";
}

const INITIAL_REFILLS: RefillRequest[] = [
  { id: "RFL-4401", patientId: "PT-***7744", medication: "Lisinopril 10mg", lastFillDate: "Jun 28, 2025", daysSupply: 30, status: "pending" },
  { id: "RFL-4402", patientId: "PT-***2190", medication: "Metformin 500mg", lastFillDate: "Jul 01, 2025", daysSupply: 90, status: "pending" },
  { id: "RFL-4403", patientId: "PT-***4517", medication: "Amlodipine 5mg", lastFillDate: "Jul 15, 2025", daysSupply: 30, status: "pending" },
  { id: "RFL-4404", patientId: "PT-***1256", medication: "Atorvastatin 40mg", lastFillDate: "Jul 10, 2025", daysSupply: 30, status: "pending" },
  { id: "RFL-4405", patientId: "PT-***9981", medication: "Warfarin 5mg", lastFillDate: "Jul 20, 2025", daysSupply: 30, status: "pending" },
];

// --- Status Badge Helper ---
function PaStatusBadge({ status }: { status: PriorAuth["status"] }) {
  const styles: Record<PriorAuth["status"], string> = {
    Approved: "bg-green-50 text-green-700 border-green-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    Denied: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${styles[status]}`}>
      {status}
    </Badge>
  );
}

function FormularyBadge({ formulary }: { formulary: MedResult["formulary"] }) {
  const styles: Record<MedResult["formulary"], string> = {
    Generic: "bg-green-50 text-green-700 border-green-200",
    Preferred: "bg-blue-50 text-blue-700 border-blue-200",
    "Non-Preferred": "bg-amber-50 text-amber-700 border-amber-200",
    Specialty: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${styles[formulary]}`}>
      {formulary}
    </Badge>
  );
}

// --- Main Page Component ---
export default function MyHealthVanderbiltPage() {
  const [medSearch, setMedSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [composeMode, setComposeMode] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [refills, setRefills] = useState<RefillRequest[]>(INITIAL_REFILLS);

  const medResults = medSearch.trim().length >= 2
    ? MEDICATIONS_DB.filter((m) =>
        m.name.toLowerCase().includes(medSearch.toLowerCase())
      )
    : [];

  const handleReply = useCallback(() => {
    if (!replyText.trim()) return;
    toast.success("Message sent successfully", { description: `Reply sent to ${selectedMessage?.sender}` });
    setReplyText("");
    setSelectedMessage(null);
  }, [replyText, selectedMessage]);

  const handleCompose = useCallback(() => {
    if (!composeSubject.trim() || !composeBody.trim()) return;
    toast.success("Message sent", { description: `New message "${composeSubject}" sent via In-Basket` });
    setComposeMode(false);
    setComposeSubject("");
    setComposeBody("");
  }, [composeSubject, composeBody]);

  const handleRefillAction = useCallback((id: string, action: "approved" | "denied") => {
    setRefills((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
    toast.success(action === "approved" ? "Refill Approved" : "Refill Denied", {
      description: `Request ${id} has been ${action}`,
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      {/* Page Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon icon="heart-pulse" className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">My Health at Vanderbilt</h1>
              <p className="text-xs text-muted-foreground">Patient portal integration &amp; pharmacy workflow management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
              Epic FHIR R4
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Row 1: Live Feed + In-Basket */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-Time Event Feed */}
          <EpicLiveFeed />

          {/* Patient Communication / In-Basket */}
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                    <Icon icon="message-circle" className="w-3.5 h-3.5 text-teal-700" />
                  </div>
                  In-Basket Messages
                </CardTitle>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setComposeMode(true)}>
                  <Icon icon="plus" className="w-3 h-3 mr-1" />
                  Compose
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {composeMode ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Textarea
                    placeholder="Type your message..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="text-xs min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs h-7" onClick={handleCompose}>Send</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setComposeMode(false)}>Cancel</Button>
                  </div>
                </div>
              ) : selectedMessage ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-6 px-1" onClick={() => setSelectedMessage(null)}>
                      <Icon icon="arrow-left" className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-medium">{selectedMessage.subject}</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-[10px] font-medium text-foreground">{selectedMessage.sender} — {selectedMessage.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedMessage.preview}</p>
                    <p className="text-[9px] text-muted-foreground mt-2">{selectedMessage.timestamp}</p>
                  </div>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                  <Button size="sm" className="text-xs h-7" onClick={handleReply}>Send Reply</Button>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-border/40 max-h-[280px] overflow-y-auto">
                  {MESSAGES.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className="w-full text-left py-2.5 px-1 hover:bg-muted/40 rounded transition-colors first:pt-0"
                    >
                      <div className="flex items-center gap-2">
                        {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        <span className="text-[11px] font-semibold text-foreground truncate">{msg.sender}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto shrink-0">{msg.timestamp}</span>
                      </div>
                      <p className="text-[10px] font-medium text-foreground/80 mt-0.5 truncate">{msg.subject}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Medication Lookup */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icon icon="pill" className="w-3.5 h-3.5 text-blue-700" />
              </div>
              Medication Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search medications by name (e.g. Metformin, Atorvastatin)..."
              value={medSearch}
              onChange={(e) => setMedSearch(e.target.value)}
              className="text-xs h-8 mb-3"
            />
            {medSearch.trim().length >= 2 && (
              medResults.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Drug Name</th>
                        <th className="text-left px-3 py-2 font-medium">Strength</th>
                        <th className="text-left px-3 py-2 font-medium">Form</th>
                        <th className="text-left px-3 py-2 font-medium">NDC</th>
                        <th className="text-left px-3 py-2 font-medium">Formulary</th>
                        <th className="text-left px-3 py-2 font-medium">Interactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {medResults.map((med) => (
                        <tr key={med.ndc} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{med.name}</td>
                          <td className="px-3 py-2">{med.strength}</td>
                          <td className="px-3 py-2">{med.form}</td>
                          <td className="px-3 py-2 font-mono text-[10px]">{med.ndc}</td>
                          <td className="px-3 py-2"><FormularyBadge formulary={med.formulary} /></td>
                          <td className="px-3 py-2 text-muted-foreground">{med.interactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No medications found for &quot;{medSearch}&quot;</p>
              )
            )}
            {medSearch.trim().length < 2 && medSearch.trim().length > 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
            )}
          </CardContent>
        </Card>

        {/* Diagnosis Code Entry (standalone demo, no backend) */}
        <DiagnosisCodeForm />

        {/* Row 3: Prior Authorization Tracker */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                <Icon icon="file-check" className="w-3.5 h-3.5 text-purple-700" />
              </div>
              Prior Authorization Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">PA ID</th>
                    <th className="text-left px-3 py-2 font-medium">Patient ID</th>
                    <th className="text-left px-3 py-2 font-medium">Medication</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Payer</th>
                    <th className="text-left px-3 py-2 font-medium">Submitted</th>
                    <th className="text-left px-3 py-2 font-medium">Days Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {PRIOR_AUTHS.map((pa) => (
                    <tr key={pa.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-[10px]">{pa.id}</td>
                      <td className="px-3 py-2 font-mono">{pa.patientId}</td>
                      <td className="px-3 py-2 font-medium">{pa.medication}</td>
                      <td className="px-3 py-2"><PaStatusBadge status={pa.status} /></td>
                      <td className="px-3 py-2">{pa.payer}</td>
                      <td className="px-3 py-2">{pa.submittedDate}</td>
                      <td className="px-3 py-2">{pa.daysPending > 0 ? `${pa.daysPending}d` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Row 4: Refill Request Queue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icon icon="refresh-cw" className="w-3.5 h-3.5 text-amber-700" />
              </div>
              MyChart Refill Request Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y divide-border/40">
              {refills.map((req) => (
                <div key={req.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{req.medication}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{req.id}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">Patient: <span className="font-mono">{req.patientId}</span></span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-[10px] text-muted-foreground">Last fill: {req.lastFillDate}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-[10px] text-muted-foreground">{req.daysSupply}-day supply</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-6 px-2 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleRefillAction(req.id, "approved")}
                        >
                          <Icon icon="check" className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-6 px-2 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleRefillAction(req.id, "denied")}
                        >
                          <Icon icon="x" className="w-3 h-3 mr-1" />
                          Deny
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          req.status === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {req.status === "approved" ? "Approved" : "Denied"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Portal Preview */}
      <div className="px-6 pb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                <Icon icon="smartphone" className="w-3.5 h-3.5 text-teal-700" />
              </div>
              Patient Portal Preview
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              This is what patients see when they open My Health at Vanderbilt on their phone.
              The same experience is available as a live mobile route at <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">/patient</code>
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6 bg-gradient-to-b from-muted/30 to-muted/10 rounded-lg">
              <PhoneMockup />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Architecture & Feasibility */}
      <div className="px-6 pb-6">
        <TechnicalArchitecture />
      </div>
    </div>
  );
}
