import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Link as LinkIcon,
} from "lucide-react";

interface SitemapData {
  urlCount: number;
  urls: string[];
}

export default function AdminSEO() {
  const [copied, setCopied] = useState(false);
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);

  const fetchSitemap = async () => {
    setSitemapLoading(true);
    try {
      const res = await fetch("/sitemap.xml");
      const xml = await res.text();
      const urlCount = (xml.match(/<url>/g) || []).length;
      const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
      const urls: string[] = [];
      for (const match of locMatches) {
        const url = match.replace(/<\/?loc>/g, "");
        if (!urls.includes(url)) urls.push(url);
      }
      setSitemapData({ urlCount, urls });
      toast.success(`Sitemap yüklendi — ${urlCount} URL`);
    } catch {
      toast.error("Sitemap yüklenemedi");
    } finally {
      setSitemapLoading(false);
    }
  };

  const handleCopySitemapUrl = () => {
    navigator.clipboard.writeText("https://fastlygo.mk/sitemap.xml");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Sitemap URL panoya kopyalandı");
  };

  const staticUrls = sitemapData?.urls.filter((u: string) => !u.includes("/areas/") && !u.includes("/categories/")) || [];
  const areaUrls = sitemapData?.urls.filter((u: string) => u.includes("/areas/")) || [];
  const categoryUrls = sitemapData?.urls.filter((u: string) => u.includes("/categories/")) || [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SEO Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sitemap yönetimi ve Google Search Console entegrasyonu
          </p>
        </div>
        <Button
          onClick={fetchSitemap}
          disabled={sitemapLoading}
          className="gap-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
        >
          {sitemapLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {sitemapLoading ? "Yükleniyor..." : "Sitemap Görüntüle"}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{sitemapData?.urlCount ?? "—"}</p>
                <p className="text-xs text-gray-500">Toplam URL</p>
            </div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-orange-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Map className="h-5 w-5 text-orange-600" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{areaUrls.length || "—"}</p>
                <p className="text-xs text-gray-500">Bölge Sayfası</p>
            </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{categoryUrls.length || "—"}</p>
                <p className="text-xs text-gray-500">Kategori Sayfası</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap URL */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-500" />
              Sitemap URL
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Bu URL'i Google Search Console'a ekleyin
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border">
              <code className="text-sm text-gray-700 flex-1 break-all">https://fastlygo.mk/sitemap.xml</code>
              <Button variant="ghost" size="icon" onClick={handleCopySitemapUrl} className="shrink-0 h-8 w-8 rounded-lg">
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start rounded-xl"
                onClick={() => window.open("https://search.google.com/search-console/sitemaps", "_blank")}
              >
                <Search className="h-4 w-4" />
                Google Search Console → Sitemaps
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 justify-start rounded-xl"
                onClick={() => window.open("https://fastlygo.mk/sitemap.xml", "_blank")}
              >
                <Globe className="h-4 w-4" />
                Canlı Sitemap'i Görüntüle
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Google Search Console Adımları */}
        <div className="bg-white rounded-2xl border border-gray-100">
            <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    Google Search Console Adımları
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Sitemap göndererek indekslemeyi hızlandırın
                </p>
            </div>
            <div className="p-5">
                <ol className="space-y-3 text-sm">
                {[
                    { step: "1", text: "Google Search Console'a giriş yapın", url: "https://search.google.com/search-console" },
                    { step: "2", text: "Sol menüden 'Sitemaps' seçin" },
                    { step: "3", text: "Sitemap URL'ini yapıştırın: sitemap.xml" },
                    { step: "4", text: "'Gönder' butonuna tıklayın" },
                    { step: "5", text: "URL İnceleme aracıyla kritik sayfaları önceliklendirin", url: "https://search.google.com/search-console/inspect" },
                ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                        {item.step}
                    </span>
                    <span className="text-gray-600 flex-1">
                        {item.text}
                        {item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-orange-500 hover:underline inline-flex items-center gap-1"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                        )}
                    </span>
                    </li>
                ))}
                </ol>
            </div>
        </div>
      </div>

      {/* URL Listesi */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Sitemap URL Listesi
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Sitemap'te yer alan tüm sayfalar.
                </p>
            </div>
            {sitemapData && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-gray-50 border-gray-200 text-gray-600">
                    {sitemapData.urlCount} URL
                </span>
            )}
        </div>
        <div className="p-5">
          {sitemapLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
                <span className="text-sm font-medium">URL'ler Yükleniyor...</span>
            </div>
          ) : !sitemapData ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Sitemap verisi bulunamadı.</p>
                <p className="text-sm text-gray-500">Başlamak için "Sitemap Görüntüle" butonuna tıklayın.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staticUrls.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Statik Sayfalar ({staticUrls.length})
                  </p>
                  <ScrollArea className="h-32">
                    <div className="divide-y divide-gray-100 border rounded-xl">
                      {staticUrls.map((url: string) => (
                        <div key={url} className="px-4 py-2 flex items-center gap-3 text-sm group">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-600 truncate flex-1">
                            {url.replace("https://fastlygo.mk", "")}
                          </a>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {areaUrls.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Bölge Sayfaları ({areaUrls.length})
                  </p>
                  <ScrollArea className="h-40">
                    <div className="divide-y divide-gray-100 border rounded-xl">
                      {areaUrls.map((url: string) => (
                        <div key={url} className="px-4 py-2 flex items-center gap-3 text-sm group">
                          <Map className="h-4 w-4 text-orange-500 shrink-0" />
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-600 truncate flex-1">
                            {url.replace("https://fastlygo.mk", "")}
                          </a>
                           <a href={url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {categoryUrls.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                    Kategori Sayfaları ({categoryUrls.length})
                  </p>
                  <ScrollArea className="h-32">
                    <div className="divide-y divide-gray-100 border rounded-xl">
                      {categoryUrls.map((url: string) => (
                        <div key={url} className="px-4 py-2 flex items-center gap-3 text-sm group">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-gray-600 hover:text-orange-600 truncate flex-1">
                            {url.replace("https://fastlygo.mk", "")}
                          </a>
                           <a href={url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
