import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "lucide-react/dynamic";

interface FeedEvent {
  id: string;
  timestamp: string;
  type: string;
  icon: IconName;
  description: string;
  patientId: string;
  source: string;
  color: string;
}

const FEED_EVENTS: Omit<FeedEvent, "id" | "timestamp">[] = [
  { type: "New Rx", icon: "pill", description: "Tacrolimus 1mg PO BID — new transplant order received", patientId: "PT-***8421", source: "Epic eRx", color: "text-blue-600 bg-blue-50" },
  { type: "Dispense", icon: "package-check", description: "Metformin 500mg #90 dispensed — Central Fill batch", patientId: "PT-***2190", source: "MedicationDispense", color: "text-green-600 bg-green-50" },
  { type: "Refill Request", icon: "refresh-cw", description: "Lisinopril 10mg — patient-initiated refill via MyChart", patientId: "PT-***7744", source: "MHAV Portal", color: "text-amber-600 bg-amber-50" },
  { type: "Prior Auth", icon: "file-check", description: "Humira PA approved — specialty pharmacy notified", patientId: "PT-***3318", source: "Task Resource", color: "text-purple-600 bg-purple-50" },
  { type: "ADT Event", icon: "door-open", description: "Patient discharged — discharge med reconciliation pending", patientId: "PT-***5502", source: "ADT Subscription", color: "text-pink-600 bg-pink-50" },
  { type: "Interaction Alert", icon: "alert-triangle", description: "Drug interaction flagged: Warfarin + Amiodarone", patientId: "PT-***9981", source: "CDS Hook", color: "text-red-600 bg-red-50" },
  { type: "New Rx", icon: "pill", description: "Atorvastatin 40mg QHS — e-prescribed from cardiology", patientId: "PT-***1256", source: "Epic eRx", color: "text-blue-600 bg-blue-50" },
  { type: "Communication", icon: "message-circle", description: "Provider message: adjust insulin sliding scale per protocol", patientId: "PT-***6438", source: "In-Basket", color: "text-teal-600 bg-teal-50" },
  { type: "Dispense", icon: "package-check", description: "Cyclosporine 100mg #60 verified — specialty ship today", patientId: "PT-***0092", source: "MedicationDispense", color: "text-green-600 bg-green-50" },
  { type: "Refill Request", icon: "refresh-cw", description: "Amlodipine 5mg — auto-refill triggered, 3-day supply left", patientId: "PT-***4517", source: "MHAV Portal", color: "text-amber-600 bg-amber-50" },
  { type: "Prior Auth", icon: "file-check", description: "Ozempic PA submitted — awaiting payer response", patientId: "PT-***8830", source: "Task Resource", color: "text-purple-600 bg-purple-50" },
  { type: "New Rx", icon: "pill", description: "Prednisone taper pack — acute rheumatology order", patientId: "PT-***2677", source: "Epic eRx", color: "text-blue-600 bg-blue-50" },
];

function getTimeStr(offset: number): string {
  const d = new Date(Date.now() - offset * 1000);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
}

export default function EpicLiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>(() =>
    FEED_EVENTS.slice(0, 6).map((e, i) => ({
      ...e,
      id: `init-${i}`,
      timestamp: getTimeStr((6 - i) * 12),
    }))
  );

  const addEvent = useCallback(() => {
    setEvents((prev) => {
      const template = FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
      const newEvent: FeedEvent = {
        ...template,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: getTimeStr(0),
      };
      return [newEvent, ...prev].slice(0, 8);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(addEvent, 5000);
    return () => clearInterval(interval);
  }, [addEvent]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
              <Icon icon="heart-pulse" className="w-3.5 h-3.5 text-green-700" />
            </div>
            MHAV Live Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <span className="text-[9px] text-muted-foreground">Epic FHIR R4</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0 divide-y divide-border/40">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2 py-2 first:pt-0 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${event.color}`}>
                <Icon icon={event.icon} className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-foreground">{event.type}</span>
                  <span className="text-[8px] text-muted-foreground bg-muted px-1 py-px rounded">{event.source}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{event.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] text-muted-foreground">{event.timestamp}</span>
                <p className="text-[8px] text-muted-foreground/60 mt-0.5">{event.patientId}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
