import React, { useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BlogProvider, useBlog } from './context/BlogContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ScrollToTop } from './components/common/ScrollToTop';
import { HeroFeatured } from './components/home/HeroFeatured';
import { LatestAnalysis } from './components/home/LatestAnalysis';
import { StudyAreas } from './components/home/StudyAreas';
import { NewsletterSection } from './components/home/NewsletterSection';
import { BrandBanner } from './components/common/BrandBanner';
import { AdBanner } from './components/common/AdBanner';
import { BreakingNewsTicker } from './components/home/BreakingNewsTicker';
import { CommunityHangarCta } from './components/home/CommunityHangarCta';
import { AuthorAuthorityCard } from './components/home/AuthorAuthorityCard';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { Plane, ArrowLeft, Loader2 } from 'lucide-react';

// Lazy-loaded routes for ultra-fast initial page load and minimum main-thread work
const BlogIndex = lazy(() => import('./components/blog/BlogIndex').then(m => ({ default: m.BlogIndex })));
const BookmarksView = lazy(() => import('./components/blog/BookmarksView').then(m => ({ default: m.BookmarksView })));
const CategoryView = lazy(() => import('./components/category/CategoryView').then(m => ({ default: m.CategoryView })));
const PostDetail = lazy(() => import('./components/post/PostDetail').then(m => ({ default: m.PostDetail })));
const AboutAuthor = lazy(() => import('./components/about/AboutAuthor').then(m => ({ default: m.AboutAuthor })));
const ContactPage = lazy(() => import('./components/contact/ContactPage').then(m => ({ default: m.ContactPage })));
const AuthPage = lazy(() => import('./components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const ProfilePage = lazy(() => import('./components/auth/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PrivacyPolicyPage = lazy(() => import('./components/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import('./components/legal/TermsOfUsePage').then(m => ({ default: m.TermsOfUsePage })));

const ViewLoadingFallback: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-in fade-in duration-300">
    <div className="inline-flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-[#1D4ED8] dark:text-blue-400 mb-4">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 font-['Outfit']">
      Carregando conteúdo aeronáutico...
    </p>
  </div>
);

const MainContent: React.FC = () => {
  const { currentView, selectedPostSlug, selectedCategorySlug, posts, isLoadingPosts, navigate } = useBlog();

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedPostSlug, selectedCategorySlug]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="animate-in fade-in duration-300">
            {/* Prominent Centered Brand Masthead (Alexandre Andrade Aviation) */}
            <BrandBanner />

            {/* Breaking Technical Radar Ticker */}
            <BreakingNewsTicker />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
              {/* Top AdSense Leaderboard Slot */}
              <AdBanner type="header" />

              {/* Hero Featured Article (matches Image 6) */}
              <HeroFeatured />

              {/* Community Hangar CTA & Badges Incentive */}
              <CommunityHangarCta />

              {/* Latest Analysis Section with Category Tabs & Trending Sidebar */}
              <LatestAnalysis />

              {/* Study Areas / 4 Pilares (matches Image 6) */}
              <StudyAreas />

              {/* Author Quick Authority Card */}
              <AuthorAuthorityCard />

              {/* In-content Responsive Ad Banner */}
              <AdBanner type="in-content" />

              {/* Newsletter Briefing Semanal */}
              <div className="mt-8">
                <NewsletterSection variant="banner" />
              </div>
            </div>
          </div>
        );

      case 'blog':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <BlogIndex />
          </Suspense>
        );

      case 'bookmarks':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <BookmarksView />
          </Suspense>
        );

      case 'category':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <CategoryView categorySlug={selectedCategorySlug || undefined} />
          </Suspense>
        );

      case 'post': {
        const post = posts.find(p => p.slug === selectedPostSlug) || posts.find(p => p.id === selectedPostSlug);
        
        if (!post) {
          if (isLoadingPosts) {
            return (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="h-10 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="w-full h-72 sm:h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                </div>
              </div>
            );
          }

          if (posts.length > 0) {
            // Post not found with that specific slug, but other posts exist
            return (
              <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0047AB] dark:text-blue-400 mx-auto flex items-center justify-center mb-5 shadow-inner">
                  <Plane className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white mb-2">
                  Artigo não encontrado
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  O artigo solicitado pode ter sido renomeado ou o endereço acessado contém alguma inconsistência.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('home')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0047AB] hover:bg-[#003B8E] text-white text-sm font-semibold shadow-md transition-all cursor-pointer font-['Outfit']"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Início</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('blog')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer font-['Outfit']"
                  >
                    <span>Ver Todas as Matérias</span>
                  </button>
                </div>
              </div>
            );
          }

          return null;
        }

        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <PostDetail post={post} />
          </Suspense>
        );
      }

      case 'about':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <AboutAuthor />
          </Suspense>
        );

      case 'contact':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <ContactPage />
          </Suspense>
        );

      case 'login':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <AuthPage />
          </Suspense>
        );

      case 'profile':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <ProfilePage />
          </Suspense>
        );

      case 'admin':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        );

      case 'privacy':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <PrivacyPolicyPage />
          </Suspense>
        );

      case 'terms':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <TermsOfUsePage />
          </Suspense>
        );

      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <HeroFeatured />
            <LatestAnalysis />
            <StudyAreas />
          </div>
        );
    }
  };

  const isEditorialContentPage =
    currentView === 'home' ||
    currentView === 'blog' ||
    currentView === 'category' ||
    currentView === 'post' ||
    currentView === 'bookmarks';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#070F1E] text-[#0A192F] dark:text-slate-100 font-sans antialiased selection:bg-[#1D4ED8] selection:text-white transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full">{renderView()}</main>
      
      {/* Global AdSense Footer Banner - Displayed strictly on content-rich editorial views to respect AdSense Publisher Policies */}
      {isEditorialContentPage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-4">
          <AdBanner type="footer" className="my-0" />
        </div>
      )}

      <Footer />
      <ScrollToTop />
      <CookieConsentBanner />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BlogProvider>
          <MainContent />
        </BlogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
