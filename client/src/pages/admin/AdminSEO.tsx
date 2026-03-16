import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  RefreshCw,
  Globe,
  ExternalLink,
  CheckCircle2,
  Map,
  FileText,
  Search,
  Copy,
  AlertCircle,
} from "lucide-react";

export default function AdminSEO() {
  const [copied, setCopied] = useState(false);

  const { data: sitemapData, isLoading: sitemapLoading, refetch } = trpc.admin.getSitemapPreview.useQuery();

  const refreshMutation = trpc.admin.refreshSitemap.useMutation({
    onSuccess: (data) => {
      toast.success(`Sitemap Yenilendi — ${data.urlCount} URL güncellendi`);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCopySitemapUrl = () => {
    navigator.clipboard.writeText("https://fastlygo.mk/sitemap.xml");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Sitemap URL panoya kopyalandı");
  };

  const staticUrls = sitemapData?.urls.filter((u) => !u.includes("/areas/") && !u.includes("/categories/")) || [];
  const areaUrls = sitemapData?.urls.filter((u) => u.includes("/areas/")) || [];
  const categoryUrls = sitemapData?.urls.filter((u) => u.includes("/categories/")) || [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sitemap yönetimi ve Google Search Console entegrasyonu
          </p>
        </div>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? "Yenileniyor..." : "Sitemap Yenile"}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sitemapData?.urlCount ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Toplam URL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Map className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{areaUrls.length}</p>
                <p className="text-sm text-muted-foreground">Bölge Sayfası</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categoryUrls.length}</p>
                <p className="text-sm text-muted-foreground">Kategori Sayfası</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Sitemap URL
            </CardTitle>
            <CardDescription>
              Bu URL'i Google Search Console'a ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="text-sm flex-1 break-all">https://fastlygo.mk/sitemap.xml</code>
              <Button variant="ghost" size="sm" onClick={handleCopySitemapUrl} className="shrink-0">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={() => window.open("https://search.google.com/search-console/sitemaps", "_blank")}
              >
                <Search className="h-4 w-4" />
                Google Search Console → Sitemaps
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={() => window.open("https://fastlygo.mk/sitemap.xml", "_blank")}
              >
                <Globe className="h-4 w-4" />
                Canlı Sitemap'i Görüntüle
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Search Console Adımları */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Google Search Console Adımları
            </CardTitle>
            <CardDescription>
              Sitemap göndererek indekslemeyi hızlandırın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {[
                { step: "1", text: "Google Search Console'a giriş yapın", url: "https://search.google.com/search-console" },
                { step: "2", text: "Sol menüden 'Sitemaps' seçin" },
                { step: "3", text: "Sitemap URL'ini yapıştırın: sitemap.xml" },
                { step: "4", text: "'Gönder' butonuna tıklayın" },
                { step: "5", text: "URL İnceleme aracıyla kritik sayfaları önceliklendirin", url: "https://search.google.com/search-console/inspect" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                  <span className="text-muted-foreground flex-1">
                    {item.text}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* URL Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sitemap URL Listesi
            {sitemapData && (
              <Badge variant="secondary" className="ml-auto">
                {sitemapData.urlCount} URL
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sitemap'te yer alan tüm sayfalar. Yeni bölge/kategori eklenince "Sitemap Yenile" butonuna tıklayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sitemapLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Yükleniyor...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Static Pages */}
              {staticUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Statik Sayfalar ({staticUrls.length})
                  </p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {staticUrls.map((url) => (
                        <div key={url} className="flex items-center gap-2 text-sm py-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground hover:underline truncate"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Area Pages */}
              {areaUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Bölge Sayfaları ({areaUrls.length})
                  </p>
                  <ScrollArea className="h-40">
                    <div className="space-y-1">
                      {areaUrls.map((url) => (
                        <div key={url} className="flex items-center gap-2 text-sm py-1">
                          <Map className="h-3 w-3 text-orange-500 shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground hover:underline truncate"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Category Pages */}
              {categoryUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Kategori Sayfaları ({categoryUrls.length})
                  </p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {categoryUrls.map((url) => (
                        <div key={url} className="flex items-center gap-2 text-sm py-1">
                          <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground hover:underline truncate"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {!sitemapData?.urlCount && (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Sitemap verisi yüklenemedi. "Sitemap Yenile" butonuna tıklayın.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
