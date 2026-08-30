import React, { useEffect, useState } from 'react';
import { TableOfContentItem } from '../../types';
import { ListFilter, ChevronDown, ChevronUp, AlignLeft, Hash } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
}

export const slugifyHeader = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const extractHeadings = (markdown: string): TableOfContentItem[] => {
  const headings: TableOfContentItem[] = [];
  const lines = markdown.split('\n');
  const counts: Record<string, number> = {};

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      const rawText = h2Match[1].replace(/[*_~`]/g, '').trim();
      let id = slugifyHeader(rawText);
      if (counts[id]) {
        counts[id]++;
        id = `${id}-${counts[id]}`;
      } else {
        counts[id] = 1;
      }
      headings.push({ id, text: rawText, level: 2 });
    } else if (h3Match) {
      const rawText = h3Match[1].replace(/[*_~`]/g, '').trim();
      let id = slugifyHeader(rawText);
      if (counts[id]) {
        counts[id]++;
        id = `${id}-${counts[id]}`;
      } else {
        counts[id] = 1;
      }
      headings.push({ id, text: rawText, level: 3 });
    }
  }

  return headings;
};

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<TableOfContentItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entries
        const visibleEntry = entries.find((e) => e.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0.1
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) {
    return null;
  }

  const scrollToHeading = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  return (
    <div className="my-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0B1528] shadow-xs overflow-hidden transition-colors">
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-['Outfit'] text-[#0A192F] dark:text-slate-200">
          <AlignLeft className="w-4 h-4 text-[#1D4ED8] dark:text-blue-400" />
          <span>Sumário do Artigo ({headings.length} tópicos)</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expandir sumário' : 'Recolher sumário'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <nav className="p-4 max-h-[380px] overflow-y-auto space-y-1 text-xs">
          {headings.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToHeading(item.id, e)}
                className={`group flex items-start gap-2 py-1.5 px-2.5 rounded-lg transition-all ${
                  item.level === 3 ? 'ml-3 text-slate-500 dark:text-slate-400' : 'font-medium'
                } ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1D4ED8] dark:text-blue-400 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#0A192F] dark:hover:text-white'
                }`}
              >
                <Hash
                  className={`w-3 h-3 mt-0.5 shrink-0 transition-opacity ${
                    isActive
                      ? 'text-[#1D4ED8] dark:text-blue-400 opacity-100'
                      : 'text-slate-400 opacity-40 group-hover:opacity-100'
                  }`}
                />
                <span className="line-clamp-2 leading-relaxed">{item.text}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
};
