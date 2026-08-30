import React, { useRef, useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Radio, Flame, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface TickerItem {
  id: string;
  type: 'custom' | 'post';
  badge: string;
  title: string;
  isPopular?: boolean;
  link?: string;
  slug?: string;
}

export const BreakingNewsTicker: React.FC = () => {
  const { posts, navigate, getCategoryName, radarConfig } = useBlog();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Keep refs in sync for the animation loop
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const isEnabled = radarConfig ? radarConfig.enabled !== false : true;

  const publishedPosts = posts.filter(p => p.published);
  const tickerItems: TickerItem[] = [];

  if (isEnabled) {
    // 1. Add Custom Admin Messages if configured (supports multiple messages)
    if (radarConfig?.messages && Array.isArray(radarConfig.messages) && radarConfig.messages.length > 0) {
      radarConfig.messages.forEach(msgItem => {
        if (msgItem.active !== false && msgItem.message && msgItem.message.trim().length > 0) {
          tickerItems.push({
            id: msgItem.id || `radar-custom-${Math.random()}`,
            type: 'custom',
            badge: msgItem.badge?.trim() || 'COMUNICADO',
            title: msgItem.message.trim(),
            link: msgItem.link?.trim()
          });
        }
      });
    } else if (radarConfig?.customMessage && radarConfig.customMessage.trim().length > 0) {
      // Fallback for single legacy message
      tickerItems.push({
        id: 'radar-custom-msg',
        type: 'custom',
        badge: radarConfig.customBadgeText?.trim() || 'COMUNICADO',
        title: radarConfig.customMessage.trim(),
        link: radarConfig.customLink?.trim()
      });
    }

    // 2. Add Latest Posts if enabled (default true)
    if (radarConfig?.showLatestPosts !== false && publishedPosts.length > 0) {
      publishedPosts.slice(0, 8).forEach(post => {
        tickerItems.push({
          id: post.id,
          type: 'post',
          badge: getCategoryName(post.category),
          title: post.title,
          slug: post.slug,
          isPopular: !!(post.viewsCount && post.viewsCount > 80)
        });
      });
    }
  }

  // Duplicate items 4 times to ensure seamless infinite looping on all screen sizes
  const duplicatedItems = tickerItems.length > 0 ? [
    ...tickerItems,
    ...tickerItems,
    ...tickerItems,
    ...tickerItems
  ] : [];

  // Continuous, high-precision ticker loop with requestAnimationFrame
  useEffect(() => {
    if (!isEnabled || tickerItems.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Only advance position when NOT hovered and NOT actively dragged
      if (!isHoveredRef.current && !isDraggingRef.current && container) {
        // Move approx 38-42 pixels per second smoothly
        const pixelsToMove = (40 * Math.min(delta, 100)) / 1000;
        container.scrollLeft += pixelsToMove;

        // When reaching the middle duplicated block, seamlessly wrap back
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0 && container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isEnabled, tickerItems.length]);

  // Check if radar is disabled globally or has no items
  if (!isEnabled || tickerItems.length === 0) {
    return null;
  }

  // Mouse wheel horizontal scroll handler (pauses naturally because hovered, and shifts scrollLeft)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    scrollContainerRef.current.scrollLeft += delta * 1.2;

    const halfWidth = scrollContainerRef.current.scrollWidth / 2;
    if (halfWidth > 0) {
      if (scrollContainerRef.current.scrollLeft >= halfWidth) {
        scrollContainerRef.current.scrollLeft -= halfWidth;
      } else if (scrollContainerRef.current.scrollLeft < 0) {
        scrollContainerRef.current.scrollLeft += halfWidth;
      }
    }
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    let newPos = scrollLeftState - walk;

    const halfWidth = scrollContainerRef.current.scrollWidth / 2;
    if (halfWidth > 0) {
      if (newPos >= halfWidth) newPos -= halfWidth;
      else if (newPos < 0) newPos += halfWidth;
    }
    scrollContainerRef.current.scrollLeft = newPos;
  };

  const handleScrollStep = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleItemClick = (item: TickerItem) => {
    if (isDragging) return;
    if (item.type === 'custom') {
      if (item.link) {
        if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
          window.open(item.link, '_blank', 'noopener,noreferrer');
        } else if (item.link.startsWith('/post/') || item.link.startsWith('post/')) {
          const slug = item.link.replace(/^\/?post\//, '');
          navigate('post', { postSlug: slug });
        } else {
          navigate(item.link as any);
        }
      }
    } else if (item.slug) {
      navigate('post', { postSlug: item.slug });
    }
  };

  return (
    <div
      className="bg-[#0A192F] dark:bg-[#07122A] text-white border-y border-slate-800/90 shadow-sm relative overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center h-10">
        {/* Fixed Left Badge: RADAR */}
        <div className="relative z-20 flex items-center gap-2 pr-3 sm:pr-4 bg-[#0A192F] dark:bg-[#07122A] shrink-0 border-r border-slate-800/80">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-400 uppercase tracking-wider text-[11px] sm:text-xs">
            <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">RADAR</span>
          </span>
        </div>

        {/* Left scroll chevron on hover */}
        {isHovered && (
          <button
            type="button"
            onClick={() => handleScrollStep('left')}
            className="z-30 p-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-all cursor-pointer ml-1 shadow-md"
            title="Rolar para a esquerda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="relative flex-1 overflow-x-auto no-scrollbar h-full flex items-center cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Left subtle fade */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0A192F] dark:from-[#07122A] to-transparent z-10 pointer-events-none" />

          {/* Continuous Item Track */}
          <div className="flex items-center gap-6 sm:gap-8 py-1 whitespace-nowrap">
            {duplicatedItems.map((item, idx) => {
              const isCustom = item.type === 'custom';

              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="inline-flex items-center gap-2 sm:gap-2.5 text-xs text-slate-200 hover:text-amber-300 transition-colors shrink-0 group focus:outline-none cursor-pointer"
                  title={item.title}
                >
                  {isCustom ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 group-hover:bg-amber-500/30 transition-colors shadow-xs animate-pulse">
                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{item.badge.toUpperCase()}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/50 group-hover:border-amber-500/50 group-hover:text-amber-300 transition-colors">
                      {item.badge.toUpperCase()}
                    </span>
                  )}

                  <span
                    className={`font-['Outfit'] tracking-wide whitespace-nowrap transition-colors ${
                      isCustom
                        ? 'font-bold text-amber-200 group-hover:text-white text-[12px] sm:text-[13px]'
                        : 'font-medium text-[12px] sm:text-[13px] text-slate-100 group-hover:text-amber-300'
                    }`}
                  >
                    {item.title}
                  </span>

                  {isCustom && item.link && (
                    <ExternalLink className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 shrink-0" />
                  )}

                  {!isCustom && item.isPopular && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-orange-400 font-mono font-medium">
                      <Flame className="w-3 h-3 shrink-0 fill-orange-400/20" />
                      Popular
                    </span>
                  )}

                  <span className="text-amber-500/60 font-bold mx-2 select-none">•</span>
                </button>
              );
            })}
          </div>

          {/* Right subtle fade */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A192F] dark:from-[#07122A] to-transparent z-10 pointer-events-none" />
        </div>

        {/* Right scroll chevron on hover */}
        {isHovered && (
          <button
            type="button"
            onClick={() => handleScrollStep('right')}
            className="z-30 p-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md transition-all cursor-pointer mr-1 shadow-md"
            title="Rolar para a direita"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Hint / Status (Desktop Only) */}
        <div className="hidden lg:flex items-center pl-3 shrink-0 text-[10px] font-mono text-slate-400 bg-[#0A192F] dark:bg-[#07122A] border-l border-slate-800/80 z-20">
          <span className="text-slate-400">
            {isHovered ? '🖱️ Use o scroll do mouse ou arraste' : 'Passe o mouse para pausar'}
          </span>
        </div>
      </div>
    </div>
  );
};
