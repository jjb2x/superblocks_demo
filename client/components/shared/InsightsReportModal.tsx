import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insightEngine";
import { getReportTimestamp } from "@/lib/insightEngine";

interface InsightsReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: Insight[];
}

export default function InsightsReportModal({ open, onOpenChange, insights }: InsightsReportModalProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setGenerating(false);
      setProgress(0);
      setShowReport(false);
      return;
    }
    // Start generation animation
    setGenerating(true);
    setShowReport(false);
    setProgress(0);

    let frame = 0;
    const totalFrames = 20;
    const interval = setInterval(() => {
      frame++;
      setProgress(Math.min((frame / totalFrames) * 100, 100));
      if (frame >= totalFrames) {
        clearInterval(interval);
        setGenerating(false);
        setShowReport(true);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [open]);

  const handleExportPdf = useCallback(() => {
    if (!reportRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportHtml = reportRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vanderbilt Health Bridge — AI Insights Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1C1C1C;
            max-width: 800px;
            margin: 0 auto;
          }
          .report-header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 2px solid #CFAE70;
          }
          .report-header h1 {
            font-size: 20px;
            margin: 0 0 4px 0;
            color: #1C1C1C;
          }
          .report-header p {
            font-size: 12px;
            color: #666;
            margin: 0;
          }
          .insight-section {
            margin-bottom: 24px;
            padding: 16px;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .insight-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #1C1C1C;
          }
          .insight-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 12px;
            margin-bottom: 10px;
          }
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-critical { background: #fee2e2; color: #991b1b; }
          .badge-info { background: #dbeafe; color: #1e40af; }
          .insight-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #666;
            margin: 0 0 4px 0;
          }
          .insight-text {
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0 0 12px 0;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e5e5;
            font-size: 10px;
            color: #999;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
            .insight-section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${reportHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }, []);

  const severityColors = {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const severityLabels = {
    success: "On Track",
    warning: "Needs Attention",
    critical: "Action Required",
    info: "Informational",
  };

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const successCount = insights.filter((i) => i.severity === "success").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Icon icon="sparkles" className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">AI Operational Insights Report</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Vanderbilt Health Bridge — Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-pulse">
                <Icon icon="sparkles" className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Analyzing KPI metrics...</p>
                <p className="text-xs text-muted-foreground mt-1">Generating actionable recommendations</p>
              </div>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : showReport ? (
            <div>
              {/* Summary badges */}
              <div className="flex items-center gap-2 mb-4">
                {criticalCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                    {criticalCount} Action Required
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    {warningCount} Needs Attention
                  </Badge>
                )}
                {successCount > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                    {successCount} On Track
                  </Badge>
                )}
              </div>

              {/* Report content (visible + used for PDF) */}
              <div ref={reportRef}>
                {/* PDF-only header (hidden in UI) */}
                <div className="hidden">
                  <div className="report-header">
                    <h1>Vanderbilt Health Bridge — AI Insights Report</h1>
                    <p>{getReportTimestamp()}</p>
                  </div>
                </div>

                {/* Insights list */}
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="insight-section border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="insight-title text-sm font-semibold text-foreground">{insight.kpiLabel}</span>
                        <span className={cn(
                          "insight-badge text-[9px] font-medium px-1.5 py-0.5 rounded-full border",
                          severityColors[insight.severity],
                          `badge-${insight.severity}`
                        )}>
                          {severityLabels[insight.severity]}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="insight-label text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Observation</p>
                          <p className="insight-text text-xs text-foreground leading-relaxed">{insight.observation}</p>
                        </div>
                        <div>
                          <p className="insight-label text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recommendation</p>
                          <p className="insight-text text-xs text-foreground leading-relaxed">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PDF-only footer */}
                <div className="hidden">
                  <div className="footer">
                    <p>Generated by Vanderbilt Health Bridge • AI Advisory System • {getReportTimestamp()}</p>
                    <p>This report contains simulated AI-generated insights for demonstration purposes.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        {showReport && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/30">
            <p className="text-[10px] text-muted-foreground">AI-generated insights based on current operational metrics</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button size="sm" className="text-xs h-7 bg-sidebar-primary hover:bg-sidebar-primary/90" onClick={handleExportPdf}>
                <Icon icon="file-down" className="w-3 h-3 mr-1" />
                Export to PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
