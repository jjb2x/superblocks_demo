import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { LOCATIONS } from "@/data/locations";
import { APP_USERS } from "@/data/users";
import { addException, generateExceptionId } from "@/data/exceptions";
import { useAppContext } from "@/context/AppContext";
import type { Priority, IssueCategory, ServiceType, ExceptionStatus, ExceptionRecord } from "@/data/types";

const SERVICE_TYPES: ServiceType[] = [
  "Retail Pharmacy", "Specialty Pharmacy", "Central Fill",
  "Mail Order", "Transplant Pharmacy", "Clinic Pharmacy", "Medication Access Services",
];
const CATEGORIES: IssueCategory[] = [
  "Inventory", "Insurance", "Staffing", "Workflow Delay", "Technology",
  "Vendor", "Shipping", "Prescription Clarification", "Capacity", "Other",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];
const SUBTYPES: Record<IssueCategory, string[]> = {
  Inventory: ["Stockout", "Low Stock", "Expiry Risk", "Recalls", "Storage Issue"],
  Insurance: ["Prior Auth Denied", "Coverage Lapsed", "Wrong Payer", "Copay Dispute", "Formulary Exception"],
  Staffing: ["Sick Call", "No-Show", "Understaffing", "Training Gap", "Overtime Limit"],
  "Workflow Delay": ["Queue Backup", "Verification Bottleneck", "Intake Backlog", "Packing Delay", "Courier Late"],
  Technology: ["System Outage", "Interface Error", "Printer Failure", "Software Bug", "Network Issue"],
  Vendor: ["Delivery Delay", "Incorrect Shipment", "Contract Issue", "Quality Concern", "Price Discrepancy"],
  Shipping: ["Lost Package", "Carrier Delay", "Damaged Shipment", "Wrong Address", "Weather Hold"],
  "Prescription Clarification": ["Illegible Rx", "Drug-Drug Interaction", "Dose Query", "Missing Info", "Prescriber Unavailable"],
  Capacity: ["Volume Surge", "Space Constraint", "Equipment Limit", "Overnight Backlog", "Holiday Surge"],
  Other: ["Patient Complaint", "Regulatory Query", "Audit Request", "Billing Dispute", "Process Review"],
};

export default function AddNewIssue() {
  const navigate = useNavigate();
  const { triggerExceptionRefresh, setSelectedExceptionId, selectedLocationId } = useAppContext();

  // Form state
  const [locationId, setLocationId] = useState(selectedLocationId ?? "");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [subtype, setSubtype] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [rxAffected, setRxAffected] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("");
  const [assignedOwner, setAssignedOwner] = useState("");
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Conditional fields - Inventory
  const [medicationName, setMedicationName] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [replenishDate, setReplenishDate] = useState("");
  const [altAvailable, setAltAvailable] = useState("");
  const [vendorName, setVendorName] = useState("");

  // Staffing
  const [shift, setShift] = useState("");
  const [scheduledStaff, setScheduledStaff] = useState("");
  const [actualStaff, setActualStaff] = useState("");
  const [roleAffected, setRoleAffected] = useState("");
  const [coverageRequested, setCoverageRequested] = useState("");

  // Technology
  const [systemAffected, setSystemAffected] = useState("");
  const [environment, setEnvironment] = useState("");
  const [outageStart, setOutageStart] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [downtimeProc, setDowntimeProc] = useState("");

  // Shipping
  const [carrier, setCarrier] = useState("");
  const [shipmentType, setShipmentType] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packagesAffected, setPackagesAffected] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");

  // Insurance
  const [rejectionCategory, setRejectionCategory] = useState("");
  const [payerType, setPayerType] = useState("");
  const [escalationRequired, setEscalationRequired] = useState("");
  const [financialImpact, setFinancialImpact] = useState("");

  const [errors, setErrors] = useState<string[]>([]);

  // Dynamic behavior
  const rxNum = parseInt(rxAffected) || 0;
  const delayNum = parseInt(delayMinutes) || 0;
  const showEscalationWarning = rxNum > 25;
  const showPrioritySuggestion = delayNum > 120 && priority !== "Critical" && priority !== "High";
  const isCritical = priority === "Critical";

  const subtypeOptions = useMemo(() =>
    category ? SUBTYPES[category] ?? [] : [], [category]);

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!locationId) errs.push("Pharmacy location is required");
    if (!serviceType) errs.push("Service type is required");
    if (!category) errs.push("Issue category is required");
    if (!subtype) errs.push("Issue subtype is required");
    if (!priority) errs.push("Priority is required");
    if (!description.trim()) errs.push("Description is required");
    if (isCritical) {
      if (!immediateAction.trim()) errs.push("Critical priority requires Immediate Action Taken");
      if (!assignedOwner) errs.push("Critical priority requires an Assigned Owner");
      if (!followUpDate) errs.push("Critical priority requires a Follow-Up Date");
    }
    return errs;
  }, [locationId, serviceType, category, subtype, priority, description, isCritical, immediateAction, assignedOwner, followUpDate]);

  const handleSubmit = useCallback(() => {
    const validationErrors = validate();
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const newId = generateExceptionId();
    const now = new Date().toISOString();

    const record: ExceptionRecord = {
      id: newId,
      createdAt: now,
      locationId,
      serviceType: serviceType as ServiceType,
      issueCategory: category as IssueCategory,
      issueSubtype: subtype,
      priority: priority as Priority,
      status: "New" as ExceptionStatus,
      assignedOwner: assignedOwner || "user-01",
      daysOpen: 0,
      estimatedImpact: rxNum > 0 ? `${rxNum} prescriptions affected; ${delayNum > 0 ? `estimated ${delayNum}min delay` : "impact under assessment"}` : "Under assessment",
      prescriptionsAffected: rxNum,
      lastUpdatedAt: now,
      resolutionDueDate: followUpDate || new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      description: description.trim(),
      resolutionSummary: "",
      immediateActionTaken: immediateAction.trim(),
      notes: [],
      activityHistory: [{
        id: Math.random().toString(36).slice(2),
        timestamp: now,
        user: "Dr. Samantha Reyes",
        action: "Created",
        details: `New exception created — ${category} / ${subtype}`,
      }],
      medicationName: category === "Inventory" ? medicationName : undefined,
      vendorName: category === "Inventory" || category === "Vendor" ? vendorName : undefined,
      systemAffected: category === "Technology" ? systemAffected : undefined,
      carrier: category === "Shipping" ? carrier : undefined,
      rejectionCategory: category === "Insurance" ? rejectionCategory : undefined,
      shift: category === "Staffing" ? shift : undefined,
      scheduledStaff: category === "Staffing" ? parseInt(scheduledStaff) || undefined : undefined,
      actualStaff: category === "Staffing" ? parseInt(actualStaff) || undefined : undefined,
    };

    addException(record);
    triggerExceptionRefresh();
    setSelectedExceptionId(newId);
    toast.success(`Exception ${newId} created successfully`);
    navigate("/app/queue");
  }, [validate, locationId, serviceType, category, subtype, priority, assignedOwner, rxNum, delayNum, description, immediateAction, followUpDate, medicationName, vendorName, systemAffected, carrier, rejectionCategory, shift, scheduledStaff, actualStaff, triggerExceptionRefresh, setSelectedExceptionId, navigate]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Add New Operational Issue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new exception record for the operational work queue
        </p>
      </div>

      <div className="px-6 pb-6 max-w-4xl">
        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <Icon icon="alert-circle" className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Please correct the following:</p>
                <ul className="list-disc list-inside text-xs text-red-700 mt-1 space-y-0.5">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {showEscalationWarning && (
          <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-2">
            <Icon icon="alert-triangle" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Escalation Recommended:</strong> This issue affects more than 25 prescriptions.
              Consider assigning to a Pharmacy Manager and setting priority to High or Critical.
            </p>
          </div>
        )}
        {showPrioritySuggestion && (
          <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 flex items-start gap-2">
            <Icon icon="lightbulb" className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Suggestion:</strong> Estimated delay exceeds 120 minutes. Consider setting priority to High.
              <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-700 ml-1" onClick={() => setPriority("High")}>
                Apply suggestion
              </Button>
            </p>
          </div>
        )}

        {/* Core fields */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Core Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Pharmacy Location *</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service Type *</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select service type" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue Category *</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v as IssueCategory); setSubtype(""); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue Subtype *</Label>
                <Select value={subtype} onValueChange={setSubtype} disabled={!category}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={category ? "Select subtype" : "Select category first"} /></SelectTrigger>
                  <SelectContent>
                    {subtypeOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority *</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Owner</Label>
                <Select value={assignedOwner} onValueChange={setAssignedOwner}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    {APP_USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prescriptions Affected</Label>
                <Input type="number" value={rxAffected} onChange={(e) => setRxAffected(e.target.value)} className="h-9" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estimated Delay (minutes)</Label>
                <Input type="number" value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} className="h-9" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Follow-up Date {isCritical && "*"}</Label>
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Attachment</Label>
                <div className="flex items-center h-9 border border-dashed border-border rounded-md px-3 text-xs text-muted-foreground">
                  <Icon icon="paperclip" className="w-3.5 h-3.5 mr-2" />
                  File upload (demo placeholder)
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the operational issue..." className="resize-none" />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs">Immediate Action Taken {isCritical && "*"}</Label>
              <Textarea value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} rows={2} placeholder="Describe any immediate steps taken..." className="resize-none" />
            </div>
          </CardContent>
        </Card>

        {/* Conditional fields */}
        {category === "Inventory" && (
          <Card className="mb-4 border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="package" className="w-4 h-4 text-blue-600" /> Inventory Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Medication Name</Label><Input value={medicationName} onChange={(e) => setMedicationName(e.target.value)} className="h-9" placeholder="e.g., Tacrolimus 1mg" /></div>
                <div className="space-y-1.5"><Label className="text-xs">NDC</Label><Input className="h-9" placeholder="Demo placeholder" disabled /></div>
                <div className="space-y-1.5"><Label className="text-xs">Inventory Status</Label>
                  <Select value={inventoryStatus} onValueChange={setInventoryStatus}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Out of Stock">Out of Stock</SelectItem><SelectItem value="Low Stock">Low Stock</SelectItem><SelectItem value="On Order">On Order</SelectItem><SelectItem value="Backordered">Backordered</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Est. Replenishment Date</Label><Input type="date" value={replenishDate} onChange={(e) => setReplenishDate(e.target.value)} className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Alternative Available</Label>
                  <Select value={altAvailable} onValueChange={setAltAvailable}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Under Investigation">Under Investigation</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Vendor</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="h-9" placeholder="e.g., McKesson" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {category === "Staffing" && (
          <Card className="mb-4 border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="users" className="w-4 h-4 text-purple-600" /> Staffing Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Shift</Label>
                  <Select value={shift} onValueChange={setShift}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select shift" /></SelectTrigger><SelectContent><SelectItem value="Morning (7AM-3PM)">Morning (7AM-3PM)</SelectItem><SelectItem value="Evening (3PM-11PM)">Evening (3PM-11PM)</SelectItem><SelectItem value="Night (11PM-7AM)">Night (11PM-7AM)</SelectItem><SelectItem value="Weekend">Weekend</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Role Affected</Label><Input value={roleAffected} onChange={(e) => setRoleAffected(e.target.value)} className="h-9" placeholder="e.g., Pharmacist, Tech" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Scheduled Staff</Label><Input type="number" value={scheduledStaff} onChange={(e) => setScheduledStaff(e.target.value)} className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Actual Staff</Label><Input type="number" value={actualStaff} onChange={(e) => setActualStaff(e.target.value)} className="h-9" /></div>
                <div className="space-y-1.5 col-span-2"><Label className="text-xs">Coverage Requested</Label>
                  <Select value={coverageRequested} onValueChange={setCoverageRequested}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Yes - Pending">Yes - Pending</SelectItem><SelectItem value="Yes - Confirmed">Yes - Confirmed</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {category === "Technology" && (
          <Card className="mb-4 border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="monitor" className="w-4 h-4 text-orange-600" /> Technology Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">System Affected</Label><Input value={systemAffected} onChange={(e) => setSystemAffected(e.target.value)} className="h-9" placeholder="e.g., QS/1, Pyxis, Epic" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Environment</Label>
                  <Select value={environment} onValueChange={setEnvironment}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Production">Production</SelectItem><SelectItem value="Staging">Staging</SelectItem><SelectItem value="Test">Test</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Outage Start Time</Label><Input type="datetime-local" value={outageStart} onChange={(e) => setOutageStart(e.target.value)} className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">IT Ticket Number</Label><Input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} className="h-9" placeholder="e.g., INC-00012345" /></div>
                <div className="space-y-1.5 col-span-2"><Label className="text-xs">Downtime Procedure Activated</Label>
                  <Select value={downtimeProc} onValueChange={setDowntimeProc}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {category === "Shipping" && (
          <Card className="mb-4 border-green-200 bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="truck" className="w-4 h-4 text-green-600" /> Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select carrier" /></SelectTrigger><SelectContent><SelectItem value="FedEx Priority">FedEx Priority</SelectItem><SelectItem value="FedEx Ground">FedEx Ground</SelectItem><SelectItem value="UPS Next Day">UPS Next Day</SelectItem><SelectItem value="USPS Priority">USPS Priority</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Shipment Type</Label>
                  <Select value={shipmentType} onValueChange={setShipmentType}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Cold Chain">Cold Chain</SelectItem><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Controlled Substance">Controlled Substance</SelectItem><SelectItem value="Hazmat">Hazmat</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Tracking Number</Label><Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="h-9" placeholder="Demo placeholder" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Packages Affected</Label><Input type="number" value={packagesAffected} onChange={(e) => setPackagesAffected(e.target.value)} className="h-9" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Expected Delivery Date</Label><Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className="h-9" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {category === "Insurance" && (
          <Card className="mb-4 border-indigo-200 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="shield" className="w-4 h-4 text-indigo-600" /> Insurance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Rejection Category</Label>
                  <Select value={rejectionCategory} onValueChange={setRejectionCategory}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Prior Authorization Required">Prior Authorization Required</SelectItem><SelectItem value="Non-Formulary">Non-Formulary</SelectItem><SelectItem value="Coverage Terminated">Coverage Terminated</SelectItem><SelectItem value="Quantity Limit">Quantity Limit</SelectItem><SelectItem value="Step Therapy Required">Step Therapy Required</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Payer Type</Label>
                  <Select value={payerType} onValueChange={setPayerType}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Commercial">Commercial</SelectItem><SelectItem value="Medicare">Medicare</SelectItem><SelectItem value="Medicaid">Medicaid</SelectItem><SelectItem value="Workers Comp">Workers Comp</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Escalation Required</Label>
                  <Select value={escalationRequired} onValueChange={setEscalationRequired}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Financial Impact Estimate</Label><Input value={financialImpact} onChange={(e) => setFinancialImpact(e.target.value)} className="h-9" placeholder="e.g., $25,000" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-4" />

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} className="px-6">
            <Icon icon="circle-plus" className="w-4 h-4 mr-2" />
            Create Exception
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/queue")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
