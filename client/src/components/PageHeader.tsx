import { Zap } from "lucide-react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ badge, title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <div className={`bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 py-12 md:py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">{badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-in fade-in slide-in-from-top-6 duration-700">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-8 duration-900">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
