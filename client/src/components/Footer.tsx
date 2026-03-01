import { Twitter, Instagram, Mail, Phone, MapPin, Youtube, ArrowUpRight, Package, Bike, Building2, Clock, Shield, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative overflow-hidden">
      {/* Top CTA Section */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="grid md:grid-cols-3 gap-6 text-white">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-lg">{t('fastDelivery')}</div>
                <div className="text-sm opacity-90">15 {t('minutes')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-lg">{t('secureAndSafe')}</div>
                <div className="text-sm opacity-90">100%</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-lg">24/7</div>
                <div className="text-sm opacity-90">{t('support247Desc')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gray-900 text-white relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        
        <div className="container relative py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Company Info - Wider */}
            <div className="lg:col-span-2 space-y-6">
              <a href="/" className="flex items-center gap-3 group cursor-pointer">
                <img 
                  src="/brand/fastlygo_icon_only.webp" 
                  alt="FastlyGo" 
                  className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" 
                />
                <span className="text-3xl font-bold">
                  Fast<span className="text-orange-500">ly</span>Go
                </span>
              </a>
              <p className="text-base text-gray-400 leading-relaxed max-w-md">
                {t('heroDescription')}
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 pt-2">
                <SocialLink href="https://instagram.com/fastlygoskopje" label="Instagram">
                  <Instagram className="h-5 w-5" />
                </SocialLink>
                <SocialLink href="https://x.com/fastlygo" label="X (Twitter)">
                  <Twitter className="h-5 w-5" />
                </SocialLink>
                <SocialLink href="https://youtube.com/@fastlygoskopje" label="YouTube">
                  <Youtube className="h-5 w-5" />
                </SocialLink>
                <SocialLink href="https://tiktok.com/@fastlygoskopje" label="TikTok">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </SocialLink>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">
                {t('services')}
              </h3>
              <ul className="space-y-3">
                <FooterLink href="/new-order">
                  <Package className="w-4 h-4 text-orange-500" />
                  {t('placeOrder')}
                </FooterLink>
                <FooterLink href="/services">
                  <Zap className="w-4 h-4 text-orange-500" />
                  {t('services')}
                </FooterLink>
                <FooterLink href="/how-it-works">
                  <Clock className="w-4 h-4 text-orange-500" />
                  {t('howItWorks')}
                </FooterLink>
                <FooterLink href="/about-us">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  {t('aboutUs')}
                </FooterLink>
                <FooterLink href="/api-docs">
                  <Zap className="w-4 h-4 text-purple-500" />
                  API Documentation
                </FooterLink>
              </ul>
            </div>

            {/* Join Us */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">
                {t('about')}
              </h3>
              <ul className="space-y-3">
                <FooterLink href="/courier/register">
                  <Bike className="w-4 h-4 text-green-500" />
                  {t('becomeCourier')}
                </FooterLink>
                <FooterLink href="/business/register">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  {t('businessRegistration')}
                </FooterLink>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">
                {t('contact')}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">Skopje</div>
                    <div className="text-xs text-gray-400">North Macedonia</div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-500" />
                  </div>
                  <a href="tel:+38971246756" className="text-sm text-white hover:text-orange-500 transition-colors font-medium">
                    +389 71 246 756
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <a href="mailto:info@fastlygo.mk" className="text-sm text-white hover:text-orange-500 transition-colors font-medium">
                    info@fastlygo.mk
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                © 2025 FastlyGo. {t('allRightsReserved')}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-orange-500 transition-colors">
                  {t('privacyPolicy')}
                </Link>
                <Link href="/terms" className="hover:text-orange-500 transition-colors">
                  {t('termsOfService')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social Link Component
function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-all duration-300 hover:scale-105"
      aria-label={label}
    >
      {children}
    </a>
  );
}

// Footer Link Component
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        href={href} 
        className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        {children}
        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </Link>
    </li>
  );
}
