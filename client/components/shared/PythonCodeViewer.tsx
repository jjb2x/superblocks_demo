import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PYTHON_TABS } from "@/data/pythonExport";

export default function PythonCodeViewer() {
  const [activeTab, setActiveTab] = useState<string>(PYTHON_TABS[0].id);

  const activeCode = PYTHON_TABS.find((t) => t.id === activeTab)?.code ?? "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeCode).then(() => {
      toast.success("Copied to clipboard", {
        description: `${PYTHON_TABS.find((t) => t.id === activeTab)?.label} module copied`,
      });
    });
  }, [activeCode, activeTab]);

  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
              <Icon icon="code" className="w-4 h-4 text-indigo-600" />
            </div>
            Python Data Export
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">Demo Reference</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Use these Python modules to replicate this dashboard's data layer in a Jupyter notebook, FastAPI service, or data pipeline.
          Each tab is a standalone module ready to copy and run.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tabs row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {PYTHON_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] h-7 gap-1 shrink-0"
            onClick={handleCopy}
          >
            <Icon icon="copy" className="w-3 h-3" />
            Copy to Clipboard
          </Button>
        </div>

        {/* Code block */}
        <div className="relative">
          <pre className="text-[11px] bg-slate-900 text-green-300 p-4 rounded-md overflow-x-auto overflow-y-auto whitespace-pre max-h-[500px] leading-relaxed font-mono">
            {activeCode}
          </pre>
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
              {PYTHON_TABS.find((t) => t.id === activeTab)?.label}.py
            </span>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon icon="file-code" className="w-3 h-3" />
            {activeCode.split("\n").length} lines
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="braces" className="w-3 h-3" />
            Python 3.11+ / Pydantic v2 / FastAPI
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="shield-check" className="w-3 h-3" />
            No PHI — synthetic data only
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
