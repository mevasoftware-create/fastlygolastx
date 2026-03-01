import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  BarChart3,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { APP_LOGO, APP_TITLE } from '@/const';
import { toast } from 'sonner';

interface AdminTopNavProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export function AdminTopNav({ activePage, onPageChange }: AdminTopNavProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Çıkış yapıldı');
      setTimeout(() => navigate('/admin'), 500);
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { id: 'statistics', label: 'İstatistikler', icon: BarChart3, path: '/admin/dashboard' },
    { id: 'pricing', label: 'Fiyatlandırma', icon: DollarSign, path: '/admin/pricing' },
    { id: 'settings', label: 'Ayarlar', icon: Settings, path: '/admin/settings' },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    onPageChange(item.id);
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-full">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-8 w-8 object-contain"
              />
            )}
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{APP_TITLE}</h1>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section - User Menu & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50">
            <nav className="px-4 py-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="px-4 py-3 border-t border-gray-200 space-y-2">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 mt-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
