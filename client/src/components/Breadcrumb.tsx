import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigasyon bileşeni
 * SEO ve kullanıcı deneyimi için breadcrumb trail gösterir
 * 
 * Kullanım:
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Categories', href: '/categories' },
 *   { label: 'Food Delivery' }
 * ]} />
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`py-3 px-4 md:px-6 bg-white/50 backdrop-blur-sm border-b border-orange-100/50 ${className}`}
    >
      <div className="container">
        <ol className="flex items-center gap-1 md:gap-2 flex-wrap">
          {/* Home link */}
          <li>
            <Link href="/">
              <a className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </a>
            </Link>
          </li>

          {/* Breadcrumb items */}
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1 md:gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {item.href ? (
                <Link href={item.href}>
                  <a className="text-sm text-gray-600 hover:text-orange-600 transition-colors truncate">
                    {item.label}
                  </a>
                </Link>
              ) : (
                <span className="text-sm text-gray-900 font-medium truncate">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Schema.org JSON-LD for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: typeof window !== 'undefined' ? window.location.origin : 'https://fastlygo.mk'
            },
            ...items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 2,
              name: item.label,
              item: item.href ? `${typeof window !== 'undefined' ? window.location.origin : 'https://fastlygo.mk'}${item.href}` : undefined
            }))
          ].filter(item => item.item)
        })}
      </script>
    </nav>
  );
}
