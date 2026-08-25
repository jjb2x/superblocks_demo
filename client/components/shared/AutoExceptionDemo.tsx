import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

// --- Types ---

interface FeedEvent {
  id: string;
  type: "rejection" | "duplicate" | "paid";
  timestamp: string;
  rxNumber: string;
  ndc: string;
  patient: string;
  planBin: string;
  planPcn: string;
  rejectCode?: string;
  rejectText?: string;
  exceptionId?: string;
  attemptCount?: number;
  resolvedVia?: string;
}

// --- Demo Data ---

const DEMO_EVENTS: FeedEvent[] = [
  {
    id: "evt-001",
    type: "rejection",
    timestamp: new Date().toISOString(),
    rxNumber: "RX-7829341",
    ndc: "00078-0357-05",
    patient: "Sarah Chen",
    planBin: "610014",
    planPcn: "01",
    rejectCode: "75",
    rejectText: "Prior Authorization Required",
    exceptionId: "EXC-2025-1847",
  },
  {
    id: "evt-002",
    type: "duplicate",
    timestamp: new Date(Date.now() + 4000).toISOString(),
    rxNumber: "RX-7829341",
    ndc: "00078-0357-05",
    patient: "Sarah Chen",
    planBin: "610014",
    planPcn: "01",
    rejectCode: "75",
    rejectText: "Prior Authorization Required",
    exceptionId: "EXC-2025-1847",
    attemptCount: 2,
  },
  {
    id: "evt-003",
    type: "rejection",
    timestamp: new Date(Date.now() + 8000).toISOString(),
    rxNumber: "RX-7831002",
    ndc: "00069-0154-01",
    patient: "James Williams",
    planBin: "003858",
    planPcn: "A4",
    rejectCode: "75",
    rejectText: "Prior Authorization Required — Step Therapy",
    exceptionId: "EXC-2025-1848",
  },
  {
    id: "evt-004",
    type: "paid",
    timestamp: new Date(Date.now() + 13000).toISOString(),
    rxNumber: "RX-7829341",
    ndc: "00078-0357-05",
    patient: "Sarah Chen",
    planBin: "610014",
    planPcn: "01",
    exceptionId: "EXC-2025-1847",
    resolvedVia: "Paid Claim (BIN/PCN match)",
  },
];

// --- Component ---

export default function AutoExceptionDemo({ onClose }: { onClose: () => void }) {
  const [visibleEvents, setVisibleEvents] = useState<FeedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-advance the feed
  useEffect(() => {
    if (!isPlaying || currentIndex >= DEMO_EVENTS.length) return;
    const delays = [1500, 4000, 4500, 5000]; // staggered timing
    timerRef.current = setTimeout(() => {
      setVisibleEvents((prev) => [...prev, { ...DEMO_EVENTS[currentIndex], timestamp: new Date().toISOString() }]);
      setCurrentIndex((i) => i + 1);
    }, delays[currentIndex] ?? 4000);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex]);

  const handleReplay = useCallback(() => {
    setVisibleEvents([]);
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => setIsPlaying((p) => !p), []);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return ts; }
  };

  return (
    <div className="px-6 pb-4">
      <Card className="border-violet-300 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
                <Icon icon="zap" className="w-4 h-4 text-violet-700" />
              </div>
              Real-Time Auto-Exception Demo
              <Badge className="bg-violet-600 text-white text-[10px] animate-pulse">LIVE SIMULATION</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className="text-xs px-2.5 py-1 rounded border border-violet-300 text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <Icon icon={isPlaying ? "pause" : "play"} className="w-3 h-3 inline mr-1" />
                {isPlaying ? "Pause" : "Resume"}
              </button>
              <button
                onClick={handleReplay}
                className="text-xs px-2.5 py-1 rounded border border-violet-300 text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <Icon icon="rotate-ccw" className="w-3 h-3 inline mr-1" />
                Replay
              </button>
              <button
                onClick={onClose}
                className="text-xs px-2.5 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Icon icon="x" className="w-3 h-3 inline mr-1" />
                Close
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Simulating real-time NCPDP adjudication responses from CoverMyMeds / RelayHealth switch. Watch exceptions auto-generate, dedup, and auto-resolve.
          </p>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          {/* Live feed */}
          <div className="rounded-lg bg-slate-900 p-4 max-h-[280px] overflow-y-auto space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-slate-500 mb-2 pb-2 border-b border-slate-700">
              <Icon icon="radio-tower" className="w-3.5 h-3.5" />
              <span>CoverMyMeds Switch Feed — Listening on NCPDP Telecom Channel</span>
              {isPlaying && currentIndex < DEMO_EVENTS.length && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400">Connected</span>
                </span>
              )}
              {currentIndex >= DEMO_EVENTS.length && (
                <span className="ml-auto text-amber-400">Demo complete — click Replay to restart</span>
              )}
            </div>

            {visibleEvents.length === 0 && (
              <div className="text-slate-500 text-center py-4">
                <Icon icon="loader" className="w-4 h-4 animate-spin inline mr-2" />
                Waiting for adjudication responses...
              </div>
            )}

            {visibleEvents.map((evt) => (
              <div
                key={evt.id}
                className={`rounded p-2.5 border animate-in fade-in slide-in-from-top-2 duration-500 ${
                  evt.type === "rejection"
                    ? "bg-red-950/40 border-red-800/50"
                    : evt.type === "duplicate"
                    ? "bg-amber-950/40 border-amber-800/50"
                    : "bg-green-950/40 border-green-800/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-500">[{formatTime(evt.timestamp)}]</span>
                  {evt.type === "rejection" && (
                    <>
                      <span className="text-red-400 font-bold">⚡ REJECTION RECEIVED</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-cyan-300">Exception Auto-Created</span>
                    </>
                  )}
                  {evt.type === "duplicate" && (
                    <>
                      <span className="text-amber-400 font-bold">🔁 DUPLICATE DETECTED</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-amber-300">Updated Existing (attempt #{evt.attemptCount})</span>
                    </>
                  )}
                  {evt.type === "paid" && (
                    <>
                      <span className="text-green-400 font-bold">✓ PAID CLAIM RECEIVED</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-green-300">Auto-Resolved Exception</span>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px] pl-2">
                  <div>
                    <span className="text-slate-500">Rx#:</span>{" "}
                    <span className="text-white">{evt.rxNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">NDC:</span>{" "}
                    <span className="text-white">{evt.ndc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Patient:</span>{" "}
                    <span className="text-white">{evt.patient}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Plan BIN:</span>{" "}
                    <span className="text-white">{evt.planBin}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">PCN:</span>{" "}
                    <span className="text-white">{evt.planPcn}</span>
                  </div>
                  {evt.rejectCode && (
                    <div>
                      <span className="text-slate-500">NCPDP Code:</span>{" "}
                      <span className="text-red-300">{evt.rejectCode}</span>
                    </div>
                  )}
                  {evt.rejectText && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Reason:</span>{" "}
                      <span className="text-white">{evt.rejectText}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Exception:</span>{" "}
                    <span className="text-cyan-300">{evt.exceptionId}</span>
                  </div>
                  {evt.resolvedVia && (
                    <div className="col-span-3">
                      <span className="text-slate-500">Resolution:</span>{" "}
                      <span className="text-green-300">{evt.resolvedVia}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Deduplication Rules Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2 mb-3">
              <Icon icon="shield-check" className="w-4 h-4 text-indigo-600" />
              Deduplication & Auto-Resolution Logic
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Composite Key */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">Composite Identity Key</p>
                <div className="bg-slate-50 rounded p-2.5 border text-[10px] space-y-1 font-mono">
                  <div className="text-slate-700">Rx# <span className="text-slate-400">+</span></div>
                  <div className="text-slate-700">NDC <span className="text-slate-400">+</span></div>
                  <div className="text-slate-700">Patient ID <span className="text-slate-400">+</span></div>
                  <div className="text-slate-700">Plan BIN/PCN <span className="text-slate-400">+</span></div>
                  <div className="text-slate-700">Reject Code</div>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Same composite key = same exception. Prevents duplicate creation.
                </p>
              </div>

              {/* Duplicate Handling */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">On Duplicate Rejection</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="arrow-right" className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Update <code className="bg-amber-50 px-1 rounded">lastSeenAt</code> timestamp</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="arrow-right" className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Increment <code className="bg-amber-50 px-1 rounded">attemptCount</code></span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="arrow-right" className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Log event to activity history</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="x" className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Do NOT create new exception</span>
                  </div>
                </div>
              </div>

              {/* Paid Claim */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wider">On Paid Claim Received</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="check" className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700"><strong>BIN/PCN match:</strong> Auto-close → "Resolved — Paid Claim"</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="check" className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700"><strong>Alternate plan:</strong> Auto-close → "Resolved — Alternate Plan"</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="arrow-right" className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Log paid claim details to exception history</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Icon icon="arrow-right" className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">Do NOT reopen if already closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
