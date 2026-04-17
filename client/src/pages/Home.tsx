import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

// Import only necessary icons to reduce bundle size
import { 
  Package,
  Clock, 
  Shield, 
  Zap, 
  Bike, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  Apple, 
  Smartphone, 
  Star, 
  MapPin, 
  Users, 
  TrendingUp, 
  DollarSign, 
  CalendarClock, 
  ShieldCheck, 
  Headphones, 
  BarChart3, 
  FileText, 
  Boxes, 
  Tag 
} from "lucide-react";
import ScrollToTop from "@/components/ScrollToTop";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { QuickOrderForm } from "@/components/QuickOrderForm";
import { trpc } from "@/lib/trpc";

import { useEffect, useState } from "react";
import { getHomePageSchemas } from "@/lib/structuredData";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";

export default function Home() {
  const { language } = useLanguage();
  const { t } = useTranslation();

   // Fetch home page SEO data from database
  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'home' }, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
  const seoData = useSeoFromDatabase(pageData?.seoMeta);
  // Fetch public statss
  const { data: stats } = trpc.public.stats.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Structured Data for SEO (JSON-LD)
  const structuredData = getHomePageSchemas();


  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20">
      <SEOHead 
        title={isSeoLoading ? "" : (seoData.title || undefined)}
        description={isSeoLoading ? "" : (seoData.description || undefined)}
        keywords={isSeoLoading ? "" : (seoData.keywords || undefined)}
        titleKey="seoTitle"
        descriptionKey="seoDescription"
        keywordsKey="seoKeywords"
        structuredData={structuredData}
      />
      
      <Header />

      <main role="main">

      {/* Hero Section - Modern Dynamic Design */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-amber-300/15 to-orange-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-[1fr_0.8fr] gap-10 lg:gap-14 items-center">
            <div className="space-y-6">
              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-gray-900 tracking-tight">
                  {t('heroTitle')}
                  <span className="block mt-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent animate-gradient">{t('heroSubtitle')}</span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 leading-relaxed max-w-xl font-medium">
                  {t('heroDescription')}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href="/new-order">
                  <Button size="lg" className="btn-primary text-white font-bold px-12 h-14 text-lg shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-[transform,box-shadow] duration-300 rounded-2xl group">
                    <Zap className="mr-2 h-6 w-6 group-hover:rotate-12 transition-transform" />
                    {t('tryNow')}
                  </Button>
                </Link>
                <a href="#download-app">
                  <Button size="lg" variant="outline" className="font-bold px-12 h-14 text-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:scale-105 rounded-2xl transition-[transform,box-shadow] duration-300 group">
                    <Smartphone className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                    {t('downloadAppButton')}
                  </Button>
                </a>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-orange-100 hover:border-orange-300 transition-[transform,border-color] hover:scale-105">
                  <div className="text-3xl font-bold text-orange-600">{stats?.activeCouriers || 50}+</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">{t('activeCouriers')}</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-amber-100 hover:border-amber-300 transition-[transform,border-color] hover:scale-105">
                  <div className="text-3xl font-bold text-amber-600">38+</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">{t('serviceAreas')}</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-green-100 hover:border-green-300 transition-[transform,border-color] hover:scale-105">
                  <div className="text-3xl font-bold text-green-600">15</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">{t('minute')}</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-blue-100 hover:border-blue-300 transition-[transform,border-color] hover:scale-105">
                  <div className="text-3xl font-bold text-blue-600">4.9</div>
                  <div className="text-sm text-gray-600 font-medium mt-1">{t('averageRating')}</div>
                </div>
              </div>
            </div>
            
            {/* Quick Order Form - Compact & Modern */}
            <QuickOrderForm />
          </div>
        </div>
      </section>


      {/* Become a Courier Section - Modern Soft Design */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-100/30" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image Side */}
            <div className="relative order-2 lg:order-1">
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/optimized/courier_modern.webp" 
                    alt="Professional FastlyGo courier"
                    loading="lazy" 
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {/* Floating Stats Cards */}
                <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-orange-100 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">€500+</div>
                      <div className="text-xs text-gray-500">{t('weeklyEarnings')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-orange-100 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">24/7</div>
                      <div className="text-xs text-gray-500">{t('flexibleHours')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 text-sm font-semibold shadow-sm">
                <Bike className="w-4 h-4" />
                {t('becomeCourier')}
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                {t('becomeCourierTitle')}
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('becomeCourierDesc')}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { text: t('earnMoney'), icon: DollarSign, color: 'from-green-400 to-emerald-500' },
                  { text: t('flexibleHours'), icon: CalendarClock, color: 'from-orange-400 to-amber-500' },
                  { text: t('instantPayment'), icon: Zap, color: 'from-yellow-400 to-orange-500' },
                  { text: t('professionalTeam'), icon: Headphones, color: 'from-blue-400 to-indigo-500' },
                ].map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-orange-100/50 shadow-sm hover:shadow-lg transition-[transform,box-shadow] duration-300 hover:-translate-y-1 group">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium leading-tight">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Link href="/courier/register">
                  <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5">
                    {t('courierApplication')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Section - Modern Soft Design */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Soft decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30" />
        <div className="absolute top-10 right-20 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content Side */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 text-sm font-semibold shadow-sm">
                <Building2 className="w-4 h-4" />
                {t('becomeBusinessTitle')}
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
                {t('becomeBusinessTitle')}
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('becomeBusinessDesc')}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { text: t('easyBalance'), icon: BarChart3, color: 'from-purple-400 to-violet-500' },
                  { text: t('detailedReporting'), icon: FileText, color: 'from-cyan-400 to-blue-500' },
                  { text: t('multipleOrders'), icon: Boxes, color: 'from-orange-400 to-red-500' },
                  { text: t('affordablePrices'), icon: Tag, color: 'from-green-400 to-teal-500' },
                ].map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-blue-100/50 shadow-sm hover:shadow-lg transition-[transform,box-shadow] duration-300 hover:-translate-y-1 group">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium leading-tight">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Link href="/business/register">
                  <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5">
                    {t('businessRegistration')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image Side */}
            <div className="relative">
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/optimized/business_modern.webp" 
                    alt="Business owner using FastlyGo delivery service"
                    loading="lazy" 
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {/* Floating Stats Cards */}
                <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-blue-100 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">100+</div>
                      <div className="text-xs text-gray-500">{t('partnerBusinesses')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-orange-100 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">15K+</div>
                      <div className="text-xs text-gray-500">{t('deliveries')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-orange-50/50 to-amber-50/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        
        <div className="container relative">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium">
              <Star className="w-4 h-4 fill-orange-500" />
              {t('realStories')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
              {t('customerTestimonials')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('customerTestimonialsDesc')}
            </p>
          </div>

          {/* Infinite Scroll Carousel */}
          <div className="relative">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background: 'linear-gradient(to right, rgb(255,247,237) 0%, transparent 100%)'}} />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{background: 'linear-gradient(to left, rgb(255,247,237) 0%, transparent 100%)'}} />

            <div className="overflow-hidden">
              <div className="flex gap-6 testimonials-track hover:pause-animation">
                {[
                  { name: t('testimonial1Name'), role: t('testimonial1Role'), text: t('testimonial1Text'), img: '/images/optimized/testimonial_1.webp', rating: 5 },
                  { name: t('testimonial2Name'), role: t('testimonial2Role'), text: t('testimonial2Text'), img: '/images/optimized/testimonial_2.webp', rating: 5 },
                  { name: t('testimonial3Name'), role: t('testimonial3Role'), text: t('testimonial3Text'), img: '/images/optimized/testimonial_3.webp', rating: 5 },
                  { name: t('testimonial4Name'), role: t('testimonial4Role'), text: t('testimonial4Text'), img: '/images/optimized/testimonial_1.webp', rating: 5 },
                  { name: t('testimonial5Name'), role: t('testimonial5Role'), text: t('testimonial5Text'), img: '/images/optimized/testimonial_2.webp', rating: 5 },
                  { name: t('testimonial6Name'), role: t('testimonial6Role'), text: t('testimonial6Text'), img: '/images/optimized/testimonial_3.webp', rating: 5 },
                  { name: t('testimonial1Name'), role: t('testimonial1Role'), text: t('testimonial1Text'), img: '/images/optimized/testimonial_1.webp', rating: 5 },
                  { name: t('testimonial2Name'), role: t('testimonial2Role'), text: t('testimonial2Text'), img: '/images/optimized/testimonial_2.webp', rating: 5 },
                  { name: t('testimonial3Name'), role: t('testimonial3Role'), text: t('testimonial3Text'), img: '/images/optimized/testimonial_3.webp', rating: 5 },
                  { name: t('testimonial4Name'), role: t('testimonial4Role'), text: t('testimonial4Text'), img: '/images/optimized/testimonial_1.webp', rating: 5 },
                  { name: t('testimonial5Name'), role: t('testimonial5Role'), text: t('testimonial5Text'), img: '/images/optimized/testimonial_2.webp', rating: 5 },
                  { name: t('testimonial6Name'), role: t('testimonial6Role'), text: t('testimonial6Text'), img: '/images/optimized/testimonial_3.webp', rating: 5 },
                ].map((testimonial, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[340px] bg-white rounded-3xl p-7 border border-orange-100 hover:border-orange-200 transition-[transform,border-color,box-shadow] duration-500 group"
                    style={{ boxShadow: '0 2px 20px rgba(255,107,53,0.07), 0 1px 4px rgba(0,0,0,0.04)' }}
                  >
                    {/* Stars + quote icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <svg className="w-8 h-8 text-orange-100" fill="currentColor" viewBox="0 0 32 32">
                        <path d="M10 8C6.686 8 4 10.686 4 14v10h10V14H7c0-1.654 1.346-3 3-3V8zm14 0c-3.314 0-6 2.686-6 6v10h10V14h-7c0-1.654 1.346-3 3-3V8z"/>
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[72px]">
                      {testimonial.text}
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.img}
                        alt={testimonial.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-100 group-hover:ring-orange-300 transition-[box-shadow]"
                        loading="lazy"
                      />
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{testimonial.name}</div>
                        <div className="text-xs text-orange-500 font-medium">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes testimonials-scroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(calc(-346px * 6)); }
            }
            .testimonials-track {
              animation: testimonials-scroll 40s linear infinite;
              will-change: transform;
            }
            .pause-animation:hover {
              animation-play-state: paused;
            }
          `}</style>
        </div>
      </section>

      {/* Download App Section - Soft Pastel Design */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        {/* Soft Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-orange-100/40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 lg:order-1 order-2">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/50 text-orange-600 text-sm font-medium shadow-sm">
                <Smartphone className="w-4 h-4" />
                <span>Mobile App</span>
              </div>
              
              {/* Title */}
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 leading-tight">
                {t('downloadApp')}
              </h2>
              
              {/* Description */}
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('downloadAppDesc')}
              </p>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                {[
                  t('instantNotification'),
                  t('liveCourierTracking'),
                  t('easyPayment'),
                  t('specialCampaigns'),
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <a 
                  href="https://fastlygo.mk" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl transition-[transform,box-shadow] shadow-lg hover:shadow-xl hover:scale-105 duration-300"
                >
                  <Apple className="h-7 w-7" />
                  <div className="text-left">
                    <div className="text-sm font-bold">{t('downloadOnAppStore')}</div>
                  </div>
                </a>

                <a 
                  href="https://fastlygo.mk" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl transition-[transform,box-shadow] shadow-lg hover:shadow-xl hover:scale-105 duration-300"
                >
                  <Smartphone className="h-7 w-7" />
                  <div className="text-left">
                    <div className="text-sm font-bold">{t('getItOnGooglePlay')}</div>
                  </div>
                </a>
              </div>
            </div>

            {/* App Mockup Image */}
            <div className="relative flex justify-center items-center lg:order-2 order-1">
              <div className="relative w-full max-w-lg">
                {/* Soft Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-300/20 via-amber-300/20 to-orange-200/20 rounded-3xl blur-3xl scale-110" />
                
                {/* Main Image */}
                <img 
                  src="/mobile-app-hero.webp" 
                  alt="FastlyGo mobile app - delivery tracking and order management" 
                  className="relative w-full h-auto drop-shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container relative text-center space-y-5">
          <h2 className="text-3xl lg:text-4xl font-bold">{t('orderNow')}</h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            {t('orderNowDesc')}
          </p>
          <Link href="/new-order">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 h-12 text-base shadow-xl hover:shadow-2xl transition-[transform,box-shadow] rounded-xl">
              <Package className="mr-2 h-5 w-5" />
              {t('callCourierNow')}
            </Button>
          </Link>
        </div>
      </section>

      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
