import { useState, useMemo, ReactElement } from "react";
import { trpc } from "@/lib/trpc";
import type { ErrorLog } from "../../../../drizzle/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertCircle, CheckCircle, Search, Eye, RefreshCw, Bug, Shield,
  AlertTriangle, Info, ChevronLeft, ChevronRight, X, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 20;

const SEV_CFG: Record<string, { label: string; color: string; bg: string; dotColor: string; icon: any }> = {
  critical: { label: "Kritik", color: "text-red-700", bg: "bg-red-50 border-red-200", dotColor: "bg-red-500", icon: Shield },
  high:     { label: "Yüksek", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dotColor: "bg-orange-500", icon: AlertTriangle },
  medium:   { label: "Orta", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dotColor: "bg-amber-400", icon: AlertCircle },
  low:      { label: "Düşük", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dotColor: "bg-blue-400", icon: Info },
};

const SRC_CFG: Record<string, { label: string; color: string; bg: string }> = {
  frontend: { label: "Frontend", color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
  backend:  { label: "Backend", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  api:      { label: "API", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEV_CFG[severity] || { label: severity, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />{cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const cfg = SRC_CFG[source] || { label: source, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
}

function MetadataDisplay({ metadata }: { metadata: unknown }): ReactElement {
  try {
    const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    return <pre className="text-[11px] bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono">{JSON.stringify(parsed, null, 2)}</pre>;
  } catch {
    return <pre className="text-[11px] bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono">{String(metadata)}</pre>;
  }
}

export default function ErrorLogs() {
  const [filters, setFilters] = useState({ source: undefined as string | undefined, severity: undefined as string | undefined, resolved: undefined as boolean | undefined, search: "" });
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [page, setPage] = useState(1);

  const { data: errorLogs, isLoading, refetch } = trpc.errorLogs.list.useQuery({
    source: filters.source as any, severity: filters.severity as any,
    resolved: filters.resolved, search: filters.search || undefined, limit: 500, offset: 0,
  });
  const { data: stats } = trpc.errorLogs.stats.useQuery();

  const resolveMutation = trpc.errorLogs.resolve.useMutation({
    onSuccess: () => { toast.success("Hata çözüldü olarak işaretlendi"); setSelectedError(null); setResolveNotes(""); refetch(); },
    onError: (e) => toast.error("Hata: " + e.message),
  });

  const logs = errorLogs || [];
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const paginated = logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasFilters = filters.source || filters.severity || filters.resolved !== undefined || filters.search;

  const statCards = [
    { label: "Toplam Hata", value: stats?.total ?? 0, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: Bug },
    { label: "Çözülmemiş", value: stats?.unresolved ?? 0, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100", icon: AlertCircle },
    { label: "Kritik", value: stats?.critical ?? 0, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100", icon: Shield },
    { label: "Yüksek", value: stats?.high ?? 0, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100", icon: AlertTriangle },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hata Logları</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sistem hatalarını izleyin ve yönetin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring}`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Hata mesajı veya URL ara..." value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              {[{k: undefined, l: "Tümü"}, {k: "critical", l: "Kritik"}, {k: "high", l: "Yüksek"}, {k: "medium", l: "Orta"}, {k: "low", l: "Düşük"}].map(({k, l}) => (
                <button key={l} onClick={() => { setFilters({...filters, severity: k}); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filters.severity === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              {[{k: undefined, l: "Tümü"}, {k: "frontend", l: "Frontend"}, {k: "backend", l: "Backend"}, {k: "api", l: "API"}].map(({k, l}) => (
                <button key={l} onClick={() => { setFilters({...filters, source: k}); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filters.source === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              {[{k: undefined, l: "Tümü"}, {k: false, l: "Açık"}, {k: true, l: "Çözüldü"}].map(({k, l}: any) => (
                <button key={l} onClick={() => { setFilters({...filters, resolved: k}); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filters.resolved === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        {hasFilters && (
          <button onClick={() => { setFilters({ source: undefined, severity: undefined, resolved: undefined, search: "" }); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><X className="h-3 w-3" />Filtreleri Temizle</button>
        )}
      </div>

      {/* Error List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">{[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex-1 h-4 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}</div>
        ) : !logs.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Bug className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Hata kaydı bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginated.map((error) => (
                <button key={error.id} onClick={() => { setSelectedError(error); setResolveNotes(""); }}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors flex items-start gap-4 group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${error.resolved ? "bg-emerald-50" : SEV_CFG[error.severity]?.bg.split(" ")[0] || "bg-gray-50"}`}>
                    {error.resolved ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                      (() => { const Icon = SEV_CFG[error.severity]?.icon || AlertCircle; return <Icon className={`h-4 w-4 ${SEV_CFG[error.severity]?.color || "text-gray-500"}`} />; })()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={error.severity} />
                      <SourceBadge source={error.source} />
                      {error.resolved && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700"><CheckCircle className="h-2.5 w-2.5" />Çözüldü</span>}
                      {error.statusCode && <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{error.statusCode}</span>}
                    </div>
                    <p className="font-medium text-gray-900 text-sm truncate">{error.errorType}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{error.errorMessage}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      <span>{format(new Date(error.createdAt), "dd/MM/yyyy HH:mm")}</span>
                      {error.url && <span className="truncate max-w-[200px]">{error.url}</span>}
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{logs.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, logs.length)} gösteriliyor</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>;
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg flex items-center gap-2"><Bug className="h-5 w-5 text-red-500" />Hata Detayı</SheetTitle>
          </SheetHeader>
          {selectedError && (
            <div className="space-y-5 py-5">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={selectedError.severity} />
                <SourceBadge source={selectedError.source} />
                {selectedError.resolved && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700"><CheckCircle className="h-2.5 w-2.5" />Çözüldü</span>}
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Hata Tipi</p>
                <p className="text-sm font-semibold text-gray-900">{selectedError.errorType}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Mesaj</p>
                <p className="text-sm text-gray-700">{selectedError.errorMessage}</p>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Stack Trace</p>
                  <pre className="text-[11px] bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">{selectedError.stackTrace}</pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tarih</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{format(new Date(selectedError.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
                </div>
                {selectedError.statusCode && (
                  <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">HTTP Status</p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">{selectedError.statusCode}</p>
                  </div>
                )}
                {selectedError.url && (
                  <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100 col-span-2">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">URL</p>
                    <p className="text-xs text-gray-700 mt-1 break-all">{selectedError.url}</p>
                  </div>
                )}
                {selectedError.userEmail && (
                  <div className="bg-gray-50 rounded-xl p-3 ring-1 ring-gray-100">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Kullanıcı</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedError.userEmail}</p>
                  </div>
                )}
              </div>

              {selectedError.metadata ? <MetadataDisplay metadata={selectedError.metadata as any} /> : null}

              {!selectedError.resolved && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Çözüldü Olarak İşaretle</p>
                  <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Çözüm notları (isteğe bağlı)..." className="rounded-xl" rows={2} />
                  <Button onClick={() => resolveMutation.mutate({ id: selectedError.id, notes: resolveNotes || undefined })}
                    disabled={resolveMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                    <CheckCircle className="h-4 w-4" />{resolveMutation.isPending ? "İşleniyor..." : "Çözüldü Olarak İşaretle"}
                  </Button>
                </div>
              )}

              {selectedError.resolved && selectedError.resolvedAt && (
                <div className="bg-emerald-50 rounded-xl p-3.5 ring-1 ring-emerald-100">
                  <p className="text-[11px] text-emerald-600 uppercase tracking-wider font-semibold mb-1">Çözülme Tarihi</p>
                  <p className="text-sm text-emerald-800">{format(new Date(selectedError.resolvedAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
