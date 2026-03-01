import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { LogOut, User, Package, Bike, Building2, LayoutDashboard, Globe, Menu, X, Bell, History, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { t } from "@/lib/i18n";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Fetch categories and areas from database
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: areas = [] } = trpc.areas.list.useQuery();
  
  // Check if user is courier or business
  const { data: courierProfile } = trpc.courier.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: businessProfile } = trpc.restaurant.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const isCourier = !!courierProfile;
  const isBusiness = !!businessProfile;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'mk', name: 'Македонски', flag: '🇲🇰' },
    { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleLogout = async () => {
    try {
      console.log('Logout started...');
      await logout();
      console.log('Logout successful, clearing localStorage...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('manus-runtime-user-info');
      console.log('localStorage cleared, redirecting...');
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('manus-runtime-user-info');
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/50' 
        : 'bg-white/80 backdrop-blur-sm shadow-sm'
    }`}>
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 md:gap-3 group">
            <img 
              src="/brand/fastlygo_icon_only.png" 
              alt="FastlyGo" 
              className="h-10 md:h-12 w-auto transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Fast<span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text">ly</span>Go
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink href="/about-us">{t('aboutUs')}</NavLink>
            <NavLink href="/how-it-works">{t('howItWorks')}</NavLink>
            <NavLink href="/services">{t('services')}</NavLink>
            
            {/* Categories Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all font-medium text-sm">
                  {t('categories', language)}
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 glass-card border-border/50">
                {categories.map((category) => {
                  let shortName: Record<string, string> = {};
                  try {
                    if (category.shortName && typeof category.shortName === 'string') {
                      shortName = JSON.parse(category.shortName);
                    }
                  } catch (e) {
                    console.error('Failed to parse shortName for category:', category.slug, e);
                  }
                  const title = shortName[language] || shortName['en'] || category.slug;
                  return (
                    <DropdownMenuItem 
                      key={category.id} 
                      onClick={() => setLocation(`/categories/${category.slug}`)}
                      className="cursor-pointer hover:bg-accent/50 rounded-lg transition-colors"
                    >
                      <span className="text-sm">{title}</span>
                    </DropdownMenuItem>
                  );
                })}
               </DropdownMenuContent>
            </DropdownMenu>
            
            <NavLink href="/areas">{t('areas')}</NavLink>

            {isAuthenticated ? (
              <>
                <NavLink href="/my-orders" icon={<Package className="h-4 w-4" />}>
                  {t('myOrders')}
                </NavLink>
                {isCourier && (
                  <NavLink href="/courier" icon={<Bike className="h-4 w-4" />}>
                    {t('courierPanel')}
                  </NavLink>
                )}
                {isBusiness && (
                  <NavLink href="/business" icon={<Building2 className="h-4 w-4" />}>
                    {t('businessPanel')}
                  </NavLink>
                )}
                <a 
                  href="/new-order" 
                  className="ml-2 px-5 py-2.5 rounded-xl btn-primary text-white font-semibold text-sm"
                >
                  {t('callCourierNow')}
                </a>
              </>
            ) : (
              <a 
                href="/new-order" 
                className="ml-2 px-5 py-2.5 rounded-xl btn-primary text-white font-semibold text-sm"
              >
                {t('callCourierNow')}
              </a>
            )}
          </nav>

          {/* Mobile Right Actions */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Language Selector - Flag Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 h-[42px] px-2.5 rounded-xl border-2 border-orange-500 bg-white transition-colors">
                  <span className="text-lg">{currentLanguage.flag}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 glass-card border-border/50">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as 'en' | 'tr' | 'mk' | 'sq')}
                    className={`cursor-pointer rounded-lg transition-colors ${
                      language === lang.code ? 'bg-orange-50 text-orange-600' : 'hover:bg-accent/50'
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile User Profile Icon */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 h-[42px] px-2.5 rounded-xl border-2 border-orange-500 bg-white transition-colors">
                    <User className="h-5 w-5 text-orange-500" />
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-border/50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer hover:bg-accent/50 rounded-lg py-2">
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/my-orders")} className="cursor-pointer hover:bg-accent/50 rounded-lg py-2">
                    <span>{t('myOrders')}</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer hover:bg-accent/50 rounded-lg">
                      <span>{t('adminPanel')}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer hover:bg-red-50 rounded-lg"
                  >
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 h-[42px] px-2.5 rounded-xl border-2 border-orange-500 bg-white transition-colors">
                    <User className="h-5 w-5 text-orange-500" />
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
                  <DropdownMenuItem 
                    onClick={() => setLocation('/login')}
                    className="cursor-pointer hover:bg-accent/50 rounded-lg py-2"
                  >
                    <span className="font-medium">{t('login')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/register')}
                    className="cursor-pointer hover:bg-orange-50 rounded-lg py-2 text-orange-600"
                  >
                    <span className="font-medium">{t('register')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Button */}
            <button
              className="p-2.5 rounded-xl hover:bg-accent/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>



          {/* Notifications & Language Selector & User Menu */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Notification Bell */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hover:bg-accent/50 rounded-xl h-10 w-10 p-0">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 glass-card border-border/50">
                  <DropdownMenuLabel className="font-semibold">{t('notifications')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    <DropdownMenuItem onClick={() => setLocation('/notifications')} className="cursor-pointer hover:bg-accent/50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{t('viewAllNotifications')}</span>
                        <span className="text-xs text-muted-foreground">{t('clickToSeeAll')}</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Language Dropdown - Desktop with Flag and Name */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2.5 h-[36px] rounded-lg border-2 border-orange-500 bg-white hover:bg-orange-50 transition-colors">
                  <span className="text-sm">{currentLanguage.flag}</span>
                  <span className="font-medium text-xs text-foreground hidden sm:inline">{currentLanguage.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Dil Seçin / Select Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as 'en' | 'tr' | 'mk' | 'sq')}
                    className={`gap-3 cursor-pointer rounded-lg transition-colors ${
                      language === lang.code ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-accent/50'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-orange-600">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu / Login - Desktop with Text */}
            <div>
            {isAuthenticated && user ? (
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 px-2.5 h-[36px] rounded-lg border-2 border-orange-500 bg-white hover:bg-orange-50 transition-colors">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-xs text-foreground hidden sm:inline">Hesabım</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-border/50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer hover:bg-accent/50 rounded-lg py-2">
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/my-orders")} className="cursor-pointer hover:bg-accent/50 rounded-lg py-2">
                    <span>{t('myOrders')}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      handleLogout();
                    }}
                    className="text-red-600 cursor-pointer hover:bg-red-50 rounded-lg"
                  >
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 px-2.5 h-[36px] rounded-lg border-2 border-orange-500 bg-white hover:bg-orange-50 transition-colors">
                    <User className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-xs text-foreground hidden sm:inline">{t('account')}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
                  <DropdownMenuItem 
                    onClick={() => setLocation('/login')}
                    className="cursor-pointer hover:bg-accent/50 rounded-lg py-2"
                  >
                    <span className="font-medium">{t('login')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/register')}
                    className="cursor-pointer hover:bg-orange-50 rounded-lg py-2 text-orange-600"
                  >
                    <span className="font-medium">{t('register')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 py-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1">
              <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>
                {t('home')}
              </MobileNavLink>
              <MobileNavLink href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>
                {t('howItWorks')}
              </MobileNavLink>
              <MobileNavLink href="/services" onClick={() => setMobileMenuOpen(false)}>
                {t('services')}
              </MobileNavLink>
              <MobileNavLink href="/about-us" onClick={() => setMobileMenuOpen(false)}>
                {t('aboutUs')}
              </MobileNavLink>

              {/* Categories Section */}
              <div className="px-2 py-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  {t('categories', language)}
                </div>
                {categories.map((category) => {
                  let shortName: Record<string, string> = {};
                  try {
                    if (category.shortName && typeof category.shortName === 'string') {
                      shortName = JSON.parse(category.shortName);
                    }
                  } catch (e) {
                    console.error('Failed to parse shortName for category:', category.slug, e);
                  }
                  const title = shortName[language] || shortName['en'] || category.slug;
                  return (
                    <MobileNavLink 
                      key={category.id} 
                      href={`/categories/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {title}
                    </MobileNavLink>
                  );
                })}
              </div>

              {isAuthenticated && (
                <>
                  <MobileNavLink href="/my-orders" onClick={() => setMobileMenuOpen(false)} icon={<Package className="h-4 w-4" />}>
                    {t('myOrders')}
                  </MobileNavLink>
                  {isCourier && (
                    <MobileNavLink href="/courier" onClick={() => setMobileMenuOpen(false)} icon={<Bike className="h-4 w-4" />}>
                      {t('courierPanel')}
                    </MobileNavLink>
                  )}
                  {isBusiness && (
                    <MobileNavLink href="/business" onClick={() => setMobileMenuOpen(false)} icon={<Building2 className="h-4 w-4" />}>
                      {t('businessPanel')}
                    </MobileNavLink>
                  )}
                  
                  <a 
                    href="/new-order" 
                    className="mx-2 mt-2 px-6 py-3 rounded-xl btn-primary text-white font-semibold shadow-md text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('callCourierNow')}
                  </a>
                </>
              )}

              


            </nav>
          </div>
        )}
      </div>
    </header>
    {/* Spacer to prevent content from going under fixed header */}
    <div className="h-16 md:h-18" />
    </>
  );
}

// Navigation Link Component
function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all font-medium text-sm"
    >
      {icon}
      {children}
    </a>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ href, children, onClick, icon }: { href: string; children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-foreground hover:text-orange-600 hover:bg-accent/50 transition-all font-medium"
      onClick={onClick}
    >
      {icon}
      {children}
    </a>
  );
}
