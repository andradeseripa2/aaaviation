import React, { useEffect, useRef, useState } from 'react';
import { useBlog } from '../../context/BlogContext';

interface AdBannerProps {
  type: 'header' | 'sidebar' | 'in-content' | 'footer' | 'skyscraper';
  className?: string;
  slotId?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ type, className = '', slotId }) => {
  const { adConfig, currentView } = useBlog();
  const adRef = useRef<HTMLModElement>(null);
  const hasPushedRef = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Policy: Google AdSense strictly forbids ads on login, admin, contact forms, legal terms, or non-editorial screens
  const isNonEditorialView =
    currentView === 'admin' ||
    currentView === 'login' ||
    currentView === 'privacy' ||
    currentView === 'terms' ||
    currentView === 'contact' ||
    currentView === 'profile' ||
    currentView === 'bookmarks';

  const isAdVisible = Boolean(
    !isNonEditorialView &&
    adConfig.enabled &&
    (type === 'header' ? adConfig.showInHeader : true) &&
    (type === 'sidebar' ? adConfig.showInSidebar : true) &&
    (type === 'in-content' ? adConfig.showInContent : true) &&
    (type === 'footer' ? adConfig.showInFooter : true) &&
    (type === 'skyscraper' ? (adConfig.showInSidebar && adConfig.showInSkyscraper !== false) : true)
  );

  const rawPubId = (adConfig.clientSlotId || '').trim();
  const formattedClient = rawPubId
    ? rawPubId.startsWith('ca-pub-')
      ? rawPubId
      : rawPubId.startsWith('pub-')
      ? `ca-${rawPubId}`
      : `ca-pub-${rawPubId.replace(/\D/g, '')}`
    : '';

  const isValidPubId = isAdVisible && formattedClient.length > 10 && formattedClient !== 'ca-pub-XXXXXXXXXXXX';

  // Inject AdSense script dynamically when a valid client ID is provided
  useEffect(() => {
    if (!isValidPubId) return;

    const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formattedClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => setAdError(true);
      document.head.appendChild(script);
    }
  }, [isValidPubId, formattedClient]);

  // Request ad push for this slot safely without duplicate push TagError
  useEffect(() => {
    if (!isValidPubId || !adRef.current || hasPushedRef.current) return;

    const element = adRef.current;
    // Check if element already initialized by Google AdSense
    if (element.getAttribute('data-adsbygoogle-status') || element.innerHTML.trim() !== '') {
      hasPushedRef.current = true;
      return;
    }

    try {
      hasPushedRef.current = true;
      // @ts-expect-error Google AdSense global window queue
      const adsbygoogle = window.adsbygoogle || [];
      // @ts-expect-error Google AdSense global window queue
      window.adsbygoogle = adsbygoogle;
      adsbygoogle.push({});
      setAdLoaded(true);
    } catch {
      // AdSense throws TagError if no pending uninitialized ins elements are found
      // Silently capture this known SPA behavior
      setAdError(true);
    }
  }, [isValidPubId]);

  if (!isAdVisible) return null;

  const adSpecs = {
    header: {
      title: 'Espaço Publicitário • Top Leaderboard',
      dimensions: 'w-full max-w-[728px] min-h-[50px] sm:min-h-[65px]',
      format: 'AdSense Leaderboard',
      adFormat: 'horizontal'
    },
    sidebar: {
      title: 'Espaço Publicitário',
      dimensions: 'w-full max-w-[300px] min-h-[250px]',
      format: 'AdSense Medium Rectangle',
      adFormat: 'rectangle'
    },
    'in-content': {
      title: 'Espaço Publicitário • In-Article',
      dimensions: 'w-full max-w-[728px] min-h-[50px] sm:min-h-[65px]',
      format: 'AdSense In-Article',
      adFormat: 'fluid'
    },
    footer: {
      title: 'Espaço Publicitário • Bottom Banner',
      dimensions: 'w-full max-w-[728px] min-h-[50px] sm:min-h-[65px]',
      format: 'AdSense Large Banner',
      adFormat: 'horizontal'
    },
    skyscraper: {
      title: 'Espaço Publicitário • Skyscraper',
      dimensions: 'w-full max-w-[300px] min-h-[400px]',
      format: 'AdSense Vertical',
      adFormat: 'vertical'
    }
  }[type];

  return (
    <aside
      aria-label="Espaço Publicitário"
      className={`my-3 sm:my-4 flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between w-full px-1.5 mb-1 text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
        <span>PUBLICIDADE</span>
        <span>{adSpecs.format}</span>
      </div>

      <div className={`flex flex-col items-center justify-center rounded-lg overflow-hidden w-full ${adSpecs.dimensions}`}>
        {isValidPubId ? (
          <div className="w-full flex flex-col items-center justify-center text-center">
            {/* Real Google AdSense element */}
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', textAlign: 'center' }}
              data-ad-client={formattedClient}
              data-ad-slot={slotId || '1234567890'}
              data-ad-format={adSpecs.adFormat}
              data-full-width-responsive="true"
            />
            {/* Helper preview when ad is pending approval / unrendered */}
            <div className="py-1.5 px-3 text-center bg-slate-100/90 dark:bg-slate-800/80 rounded-md w-full border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-['Outfit']">
                {adSpecs.title}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                • {formattedClient}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                (aguardando liberação do Google)
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-800/50 rounded-lg border border-slate-200/70 dark:border-slate-800/80 text-center py-2 px-3 w-full h-full">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 font-['Outfit']">
              {adSpecs.title}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
              Slot reservado ({formattedClient || 'ca-pub-XXXXXXXXXXXX'})
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
