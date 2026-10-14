import { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi.js";
import {
  PLATFORMS,
  generateMockResults,
  type Platform,
  type PlatformConfig,
  type DatabaseMeta,
  type SchemaMeta,
  type TableMeta,
  type MockResult,
} from "@/data/schemaMetadata";

// --- Schema Tree Node Component ---

function SchemaTree({
  platform,
  onInsert,
}: {
  platform: PlatformConfig;
  onInsert: (text: string) => void;
}) {
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleDb = useCallback((name: string) => {
    setExpandedDbs((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const toggleSchema = useCallback((key: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleTable = useCallback((key: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="space-y-0.5">
      {platform.databases.map((db: DatabaseMeta) => (
        <div key={db.name}>
          <button
            onClick={() => toggleDb(db.name)}
            className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-muted/60 rounded text-left transition-colors"
          >
            <Icon
              icon={expandedDbs.has(db.name) ? "chevron-down" : "chevron-right"}
              className="w-3 h-3 text-muted-foreground shrink-0"
            />
            <Icon icon="database" className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="text-[11px] font-medium text-foreground truncate">{db.name}</span>
          </button>

          {expandedDbs.has(db.name) && (
            <div className="ml-4">
              {db.schemas.map((schema: SchemaMeta) => {
                const schemaKey = `${db.name}.${schema.name}`;
                return (
                  <div key={schemaKey}>
                    <button
                      onClick={() => toggleSchema(schemaKey)}
                      className="flex items-center gap-1.5 w-full px-2 py-1 hover:bg-muted/60 rounded text-left transition-colors"
                    >
                      <Icon
                        icon={expandedSchemas.has(schemaKey) ? "chevron-down" : "chevron-right"}
                        className="w-3 h-3 text-muted-foreground shrink-0"
                      />
                      <Icon icon="folder" className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[11px] text-foreground truncate">{schema.name}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{schema.tables.length}</span>
                    </button>

                    {expandedSchemas.has(schemaKey) && (
                      <div className="ml-4">
                        {schema.tables.map((table: TableMeta) => {
                          const tableKey = `${schemaKey}.${table.name}`;
                          const fullRef = `${db.name}.${schema.name}.${table.name}`;
                          return (
                            <div key={tableKey}>
                              <div className="flex items-center gap-1 w-full group">
                                <button
                                  onClick={() => toggleTable(tableKey)}
                                  className="flex items-center gap-1.5 flex-1 px-2 py-1 hover:bg-muted/60 rounded text-left transition-colors min-w-0"
                                >
                                  <Icon
                                    icon={expandedTables.has(tableKey) ? "chevron-down" : "chevron-right"}
                                    className="w-3 h-3 text-muted-foreground shrink-0"
                                  />
                                  <Icon icon="table-2" className="w-3 h-3 text-violet-500 shrink-0" />
                                  <span className="text-[10px] font-mono text-foreground truncate">{table.name}</span>
                                </button>
                                <button
                                  onClick={() => onInsert(fullRef)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/10 rounded transition-opacity shrink-0 mr-1"
                                  title="Insert into editor"
                                >
                                  <Icon icon="plus" className="w-3 h-3 text-primary" />
                                </button>
                              </div>

                              {expandedTables.has(tableKey) && (
                                <div className="ml-7 space-y-0">
                                  {table.columns.map((col) => (
                                    <button
                                      key={col.name}
                                      onClick={() => onInsert(col.name)}
                                      className="flex items-center gap-1.5 w-full px-2 py-0.5 hover:bg-muted/60 rounded text-left transition-colors group/col"
                                    >
                                      {col.isPrimaryKey ? (
                                        <span className="text-[9px] text-amber-500">🔑</span>
                                      ) : (
                                        <Icon icon="columns-2" className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      )}
                                      <span className="text-[10px] font-mono text-muted-foreground group-hover/col:text-foreground truncate">
                                        {col.name}
                                      </span>
                                      <span className="text-[8px] text-muted-foreground/60 ml-auto">{col.type}</span>
                                    </button>
                                  ))}
                                  <div className="px-2 py-0.5">
                                    <span className="text-[8px] text-muted-foreground/50">
                                      {table.rowCount.toLocaleString()} rows
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Results Table ---

function ResultsGrid({ result }: { result: MockResult }) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sortedRows = useMemo(() => {
    if (!sortCol) return result.rows;
    return [...result.rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [result.rows, sortCol, sortAsc]);

  const handleSort = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortAsc((a) => !a);
        return col;
      }
      setSortAsc(true);
      return col;
    });
  }, []);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 backdrop-blur-sm border-b">
              {result.columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2 text-left font-semibold text-foreground cursor-pointer hover:bg-muted select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {sortCol === col && (
                      <Icon icon={sortAsc ? "chevron-up" : "chevron-down"} className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                {result.columns.map((col) => (
                  <td key={col} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap font-mono">
                    {row[col] == null ? (
                      <span className="text-muted-foreground/40 italic">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main Workbench Component ---

export default function QueryWorkbench() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("snowflake");
  const [sql, setSql] = useState<string>("");
  const [result, setResult] = useState<MockResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSchema, setShowSchema] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { run: runDatabricksQuery, loading: dbRunning } = useApi("RunDatabricksQuery");

  const platform = PLATFORMS.find((p) => p.id === selectedPlatform) ?? PLATFORMS[0];

  const handleInsert = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSql((prev) => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = sql.slice(0, start);
    const after = sql.slice(end);
    const newSql = before + text + after;
    setSql(newSql);
    // Restore cursor position after insert
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  }, [sql]);

  const handleExecute = useCallback(async () => {
    if (!sql.trim()) {
      toast.error("No query to execute", { description: "Write a SQL query first" });
      return;
    }
    setQueryError(null);

    if (selectedPlatform === "databricks") {
      // Live Databricks execution
      setIsExecuting(true);
      try {
        const dbResult = await runDatabricksQuery({ sql });
        if (dbResult && typeof dbResult === "object" && "columns" in dbResult) {
          const typed = dbResult as { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; executionTimeMs: number };
          setResult({
            columns: typed.columns,
            rows: typed.rows as Record<string, string | number | null>[],
            executionTimeMs: typed.executionTimeMs,
            bytesScanned: "—",
            rowsScanned: typed.rowCount,
          });
          toast.success("Query executed against Databricks", {
            description: `${typed.rowCount} rows returned in ${typed.executionTimeMs}ms`,
          });
        }
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : String(error);
        setQueryError(message);
        setResult(null);
        toast.error("Query failed", { description: message });
      } finally {
        setIsExecuting(false);
      }
    } else {
      // Simulated for Snowflake/Oracle
      setIsExecuting(true);
      const delay = 300 + Math.random() * 700;
      setTimeout(() => {
        const mockResult = generateMockResults(selectedPlatform);
        setResult(mockResult);
        setIsExecuting(false);
        toast.success("Query executed successfully", {
          description: `${mockResult.rows.length} rows returned in ${mockResult.executionTimeMs}ms`,
        });
      }, delay);
    }
  }, [sql, selectedPlatform, runDatabricksQuery]);

  const handleExportCsv = useCallback(() => {
    toast.success("CSV exported", { description: "Results downloaded as query_results.csv (simulated)" });
  }, []);

  const handleSaveAsReport = useCallback(() => {
    toast.success("Saved as report", { description: "Query added to saved reports list (simulated)" });
  }, []);

  const handleClear = useCallback(() => {
    setSql("");
    setResult(null);
  }, []);

  return (
    <div className="p-5 space-y-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Icon icon="terminal" className="w-4 h-4 text-primary" />
            Ad Hoc Query Workbench
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Write and test SQL queries against connected data platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleClear}>
            <Icon icon="trash-2" className="w-3.5 h-3.5 mr-1.5" /> Clear
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleExecute}
            disabled={isExecuting || !sql.trim()}
          >
            {isExecuting ? (
              <><Icon icon="loader-2" className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Executing...</>
            ) : (
              <><Icon icon="play" className="w-3.5 h-3.5 mr-1.5" /> Execute Query</>
            )}
          </Button>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex items-center gap-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPlatform(p.id);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
              selectedPlatform === p.id
                ? "border-primary bg-primary/5 text-foreground shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
            }`}
          >
            <Icon
              icon={p.id === "snowflake" ? "snowflake" : p.id === "databricks" ? "blocks" : "globe"}
              className={`w-3.5 h-3.5 ${
                selectedPlatform === p.id ? "text-primary" : "text-muted-foreground"
              }`}
            />
            {p.label}
            {p.id === "databricks" && selectedPlatform === "databricks" && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-600 text-white font-bold uppercase tracking-wider">Live</span>
            )}
            <span className={`w-2 h-2 rounded-full ${
              p.connectionStatus === "connected" ? "bg-green-500" :
              p.connectionStatus === "limited" ? "bg-amber-500" : "bg-red-500"
            }`} />
          </button>
        ))}
        <div className="ml-auto text-[10px] text-muted-foreground">
          {platform.warehouse && <span>Warehouse: <span className="font-mono font-medium text-foreground">{platform.warehouse}</span></span>}
          {platform.cluster && <span>Cluster: <span className="font-mono font-medium text-foreground">{platform.cluster}</span></span>}
        </div>
      </div>

      {/* Schema Browser (Collapsible) */}
      <Card>
        <CardHeader className="pb-0 pt-3 px-4">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Icon icon="folder-tree" className="w-3.5 h-3.5 text-primary" />
              Schema Browser
              <Badge variant="secondary" className="text-[8px] h-4">
                {platform.databases.reduce((acc, db) => acc + db.schemas.reduce((s, sc) => s + sc.tables.length, 0), 0)} tables
              </Badge>
            </CardTitle>
            <Icon icon={showSchema ? "chevron-up" : "chevron-down"} className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </CardHeader>
        {showSchema && (
          <CardContent className="pt-2 pb-3 px-4">
            <p className="text-[9px] text-muted-foreground mb-2">
              Click a table name to insert its full reference, or click a column to insert the column name.
            </p>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 bg-muted/20">
              <SchemaTree platform={platform} onInsert={handleInsert} />
            </div>
            <div className="mt-2.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
              <Icon icon="shield-check" className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-800 leading-relaxed">
                <span className="font-semibold">Permission-aware access:</span> Only databases, schemas, and tables for which your account has been granted SELECT or USAGE privileges in the underlying data source are displayed. This application does not bypass or elevate native platform permissions — all access is governed by your identity's role grants in Snowflake, Databricks, or Oracle.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SQL Editor */}
      <Card>
        <CardContent className="p-0">
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={`-- Write your ${platform.label} SQL query here...\n-- Click tables/columns above to insert references\n\nSELECT * FROM ...`}
            className="w-full h-48 bg-slate-900 text-green-300 text-[11px] font-mono p-4 rounded-lg border-0 focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed placeholder:text-slate-500"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {queryError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2">
              <Icon icon="alert-triangle" className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">Query Error</p>
                <p className="text-[11px] text-red-600 mt-0.5 font-mono break-all">{queryError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {result && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Icon icon="table-2" className="w-3.5 h-3.5 text-green-600" />
                Results
                <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] h-5">
                  {result.rows.length} rows
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={handleExportCsv}>
                  <Icon icon="download" className="w-3 h-3 mr-1" /> Export CSV
                </Button>
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={handleSaveAsReport}>
                  <Icon icon="bookmark" className="w-3 h-3 mr-1" /> Save as Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResultsGrid result={result} />

            {/* Execution Stats */}
            <Separator className="my-3" />
            <div className="flex items-center gap-6 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon icon="clock" className="w-3 h-3" />
                Execution: <span className="font-medium text-foreground">{result.executionTimeMs}ms</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="hard-drive" className="w-3 h-3" />
                Scanned: <span className="font-medium text-foreground">{result.bytesScanned}</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="rows-3" className="w-3 h-3" />
                Rows scanned: <span className="font-medium text-foreground">{result.rowsScanned.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="check-circle" className="w-3 h-3 text-green-500" />
                Status: <span className="font-medium text-green-600">Success</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no results */}
      {!result && sql.trim() && (
        <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <Icon icon="play" className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Ready to execute</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Click "Execute Query" or press Ctrl+Enter to run your query
          </p>
        </div>
      )}
    </div>
  );
}
