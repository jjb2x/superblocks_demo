import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "lucide-react/dynamic";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Trend = "up" | "down" | "neutral";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: Trend;
  trendValue?: string;
  trendLabel?: string;
  icon?: IconName;
  iconColor?: string;
  alert?: boolean;
  tooltip?: string;
  className?: string;
  /** AI insight content — when provided, shows a lightbulb icon with popover */
  insight?: {
    observation: string;
    recommendation: string;
    severity: "success" | "warning" | "critical" | "info";
  };
}

function InsightPopover({ insight }: { insight: NonNullable<KpiCardProps["insight"]> }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleOpen = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setGenerating(true);
      setShowContent(false);
    }
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = setTimeout(() => {
      setGenerating(false);
      setShowContent(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [generating]);

  const severityColors = {
    success: "text-green-600 bg-green-50 border-green-200",
    warning: "text-amber-600 bg-amber-50 border-amber-200",
    critical: "text-red-600 bg-red-50 border-red-200",
    info: "text-blue-600 bg-blue-50 border-blue-200",
  };

  const severityLabels = {
    success: "On Track",
    warning: "Needs Attention",
    critical: "Action Required",
    info: "Informational",
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-5 h-5 rounded flex items-center justify-center bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors shrink-0"
          aria-label="View AI insight"
        >
          <Icon icon="lightbulb" className="w-3 h-3 text-amber-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Icon icon="sparkles" className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground">AI Insight</span>
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border ml-auto", severityColors[insight.severity])}>
              {severityLabels[insight.severity]}
            </span>
          </div>
        </div>
        <div className="p-3">
          {generating ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-muted-foreground">Analyzing metrics...</span>
            </div>
          ) : showContent ? (
            <div className="space-y-2.5 animate-in fade-in duration-300">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observation</p>
                <p className="text-xs text-foreground leading-relaxed">{insight.observation}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Recommendation</p>
                <p className="text-xs text-foreground leading-relaxed">{insight.recommendation}</p>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function KpiCard({
  label,
  value,
  subtext,
  trend,
  trendValue,
  trendLabel,
  icon,
  iconColor = "text-primary",
  alert = false,
  tooltip,
  className,
  insight,
}: KpiCardProps) {
  const trendColor =
    trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground";
  const trendIcon: IconName = trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "minus";

  return (
    <div
      className={cn(
        "bg-card rounded-lg border px-4 py-4 flex flex-col gap-2 shadow-sm",
        alert && "border-red-300 bg-red-50/50",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help border-b border-dashed border-muted-foreground/50">{label}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            label
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {insight && <InsightPopover insight={insight} />}
          {icon && (
            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center bg-muted/70 shrink-0", alert && "bg-red-100")}>
              <Icon icon={icon} className={cn("w-3.5 h-3.5", iconColor, alert && "text-red-600")} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className={cn("text-2xl font-bold leading-none", alert ? "text-red-700" : "text-foreground")}>
          {value}
        </span>
      </div>

      {(trend || subtext) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {trend && trendValue && (
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
              <Icon icon={trendIcon} className="w-3 h-3" />
              {trendValue}
            </span>
          )}
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
          {!trend && subtext && (
            <span className="text-xs text-muted-foreground">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
