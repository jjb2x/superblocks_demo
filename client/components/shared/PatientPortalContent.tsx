import { useState, useCallback } from "react";
import { toast } from "sonner";

// --- Simulated Patient Data ---

interface Medication {
  id: string;
  name: string;
  dose: string;
  prescriber: string;
  nextRefill: string;
  status: "Active" | "Refill Requested";
}

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
}

interface Appointment {
  id: string;
  type: string;
  provider: string;
  date: string;
  time: string;
  location: string;
}

interface RxStatus {
  id: string;
  medication: string;
  stage: number; // 0=Received, 1=Verifying, 2=Filling, 3=Ready
}

interface TestResult {
  id: string;
  name: string;
  date: string;
  value: string;
  unit: string;
  status: "Normal" | "Abnormal" | "Critical";
}

const MEDICATIONS: Medication[] = [
  { id: "med-1", name: "Lisinopril", dose: "10 mg daily", prescriber: "Dr. Mitchell", nextRefill: "Aug 12, 2025", status: "Active" },
  { id: "med-2", name: "Metformin", dose: "500 mg twice daily", prescriber: "Dr. Torres", nextRefill: "Aug 5, 2025", status: "Active" },
  { id: "med-3", name: "Atorvastatin", dose: "40 mg at bedtime", prescriber: "Dr. Park", nextRefill: "Aug 18, 2025", status: "Active" },
  { id: "med-4", name: "Amlodipine", dose: "5 mg daily", prescriber: "Dr. Mitchell", nextRefill: "Aug 9, 2025", status: "Refill Requested" },
];

const MESSAGES: Message[] = [
  { id: "msg-1", from: "Dr. Sarah Mitchell", subject: "Blood pressure follow-up", preview: "Your recent readings look improved. Let's continue current dosing...", date: "Today", unread: true },
  { id: "msg-2", from: "VUMC Pharmacy", subject: "Refill ready for pickup", preview: "Your Metformin 500mg is ready at Vanderbilt Main Pharmacy...", date: "Yesterday", unread: true },
  { id: "msg-3", from: "Dr. Kevin Park", subject: "Statin therapy update", preview: "Your cholesterol panel looks great. Continue atorvastatin...", date: "Jul 28", unread: false },
];

const APPOINTMENTS: Appointment[] = [
  { id: "apt-1", type: "Pharmacy Consultation", provider: "PharmD Jennifer Wu", date: "Aug 5, 2025", time: "10:30 AM", location: "Vanderbilt Main Pharmacy" },
  { id: "apt-2", type: "Primary Care Visit", provider: "Dr. Sarah Mitchell", date: "Aug 12, 2025", time: "2:00 PM", location: "Vanderbilt Medical Plaza" },
];

const RX_STATUSES: RxStatus[] = [
  { id: "rx-1", medication: "Amlodipine 5mg", stage: 2 },
  { id: "rx-2", medication: "Metformin 500mg", stage: 3 },
];

const TEST_RESULTS: TestResult[] = [
  { id: "tr-1", name: "HbA1c", date: "Jul 25, 2025", value: "6.8", unit: "%", status: "Normal" },
  { id: "tr-2", name: "LDL Cholesterol", date: "Jul 25, 2025", value: "98", unit: "mg/dL", status: "Normal" },
  { id: "tr-3", name: "Creatinine", date: "Jul 22, 2025", value: "1.4", unit: "mg/dL", status: "Abnormal" },
  { id: "tr-4", name: "Potassium", date: "Jul 22, 2025", value: "5.6", unit: "mEq/L", status: "Critical" },
];

const PHARMACY_LOCATIONS = [
  { name: "Vanderbilt Main Pharmacy", address: "1211 Medical Center Dr", hours: "Mon-Fri 8am-6pm" },
  { name: "100 Oaks Pharmacy", address: "719 Thompson Ln, Suite 25000", hours: "Mon-Fri 9am-7pm, Sat 9am-2pm" },
  { name: "Vanderbilt Specialty Pharmacy", address: "3601 The Vanderbilt Clinic", hours: "Mon-Fri 8am-5pm" },
];

const RX_STAGES = ["Received", "Verifying", "Filling", "Ready"];

// --- Component ---

export default function PatientPortalContent() {
  const [meds, setMeds] = useState(MEDICATIONS);

  const handleRefill = useCallback((medId: string) => {
    setMeds((prev) => prev.map((m) => m.id === medId ? { ...m, status: "Refill Requested" as const } : m));
    toast.success("Refill Requested", { description: "Your pharmacy will process this within 24-48 hours." });
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-teal-50 to-white">
      {/* Patient Header */}
      <div className="bg-teal-700 text-white px-4 pt-6 pb-5 rounded-b-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            SM
          </div>
          <div>
            <p className="text-[11px] text-teal-200">Good morning,</p>
            <p className="text-sm font-semibold">Sarah M.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-teal-200">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          My Health at Vanderbilt
        </div>
      </div>

      <div className="px-3 py-4 space-y-4">
        {/* Medications */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            My Medications
          </h2>
          <div className="space-y-2">
            {meds.map((med) => (
              <div key={med.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-900">{med.name}</p>
                    <p className="text-[10px] text-gray-500">{med.dose}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Prescribed by {med.prescriber}</p>
                  </div>
                  {med.status === "Active" ? (
                    <button
                      onClick={() => handleRefill(med.id)}
                      className="text-[9px] font-medium bg-teal-600 text-white px-2 py-1 rounded-full hover:bg-teal-700 transition-colors"
                    >
                      Request Refill
                    </button>
                  ) : (
                    <span className="text-[9px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                      Refill Requested
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5">Next refill: {med.nextRefill}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rx Status Tracker */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Prescription Status
          </h2>
          <div className="space-y-2">
            {RX_STATUSES.map((rx) => (
              <div key={rx.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-900 mb-2">{rx.medication}</p>
                <div className="flex items-center gap-1">
                  {RX_STAGES.map((stage, idx) => (
                    <div key={stage} className="flex-1 flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        idx <= rx.stage
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        {idx <= rx.stage ? "✓" : idx + 1}
                      </div>
                      <p className={`text-[8px] mt-0.5 ${idx <= rx.stage ? "text-teal-700 font-medium" : "text-gray-400"}`}>
                        {stage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Messages */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Messages
            {MESSAGES.filter((m) => m.unread).length > 0 && (
              <span className="text-[8px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                {MESSAGES.filter((m) => m.unread).length}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {MESSAGES.map((msg) => (
              <div key={msg.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-start gap-2">
                  {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-gray-900 truncate">{msg.from}</p>
                      <span className="text-[9px] text-gray-400 shrink-0">{msg.date}</span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-700 truncate">{msg.subject}</p>
                    <p className="text-[9px] text-gray-400 truncate">{msg.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Appointments */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Upcoming Appointments
          </h2>
          <div className="space-y-2">
            {APPOINTMENTS.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-900">{apt.type}</p>
                <p className="text-[10px] text-gray-600">{apt.provider}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium">{apt.date}</span>
                  <span className="text-[9px] text-gray-500">{apt.time}</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">{apt.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Test Results */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Test Results
          </h2>
          <div className="space-y-2">
            {TEST_RESULTS.map((tr) => (
              <div key={tr.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-900">{tr.name}</p>
                  <p className="text-[9px] text-gray-400">{tr.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-900">{tr.value} <span className="text-[9px] font-normal text-gray-500">{tr.unit}</span></p>
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                    tr.status === "Normal" ? "bg-green-50 text-green-700" :
                    tr.status === "Abnormal" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {tr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Find a Pharmacy */}
        <section>
          <h2 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Find a Pharmacy
          </h2>
          {/* Map placeholder */}
          <div className="bg-gray-200 rounded-xl h-28 flex items-center justify-center mb-2 border border-gray-300">
            <div className="text-center">
              <svg className="w-6 h-6 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <p className="text-[9px] text-gray-500 mt-1">Map View</p>
            </div>
          </div>
          <div className="space-y-2">
            {PHARMACY_LOCATIONS.map((loc) => (
              <div key={loc.name} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-900">{loc.name}</p>
                <p className="text-[9px] text-gray-500">{loc.address}</p>
                <p className="text-[9px] text-teal-600 font-medium mt-0.5">{loc.hours}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="h-6" />
      </div>
    </div>
  );
}
