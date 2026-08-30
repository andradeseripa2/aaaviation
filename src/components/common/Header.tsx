import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  User as UserIcon,
  Shield,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Bookmark,
  Bell,
  Award,
  Sparkles,
  Download,
  Info
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentView,
    selectedCategorySlug,
    navigate,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    bookmarks,
    unreadNotificationsCount
  } = useBlog();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        userDropdownOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !mobileMenuToggleRef.current?.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };

    if (userDropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen, mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('blog', { search: searchQuery.trim() });
    }
  };

  const navLinks = [
    { name: 'Home', view: 'home' as const },
    { name: 'Sobre', view: 'about' as const },
    { name: 'Blog', view: 'blog' as const },
    {
      name: 'Manutenção',
      view: 'category' as const,
      categorySlug: 'manutencao' as const
    },
    {
      name: 'Safety',
      view: 'category' as const,
      categorySlug: 'safety' as const
    },
    { name: 'Contato', view: 'contact' as const }
  ];

  const isLinkActive = (item: (typeof navLinks)[0]) => {
    if (item.view === 'category') {
      return currentView === 'category' && selectedCategorySlug === item.categorySlug;
    }
    return currentView === item.view;
  };

  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#070F1E]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 text-left focus:outline-hidden group shrink-0 cursor-pointer"
            aria-label="Alexandre Andrade Aviation - Início"
          >
            <Logo variant="header" size="sm" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => {
              const active = isLinkActive(link);
              return (
                <button
                  key={link.name}
                  onClick={(e) => {
                    if (link.view === 'home') {
                      handleGoHome(e);
                    } else if (link.categorySlug) {
                      navigate('category', { categorySlug: link.categorySlug });
                    } else {
                      navigate(link.view);
                    }
                  }}
                  className={`relative py-2 text-sm font-semibold transition-colors duration-200 font-['Outfit'] ${
                    active
                      ? 'text-[#0E2954] dark:text-blue-400 font-bold'
                      : 'text-[#475569] dark:text-slate-300 hover:text-[#0E2954] dark:hover:text-white'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0E2954] dark:bg-blue-400 rounded-full transition-all" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 lg:gap-4">
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#94A3B8] dark:text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-32 lg:w-40 pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]/20 dark:focus:ring-blue-500/20 focus:border-[#0E2954] dark:focus:border-blue-400 transition-all"
                />
              </div>
            </form>

            {/* Bookmarks Link */}
            <button
              type="button"
              onClick={() => navigate('bookmarks')}
              className={`relative p-2 rounded-full border transition-colors ${
                currentView === 'bookmarks'
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-[#1D4ED8] dark:text-blue-400'
                  : 'border-[#E2E8F0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Artigos Salvos / Favoritos"
              aria-label="Ver artigos favoritos"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1D4ED8] dark:bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center font-mono">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[#E2E8F0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Noturno'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 scale-100" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 transition-transform rotate-0 scale-100" />
              )}
            </button>

            {/* Newsletter CTA */}
            <button
              onClick={() => {
                const el = document.getElementById('newsletter-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('home');
                  setTimeout(() => {
                    document.getElementById('newsletter-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 rounded-lg tracking-wider transition-colors shadow-xs uppercase font-['Outfit']"
            >
              Newsletter
            </button>

            {/* Notifications Bell for Logged-in User */}
            {user && (
              <button
                type="button"
                onClick={() => navigate('profile')}
                className="relative p-2 rounded-full border border-[#E2E8F0] dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Ver Notificações & Badges"
                aria-label="Notificações e Badges"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center font-mono animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Profile Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 transition-colors cursor-pointer"
                  aria-expanded={userDropdownOpen}
                  aria-label="Abrir menu de perfil do usuário"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#CBD5E1] dark:border-slate-700"
                    onError={e => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        user.name
                      )}`;
                    }}
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 mr-1" />
                </button>

                {/* Dropdown Backdrop to capture outside clicks everywhere */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setUserDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0B1528] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-[#F1F5F9] dark:border-slate-800">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">{user.email}</p>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                            <Shield className="w-3 h-3" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                            <UserIcon className="w-3 h-3" /> Leitor Comum
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('profile');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[#64748B]" />
                        <span>Meu Perfil & Comentários</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('bookmarks');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <span>Artigos Salvos ({bookmarks.length})</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            navigate('admin');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#0E2954] dark:text-blue-400 hover:bg-[#EFF6FF] dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
                          <span>Painel Administrativo</span>
                        </button>
                      )}

                      <div className="border-t border-[#F1F5F9] dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Benefits hint tooltip on hover */}
                <div className="relative group hidden xl:flex items-center">
                  <div className="flex items-center gap-1 text-[11px] text-[#64748B] dark:text-slate-400 font-medium px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 cursor-help">
                    <Sparkles className="w-3 h-3 text-[#1D4ED8] dark:text-blue-400" />
                    <span>Conta 100% Grátis</span>
                  </div>
                  {/* Tooltip Hover Bubble */}
                  <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-white dark:bg-[#0B1528] rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50">
                    <p className="text-xs font-bold text-[#0A192F] dark:text-white font-['Outfit'] mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                      Vantagens do Cadastro:
                    </p>
                    <ul className="space-y-1 text-[11px] text-[#475569] dark:text-slate-300">
                      <li>• Download de Artigos em PDF Executivo</li>
                      <li>• Comentários & Respostas com IA</li>
                      <li>• Favoritos salvos na nuvem</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => navigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0E2954] dark:text-blue-300 border border-[#CBD5E1] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 font-['Outfit'] cursor-pointer"
                  title="Acessar sua conta"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
                  Entrar
                </button>

                <button
                  onClick={() => navigate('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 rounded-lg transition-all flex items-center gap-1.5 font-['Outfit'] shadow-2xs cursor-pointer"
                  title="Criar conta 100% gratuita para baixar PDFs e comentar"
                >
                  <span>Cadastre-se</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions: Theme + Search + Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#0E2954] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#0E2954] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Buscar no portal"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              ref={mobileMenuToggleRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(prev => !prev);
              }}
              className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#0E2954] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="pb-3 lg:hidden animate-in fade-in slide-in-from-top-1">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos sobre manutenção, safety..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white placeholder-slate-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
            </form>
          </div>
        )}

        {/* Mobile Backdrop and Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-16 sm:top-20 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(false);
              }}
              aria-hidden="true"
            />

            {/* Mobile Dropdown Menu Container with scrolling */}
            <div
              ref={mobileMenuRef}
              className="relative z-50 lg:hidden border-t border-[#E2E8F0] dark:border-slate-800 py-3 pb-8 px-1 space-y-2 bg-white dark:bg-[#070F1E] shadow-2xl rounded-b-2xl max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain animate-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {navLinks.map(link => (
                <button
                  key={link.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (link.view === 'home') {
                      handleGoHome(e);
                    } else if (link.categorySlug) {
                      setMobileMenuOpen(false);
                      navigate('category', { categorySlug: link.categorySlug });
                    } else {
                      setMobileMenuOpen(false);
                      navigate(link.view);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors font-['Outfit'] cursor-pointer flex items-center justify-between ${
                    isLinkActive(link)
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 font-bold'
                      : 'text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>{link.name}</span>
                  {isLinkActive(link) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] dark:bg-blue-400" />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                  navigate('bookmarks');
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/70 flex items-center justify-between font-['Outfit'] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>Artigos Salvos</span>
                </span>
                {bookmarks.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#1D4ED8] text-white rounded-full">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              <div className="pt-3 border-t border-[#F1F5F9] dark:border-slate-800 space-y-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1] dark:border-slate-700 shrink-0"
                        onError={e => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            user.name
                          )}`;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">{user.title || user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                        navigate('profile');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#64748B]" /> Meu Perfil & Comentários
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(false);
                          navigate('admin');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#1D4ED8] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" /> Painel Administrativo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Sair da Conta
                    </button>
                  </>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A192F] dark:text-white font-['Outfit']">
                        <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-blue-400" />
                        <span>Sua Conta Gratuita</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        100% Grátis
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight">
                      Baixe artigos em PDF executivo, participe dos debates com IA e salve seus artigos.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(false);
                          navigate('login');
                        }}
                        className="w-full py-2 text-center text-xs font-bold text-[#0E2954] dark:text-blue-300 bg-white dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded-xl transition-colors cursor-pointer font-['Outfit'] shadow-2xs"
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(false);
                          navigate('login');
                        }}
                        className="w-full py-2 text-center text-xs font-bold text-white bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] rounded-xl transition-colors cursor-pointer font-['Outfit'] shadow-xs"
                      >
                        Cadastre-se
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
