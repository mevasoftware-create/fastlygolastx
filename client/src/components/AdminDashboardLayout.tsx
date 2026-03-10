import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  Users,
  Bike,
  Building2,
  CreditCard,
  Star,
  Menu,
  X,
  LogOut,
  Grid3x3,
  MapPin,
  TrendingUp,
  ChevronDown,
  Settings,
  Map,
  Bell,
  AlertTriangle,
  UserCircle,
  Zap,
  BarChart3,
  ShoppingBag,
  ExternalLink,
  Globe,
  ArrowLeftRight,
  MessageSquare,
  DollarSign,
  FileText,
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
  badge?: string;
  badgeColor?: string;
  children?: MenuItem[];
}

const menuGroups: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/admin",
  },
  {
    icon: Package,
    label: "Siparişler",
    path: "/admin/orders",
  },
  {
    icon: Map,
    label: "Canlı Harita",
    path: "/admin/map",
    badge: "CANLI",
    badgeColor: "bg-green-500",
  },
  {
    icon: Users,
    label: "Kullanıcılar",
    children: [
      { icon: UserCircle, label: "Tüm Kullanıcılar", path: "/admin/users" },
      { icon: Bike, label: "Kuryeler", path: "/admin/couriers" },
      { icon: Building2, label: "İşletmeler", path: "/admin/businesses" },
      { icon: ShoppingBag, label: "Müşteriler", path: "/admin/customers" },
    ],
  },
  {
    icon: BarChart3,
    label: "Finans",
    children: [
      { icon: CreditCard, label: "Ödemeler", path: "/admin/payments" },
      { icon: TrendingUp, label: "Gelir & Analiz", path: "/admin/revenue" },
      { icon: DollarSign, label: "Fiyatlandırma", path: "/admin/pricing" },
    ],
  },
  {
    icon: Star,
    label: "Değerlendirmeler",
    children: [
      { icon: Star, label: "Kurye Puanları", path: "/admin/ratings" },
      { icon: MessageSquare, label: "Müşteri Yorumları", path: "/admin/reviews" },
    ],
  },
  {
    icon: Bell,
    label: "Bildirimler",
    path: "/admin/notifications",
  },
  {
    icon: AlertTriangle,
    label: "Hata Günlükleri",
    path: "/admin/error-logs",
  },
  {
    icon: Settings,
    label: "Ayarlar",
    children: [
      { icon: Grid3x3, label: "Kategoriler", path: "/admin/categories" },
      { icon: MapPin, label: "Hizmet Bölgeleri", path: "/admin/areas" },
      { icon: FileText, label: "Sayfalar (SEO)", path: "/admin/pages" },
    ],
  },
];

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Kullanıcılar", "Finans", "Ayarlar"]);

  const logoutMutation = trpc.auth.logout.useMutation();
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const isPathActive = (path: string) => {
    if (path === "/admin") return location === "/admin";
    return location.startsWith(path);
  };

  const isGroupActive = (item: MenuItem): boolean => {
    if (item.path) return isPathActive(item.path);
    return item.children?.some((c) => c.path && isPathActive(c.path)) ?? false;
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.label);
    const active = isGroupActive(item);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleGroup(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group ${
              active
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${active ? "bg-orange-500" : "bg-white/5 group-hover:bg-white/10"}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
              {item.children!.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (item.path) {
      const isActive = isPathActive(item.path);
      return (
        <Link key={item.path} href={item.path}>
          <div
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
              isActive
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
            }`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {item.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || "bg-orange-500"}`}>
                {item.badge}
              </span>
            )}
          </div>
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ background: "#1a1a2e" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-7" />}
          <span className="font-bold text-white">{APP_TITLE}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 flex-shrink-0">
          {APP_LOGO ? (
            <img src={APP_LOGO} alt={APP_TITLE} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
          )}
          <div>
            <p className="font-bold text-white text-base leading-tight">{APP_TITLE}</p>
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuGroups.map((item) => renderMenuItem(item))}
        </nav>

        {/* Divider */}
        <div className="px-5 py-1 flex-shrink-0">
          <div className="h-px bg-white/10" />
        </div>

        {/* Site Link */}
        <div className="px-3 pb-2 flex-shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Siteye Git</span>
          </a>
        </div>

        {/* User */}
        <div className="px-3 pb-4 flex-shrink-0">
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #ff7a35, #f55f00)" }}>
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              title="Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
