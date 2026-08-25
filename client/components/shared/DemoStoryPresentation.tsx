import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STORY_SLIDES } from "@/data/demoStorySlides";

// --- Visual Mockup Components ---

function ExceptionQueueMockup() {
  return (
    <div className="mb-4 rounded-lg border border-orange-500/30 bg-slate-800/80 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-700/60 border-b border-white/10 flex items-center gap-2">
        <Icon icon="clipboard-list" className="w-3 h-3 text-orange-400" />
        <span className="text-[10px] font-medium text-white/70">Exception Work Queue — Critical Priority</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono text-orange-300">EXC-2025-1847</span>
          <span className="text-[10px] text-white/80 flex-1">Tacrolimus 1mg — PA Denied (Step Therapy)</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-medium">Critical</span>
          <span className="text-[10px] text-white/50">Sarah Chen</span>
          <span className="text-[10px] text-white/50">8:47 AM</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 mt-1 opacity-40">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-mono text-white/50">EXC-2025-1844</span>
          <span className="text-[10px] text-white/50 flex-1">Metformin 500mg — Insurance Lapse</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">High</span>
        </div>
      </div>
    </div>
  );
}

function MHAVMessageMockup() {
  return (
    <div className="mb-4 rounded-lg border border-blue-500/30 bg-slate-800/80 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-700/60 border-b border-white/10 flex items-center gap-2">
        <Icon icon="message-circle" className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-medium text-white/70">MHAV Secure Message — Outgoing to Patient</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-amber-600/30 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-300">MJ</span>
          </div>
          <div>
            <p className="text-[9px] text-white/80 font-medium">Marcus Johnson, PharmD</p>
            <p className="text-[8px] text-white/40">VUMC Mail-Order Pharmacy</p>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
          <p className="text-[9px] text-white/90 leading-relaxed">Hi Sarah — we received your refill request for Tacrolimus. Your insurance is requiring a Prior Authorization before we can fill it. <span className="text-blue-300 font-medium">We are contacting your provider's office now to get this resolved.</span> No action needed from you — we'll keep you updated.</p>
        </div>
        <p className="text-[8px] text-white/40 mt-1.5">Sent 8:52 AM • Read 8:54 AM ✓</p>
      </div>
    </div>
  );
}

function InBasketMockup() {
  return (
    <div className="mb-4 rounded-lg border border-blue-500/30 bg-slate-800/80 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-700/60 border-b border-white/10 flex items-center gap-2">
        <Icon icon="inbox" className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-medium text-white/70">Epic In-Basket — Urgent Message</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon icon="zap" className="w-2.5 h-2.5 text-red-400" />
          </div>
          <span className="text-[9px] font-medium text-red-300">URGENT</span>
          <span className="text-[8px] text-white/40 ml-auto">9:05 AM</span>
        </div>
        <p className="text-[9px] text-white/70 mb-1"><span className="text-white/90">To:</span> Dr. Anita Patel (Transplant Surgery)</p>
        <p className="text-[9px] text-white/70 mb-2"><span className="text-white/90">Re:</span> PA Required — Tacrolimus refill for Sarah Chen (MRN: 847291)</p>
        <div className="bg-white/5 border border-white/10 rounded p-2">
          <p className="text-[8px] text-white/70 leading-relaxed">Insurance requesting step therapy documentation. Please provide letter of medical necessity. Patient is 3mo post-transplant — <span className="text-white/90 font-medium">maintenance therapy, not a new start.</span></p>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ message }: { message?: "refill" | "approved" }) {
  const content = (() => {
    if (message === "refill") {
      return (
        <>
          <div className="bg-white/10 border border-white/10 rounded-lg p-2.5 mb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">VH</span>
              </div>
              <span className="text-[8px] text-white/80 font-medium">My Health at Vanderbilt</span>
            </div>
            <p className="text-[8px] text-white/90 leading-tight font-medium mb-0.5">Message from Sarah Chen:</p>
            <p className="text-[8px] text-white/70 leading-tight">"Hi, I need a refill on my Tacrolimus 1mg. I'm running low and my next dose is in 2 days."</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
            <p className="text-[8px] text-blue-400 font-medium">Refill Request Received</p>
            <p className="text-[7px] text-white/40">Processing...</p>
          </div>
        </>
      );
    }
    if (message === "approved") {
      return (
        <>
          <div className="bg-white/10 border border-white/10 rounded-lg p-2.5 mb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">VH</span>
              </div>
              <span className="text-[8px] text-white/80 font-medium">My Health at Vanderbilt</span>
            </div>
            <p className="text-[8px] text-white/90 leading-tight">Great news! Your Tacrolimus 1mg has been approved and is ready to ship. 🎉</p>
            <p className="text-[7px] text-white/60 mt-1">Please confirm your shipping address:</p>
            <p className="text-[7px] text-white/50 mt-0.5">123 Main St, Nashville, TN 37203</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
            <p className="text-[8px] text-green-400 font-medium">✓ Confirm Address</p>
            <p className="text-[7px] text-white/40">Tap to verify shipping details</p>
          </div>
        </>
      );
    }
    // Default: shipped notification
    return (
      <>
        <div className="bg-white/10 border border-white/10 rounded-lg p-2.5 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">VH</span>
            </div>
            <span className="text-[8px] text-white/80 font-medium">My Health at Vanderbilt</span>
          </div>
          <p className="text-[8px] text-white/90 leading-tight">Your prescription for Tacrolimus 1mg has been shipped! 📦</p>
          <p className="text-[7px] text-white/50 mt-1">Tracking: 1Z999AA10123456784</p>
          <p className="text-[7px] text-white/50">Est. delivery: Tomorrow by 10 AM</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
          <p className="text-[8px] text-green-400 font-medium">✓ No action required</p>
          <p className="text-[7px] text-white/40">Delivered to your door</p>
        </div>
      </>
    );
  })();

  return (
    <div className="mb-4 flex justify-center">
      <div className="w-[200px] rounded-[24px] border-2 border-white/20 bg-black p-2 shadow-2xl">
        <div className="rounded-[18px] bg-slate-900 overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between px-4 py-1 text-[8px] text-white/60">
            <span>1:15 PM</span>
            <span>●●●●○</span>
          </div>
          {/* Notification */}
          <div className="px-3 py-2">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Presentation ---

interface DemoStoryProps {
  open: boolean;
  onClose: () => void;
}

export default function DemoStoryPresentation({ open, onClose }: DemoStoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goNext = useCallback(() => {
    setCurrentSlide((s) => Math.min(s + 1, STORY_SLIDES.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => Math.max(s - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) setCurrentSlide(0);
  }, [open]);

  if (!open) return null;

  const slide = STORY_SLIDES[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === STORY_SLIDES.length - 1;

  const accentMap: Record<string, string> = {
    amber: "from-amber-600 to-amber-800",
    red: "from-red-600 to-red-800",
    orange: "from-orange-600 to-orange-800",
    blue: "from-blue-600 to-blue-800",
    green: "from-green-600 to-green-800",
    violet: "from-violet-600 to-violet-800",
  };

  const accentBadgeMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    red: "bg-red-100 text-red-800 border-red-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    violet: "bg-violet-100 text-violet-800 border-violet-300",
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/95 flex flex-col items-center justify-center">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="https://www.vanderbilthealth.com/img/vh_logo.png" alt="" className="h-6 brightness-0 invert opacity-70" />
          <span className="text-white/60 text-xs font-medium">Demo Story</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
        >
          <Icon icon="x" className="w-4 h-4 mr-1" /> Exit Presentation
        </Button>
      </div>

      {/* Slide Content */}
      <div className="max-w-4xl w-full px-8">
        {/* Slide number + section label */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white/40 text-sm font-mono">{currentSlide + 1} / {STORY_SLIDES.length}</span>
          <Badge className={accentBadgeMap[slide.accentColor] || accentBadgeMap.amber + " text-[10px]"}>
            {slide.appSection}
          </Badge>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentMap[slide.accentColor] || accentMap.amber} flex items-center justify-center shadow-lg`}>
            <Icon icon={slide.icon} className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{slide.title}</h1>
        </div>
        <p className="text-white/60 text-base mb-6 ml-[52px]">{slide.subtitle}</p>

        {/* Narrative */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-4">
          <p className="text-white/90 text-sm leading-relaxed">{slide.narrative}</p>
        </div>

        {/* Visual Mockup (slides 2, 3, 4, 5, 6) */}
        {slide.id === 2 && <PhoneMockup message="refill" />}
        {slide.id === 3 && <ExceptionQueueMockup />}
        {slide.id === 4 && <MHAVMessageMockup />}
        {slide.id === 5 && <InBasketMockup />}
        {slide.id === 6 && <PhoneMockup message="approved" />}

        {/* Annotations Grid */}
        <div className={`grid gap-3 ${slide.annotations.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
          {slide.annotations.map((ann, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                ann.highlight
                  ? "bg-white/10 border-white/20 shadow-md"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {ann.icon && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ann.highlight ? "bg-white/15" : "bg-white/5"
                }`}>
                  <Icon icon={ann.icon} className={`w-4 h-4 ${ann.highlight ? "text-white" : "text-white/60"}`} />
                </div>
              )}
              <div>
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{ann.label}</p>
                <p className={`text-sm font-medium ${ann.highlight ? "text-white" : "text-white/80"}`}>{ann.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6">
        {/* Prev */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={isFirst}
          className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Icon icon="arrow-left" className="w-4 h-4 mr-1" /> Previous
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {STORY_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all ${
                idx === currentSlide
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Next */}
        {isLast ? (
          <Button
            size="sm"
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Exit to Live App <Icon icon="arrow-right" className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Next <Icon icon="arrow-right" className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
