import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Tag, Search, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

interface CategoryData {
  id: number;
  slug: string;
  icon: string;
  shortName: any; // JSON object: {en, mk, sq, tr}
  seoMeta: any; // JSON object
  active: boolean;
  displayOrder: number;
}

export default function Categories() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories from database
  const { data: categories, isLoading, error } = trpc.categories.list.useQuery();

  // Get localized category short name
  const getCategoryName = (category: CategoryData) => {
    const names = category.shortName;
    if (!names) return category.slug;
    return names[language] || names.en || category.slug;
  };

  // Get localized category subtitle from seoMeta
  const getCategorySubtitle = (category: CategoryData) => {
    const meta = category.seoMeta;
    if (!meta) return '';
    const localMeta = meta[language] || meta.en || {};
    return localMeta.subtitle || localMeta.description || '';
  };

  // Filter categories based on search query
  const filteredCategories = (categories || []).filter((category: CategoryData) => {
    const categoryName = getCategoryName(category).toLowerCase();
    return categoryName.includes(searchQuery.toLowerCase());
  });

  // Sort categories by displayOrder
  const sortedCategories = [...filteredCategories].sort((a: CategoryData, b: CategoryData) =>
    a.displayOrder - b.displayOrder
  );

  // Page SEO from pages table
  const { data: pageData } = trpc.pages.getBySlug.useQuery({ slug: 'categories' }, { retry: false });
  const pageSeoMeta = pageData?.seoMeta ? (typeof pageData.seoMeta === 'string' ? JSON.parse(pageData.seoMeta) : pageData.seoMeta) : null;
  const pageSeo = pageSeoMeta?.[language] || pageSeoMeta?.en || {};

  return (
    <>
      <SEOHead
        title={pageSeo.title || 'Delivery Categories | FastlyGo'}
        description={pageSeo.description || 'Browse all delivery categories. Food delivery, groceries, pharmacy, flowers, and more. Fast delivery in Skopje, Macedonia.'}
        keywords={pageSeo.keywords || 'delivery categories, food delivery, grocery delivery, pharmacy delivery'}
      />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Tag className="w-4 h-4" />
                Delivery Categories
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                What We Deliver
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From food to flowers, groceries to pharmacy. Fast and reliable delivery for everything you need.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none text-lg"
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg">Failed to load categories. Please try again later.</p>
              </div>
            )}

            {/* Categories Grid */}
            {!isLoading && !error && (
              <div className="max-w-7xl mx-auto">
                {sortedCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No categories found matching your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedCategories.map((category: CategoryData) => {
                      const categoryName = getCategoryName(category);
                      const categorySubtitle = getCategorySubtitle(category);
                      
                      return (
                        <Link key={category.id} href={`/categories/${category.slug}`}>
                          <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-orange-200 cursor-pointer">
                            {/* Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative p-6">
                              {/* Status Badge */}
                              <div className="flex items-center justify-between mb-4">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                                  category.active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {category.active ? (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4" />
                                      Coming Soon
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Category Icon */}
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                {category.icon ? (
                                  <span className="text-2xl">{category.icon}</span>
                                ) : (
                                  <Tag className="w-7 h-7 text-white" />
                                )}
                              </div>

                              {/* Category Name */}
                              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                {categoryName}
                              </h3>

                              {/* Category Subtitle */}
                              {categorySubtitle && (
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {categorySubtitle}
                                </p>
                              )}

                              {/* Arrow Icon */}
                              <div className="mt-4 flex items-center text-orange-500 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
                                View Details →
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
