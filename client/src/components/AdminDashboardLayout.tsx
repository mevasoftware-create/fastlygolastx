import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard, Package, Users, Bike, Building2, CreditCard,
  Star, Menu, X, LogOut, Grid3x3, MapPin, TrendingUp, ChevronDown,
  ChevronRight, Settings, Map, Bell, AlertTriangle, UserCircle, Zap,
  BarChart3, ShoppingBag, ExternalLink, Globe, ArrowLeftRight,
  MessageSquare, DollarSign, FileText, Ticket, HeadphonesIcon,
  Wrench, Gift, Smartphone, Search, PanelLeftClose, PanelLeft,
  Sun, Moon, Activity, Command,
} from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  badge?: string | number;
  badgeColor?: string;
  badgeType?: "dot" | "count" | "text";
  children?: MenuItem[];
  section?: string;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "Genel",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      { icon: Package, label: "Siparişler", path: "/admin/orders", badge: 0, badgeType: "count", badgeColor: "bg-orange-500" },
      { icon: Map, label: "Canlı Harita", path: "/admin/map", badge: "CANLI", badgeType: "text", badgeColor: "bg-emerald-500" },
    ],
  },
  {
    title: "Kullanıcı Yönetimi",
    items: [
      { icon: UserCircle, label: "Tüm Kullanıcılar", path: "/admin/users" },
      { icon: Bike, label: "Kuryeler", path: "/admin/couriers" },
      { icon: Building2, label: "İşletmeler", path: "/admin/businesses" },
      { icon: ShoppingBag, label: "Müşteriler", path: "/admin/customers" },
    ],
  },
  {
    title: "Finans & Analiz",
    items: [
      { icon: CreditCard, label: "Ödemeler", path: "/admin/payments" },
      { icon: TrendingUp, label: "Gelir Analizi", path: "/admin/revenue" },
      { icon: DollarSign, label: "Fiyatlandırma", path: "/admin/pricing" },
      { icon: Zap, label: "Surge Pricing", path: "/admin/surge-pricing" },
    ],
  },
  {
    title: "Etkileşim",
    items: [
      { icon: Star, label: "Kurye Puanları", path: "/admin/ratings" },
      { icon: MessageSquare, label: "Müşteri Yorumları", path: "/admin/reviews" },
      { icon: Bell, label: "Bildirimler", path: "/admin/notifications" },
      { icon: Ticket, label: "Kuponlar", path: "/admin/coupons" },
      { icon: HeadphonesIcon, label: "Destek Talepleri", path: "/admin/support" },
      { icon: Gift, label: "Referanslar", path: "/admin/referrals" },
    ],
  },
  {
    title: "Sistem & Ayarlar",
    items: [
      { icon: Grid3x3, label: "Kategoriler", path: "/admin/categories" },
      { icon: MapPin, label: "Hizmet Bölgeleri", path: "/admin/areas" },
      { icon: FileText, label: "Sayfalar", path: "/admin/pages" },
      { icon: Globe, label: "SEO Yönetimi", path: "/admin/seo" },
      { icon: Wrench, label: "Site Ayarları", path: "/admin/site-settings" },
      { icon: ArrowLeftRight, label: "Yönlendirmeler", path: "/admin/redirects" },
      { icon: Smartphone, label: "Uygulama Versiyonları", path: "/admin/app-versions" },
      { icon: AlertTriangle, label: "Hata Günlükleri", path: "/admin/error-logs" },
    ],
  },
];

// Breadcrumb helper
const pathLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Siparişler",
  "/admin/map": "Canlı Harita",
  "/admin/users": "Kullanıcılar",
  "/admin/couriers": "Kuryeler",
  "/admin/businesses": "İşletmeler",
  "/admin/customers": "Müşteriler",
  "/admin/payments": "Ödemeler",
  "/admin/revenue": "Gelir Analizi",
  "/admin/pricing": "Fiyatlandırma",
  "/admin/surge-pricing": "Surge Pricing",
  "/admin/ratings": "Kurye Puanları",
  "/admin/reviews": "Müşteri Yorumları",
  "/admin/notifications": "Bildirimler",
  "/admin/coupons": "Kuponlar",
  "/admin/support": "Destek Talepleri",
  "/admin/referrals": "Referanslar",
  "/admin/categories": "Kategoriler",
  "/admin/areas": "Hizmet Bölgeleri",
  "/admin/pages": "Sayfalar",
  "/admin/seo": "SEO Yönetimi",
  "/admin/site-settings": "Site Ayarları",
  "/admin/redirects": "Yönlendirmeler",
  "/admin/app-versions": "Uygulama Versiyonları",
  "/admin/error-logs": "Hata Günlükleri",
};

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  const logoutMutation = trpc.auth.logout.useMutation();
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; path: string; icon: any; section: string }[] = [];
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.label.toLowerCase().includes(q) && item.path) {
          results.push({ label: item.label, path: item.path, icon: item.icon, section: section.title });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const isPathActive = (path: string) => {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  };

  const currentPageLabel = pathLabels[location] || "Dashboard";

  const sidebarWidth = sidebarCollapsed ? "w-[68px]" : "w-[260px]";
  const mainMargin = sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[260px]";

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* ===== COMMAND PALETTE / SEARCH OVERLAY ===== */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sayfa ara..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded-md">ESC</kbd>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto p-2">
                {searchResults.map((r) => (
                  <button
                    key={r.path}
                    onClick={() => { setLocation(r.path); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-orange-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <r.icon className="h-4 w-4 text-gray-500 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                      <p className="text-[11px] text-gray-400">{r.section}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">Sonuç bulunamadı</p>
              </div>
            )}
            {!searchQuery && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400">Bir sayfa adı yazarak hızlıca gezinin</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            {APP_LOGO ? (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-7 rounded-lg" />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">F</span>
              </div>
            )}
            <span className="font-semibold text-gray-900 text-sm">{APP_TITLE}</span>
          </div>
          <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${sidebarWidth}
          bg-[#0f1117] text-white`}
      >
        {/* Logo area */}
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-5"} h-16 border-b border-white/[0.06] flex-shrink-0`}>
          {sidebarCollapsed ? (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold text-sm">F</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {APP_LOGO ? (
                <img src={APP_LOGO} alt={APP_TITLE} className="h-9 w-9 rounded-xl object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-white text-[15px] leading-tight truncate">{APP_TITLE}</p>
                <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-[0.15em]">Yönetim Paneli</p>
              </div>
            </div>
          )}
        </div>

        {/* Search trigger in sidebar */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-4 pb-2 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-left group"
            >
              <Search className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[13px] text-gray-500 flex-1">Ara...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium text-gray-600 bg-white/[0.06] rounded border border-white/[0.08]">⌘K</kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500/70">{section.title}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  if (!item.path) return null;
                  const isActive = isPathActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <div
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center ${sidebarCollapsed ? "justify-center" : ""} gap-2.5 ${sidebarCollapsed ? "px-0 py-2.5 mx-auto w-11 h-11 justify-center" : "px-3 py-2"} rounded-xl cursor-pointer transition-all duration-150 group relative ${
                          isActive
                            ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400"
                            : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
                        )}
                        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-orange-400" : "text-gray-500 group-hover:text-gray-300"} transition-colors`} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="text-[13px] font-medium flex-1 truncate">{item.label}</span>
                            {item.badge !== undefined && item.badgeType === "text" && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || "bg-orange-500"} animate-pulse`}>
                                {item.badge}
                              </span>
                            )}
                            {item.badge !== undefined && item.badgeType === "count" && Number(item.badge) > 0 && (
                              <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white ${item.badgeColor || "bg-orange-500"}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 border-t border-white/[0.06]">
          {/* Collapse toggle - desktop only */}
          <div className="hidden lg:flex items-center justify-center py-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
              title={sidebarCollapsed ? "Genişlet" : "Daralt"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* Site link */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-1">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 transition-all group text-[13px]"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">Siteye Git</span>
              </a>
            </div>
          )}

          {/* User card */}
          <div className={`${sidebarCollapsed ? "px-2" : "px-3"} pb-4 pt-1`}>
            {sidebarCollapsed ? (
              <button
                onClick={handleLogout}
                className="w-11 h-11 mx-auto rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{user?.name || "Admin"}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                    title="Çıkış Yap"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className={`${mainMargin} transition-all duration-300`}>
        {/* Top bar - desktop */}
        <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin">
              <span className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Admin</span>
            </Link>
            {location !== "/admin" && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                <span className="text-gray-900 font-medium">{currentPageLabel}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100/80 hover:bg-gray-100 text-gray-500 text-sm transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-[13px]">Ara...</span>
              <kbd className="ml-4 text-[10px] font-medium text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Siteye Git"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-14 lg:pt-0 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
