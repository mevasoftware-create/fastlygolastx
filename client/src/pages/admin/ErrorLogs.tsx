import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { ErrorLog } from "../../../../drizzle/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Search, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ReactElement } from "react";

function MetadataDisplay({ metadata }: { metadata: unknown }): ReactElement {
  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    const formatted = JSON.stringify(parsed, null, 2);
    return (
      <div>
        <h3 className="font-semibold mb-2">Metadata</h3>
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
          {formatted as any}
        </pre>
      </div>
    );
  } catch (e) {
    return (
      <div>
        <h3 className="font-semibold mb-2">Metadata</h3>
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
          {String(metadata) as any}
        </pre>
      </div>
    );
  }
}

export default function ErrorLogs() {
  const [filters, setFilters] = useState({
    source: undefined as string | undefined,
    severity: undefined as string | undefined,
    resolved: undefined as boolean | undefined,
    search: "",
  });
  
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  // Fetch error logs
  const { data: errorLogs, isLoading, refetch } = trpc.errorLogs.list.useQuery({
    source: filters.source as any,
    severity: filters.severity as any,
    resolved: filters.resolved,
    search: filters.search || undefined,
    limit: 100,
    offset: 0,
  });

  // Fetch stats
  const { data: stats } = trpc.errorLogs.stats.useQuery();

  // Resolve mutation
  const resolveMutation = trpc.errorLogs.resolve.useMutation({
    onSuccess: () => {
      toast.success("Hata çözüldü olarak işaretlendi");
      setSelectedError(null);
      setResolveNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error("Hata çözülürken bir sorun oluştu: " + error.message);
    },
  });

  const handleResolve = () => {
    if (!selectedError) return;
    resolveMutation.mutate({
      id: selectedError.id,
      notes: resolveNotes || undefined,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "frontend":
        return "bg-blue-100 text-blue-800";
      case "backend":
        return "bg-purple-100 text-purple-800";
      case "api":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hata Logları</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Hata</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Çözülmemiş</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.unresolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kritik</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yüksek Öncelik</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.high}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
              />
            </div>

            <Select
              value={filters.source || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, source: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Kaynak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.severity || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, severity: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Önem Derecesi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Seviyeler</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filters.resolved === undefined
                  ? "all"
                  : filters.resolved
                  ? "resolved"
                  : "unresolved"
              }
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  resolved:
                    value === "all" ? undefined : value === "resolved" ? true : false,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="unresolved">Çözülmemiş</SelectItem>
                <SelectItem value="resolved">Çözülmüş</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filters.source || filters.severity || filters.resolved !== undefined || filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({ source: undefined, severity: undefined, resolved: undefined, search: "" })
              }
              className="mt-4"
            >
              <X className="h-4 w-4 mr-2" />
              Filtreleri Temizle
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hata Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : !errorLogs || errorLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz hata kaydı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {errorLogs.map((error) => (
                <div
                  key={error.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getSeverityColor(error.severity)}>
                          {error.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getSourceColor(error.source)}>
                          {error.source}
                        </Badge>
                        {error.resolved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Çözüldü
                          </Badge>
                        )}
                        {error.statusCode && (
                          <Badge variant="outline">{error.statusCode}</Badge>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">{error.errorType}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {error.errorMessage}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(error.createdAt), "dd/MM/yyyy HH:mm")}</span>
                        {error.url && <span className="truncate max-w-xs">{error.url}</span>}
                        {error.userEmail && <span>{error.userEmail}</span>}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedError(error)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hata Detayları</DialogTitle>
            <DialogDescription>
              Hata ID: {selectedError?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={getSeverityColor(selectedError.severity)}>
                  {selectedError.severity.toUpperCase()}
                </Badge>
                <Badge className={getSourceColor(selectedError.source)}>
                  {selectedError.source}
                </Badge>
                {selectedError.resolved && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Çözüldü
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Hata Tipi</h3>
                <p>{selectedError.errorType}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Hata Mesajı</h3>
                <p className="text-sm">{selectedError.errorMessage}</p>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {selectedError.url && (
                <div>
                  <h3 className="font-semibold mb-2">URL</h3>
                  <p className="text-sm break-all">{selectedError.url}</p>
                </div>
              )}

              {selectedError.userAgent && (
                <div>
                  <h3 className="font-semibold mb-2">User Agent</h3>
                  <p className="text-xs text-muted-foreground">{selectedError.userAgent}</p>
                </div>
              )}

              {selectedError.metadata && selectedError.metadata !== null && (
                <MetadataDisplay metadata={selectedError.metadata as any} /> as any
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Oluşturulma</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(selectedError.createdAt), "dd/MM/yyyy HH:mm:ss")}
                  </p>
                </div>

                {selectedError.userEmail && (
                  <div>
                    <h3 className="font-semibold mb-1">Kullanıcı</h3>
                    <p className="text-muted-foreground">{selectedError.userEmail}</p>
                  </div>
                )}

                {selectedError.statusCode && (
                  <div>
                    <h3 className="font-semibold mb-1">HTTP Status</h3>
                    <p className="text-muted-foreground">{selectedError.statusCode}</p>
                  </div>
                )}

                {selectedError.resolvedAt && (
                  <div>
                    <h3 className="font-semibold mb-1">Çözülme Tarihi</h3>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedError.resolvedAt), "dd/MM/yyyy HH:mm:ss")}
                    </p>
                  </div>
                )}
              </div>

              {selectedError.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Çözüm Notları</h3>
                  <p className="text-sm text-muted-foreground">{selectedError.notes}</p>
                </div>
              )}

              {!selectedError.resolved && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h3 className="font-semibold mb-2">Çözüm Notları (Opsiyonel)</h3>
                    <Textarea
                      placeholder="Hatayı nasıl çözdünüz?"
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {resolveMutation.isPending ? "Çözülüyor..." : "Çözüldü Olarak İşaretle"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
