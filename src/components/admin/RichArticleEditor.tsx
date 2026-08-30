import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MarkdownContent } from '../common/MarkdownContent';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Palette,
  Eye,
  Edit3,
  Columns,
  Upload,
  X,
  Check,
  Maximize2,
  Minimize2,
  Copy,
  Clock,
  Plane,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wand2
} from 'lucide-react';
import {
  uploadImageMedia,
  AVIATION_PRESET_IMAGES,
  resolveImageUrl,
  sanitizeMarkdownImages,
  AviationImagePreset
} from '../../services/mediaService';

interface RichArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  minHeight?: string;
}

interface ExtractedImage {
  fullMatch: string;
  alt: string;
  url: string;
  index: number;
}

export const RichArticleEditor: React.FC<RichArticleEditorProps> = ({
  content,
  onChange,
  minHeight = '380px'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedCursorPos = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('editor');
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Image Modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imgSourceType, setImgSourceType] = useState<'upload' | 'preset' | 'url'>('upload');
  const [imgUrl, setImgUrl] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isImgUploading, setIsImgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Article Media Tray state
  const [showMediaTray, setShowMediaTray] = useState(true);

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [copiedMd, setCopiedMd] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Auto-sanitize if content contains giant base64 data URIs
  useEffect(() => {
    if (content && content.includes('data:image/')) {
      const { sanitized, cleanedCount } = sanitizeMarkdownImages(content);
      if (cleanedCount > 0 && sanitized !== content) {
        onChange(sanitized);
        setPasteFeedback(`✨ Otimizamos ${cleanedCount} imagem(ns): o código base64 foi substituído por links limpos e renderizáveis.`);
        setTimeout(() => setPasteFeedback(null), 4500);
      }
    }
  }, [content]);

  // Save cursor position whenever textarea is focused/clicked
  const captureCursorPos = () => {
    if (textareaRef.current) {
      savedCursorPos.current = textareaRef.current.selectionStart;
    }
  };

  const handleOpenImageModal = () => {
    captureCursorPos();
    setShowImageModal(true);
  };

  // Extract all images present in the article markdown
  const articleImages = useMemo<ExtractedImage[]>(() => {
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    const images: ExtractedImage[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(content)) !== null) {
      images.push({
        fullMatch: match[0],
        alt: match[1] || `Figura ${idx + 1}`,
        url: match[2] || '',
        index: idx
      });
      idx++;
    }
    return images;
  }, [content]);

  // Statistics calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  // Helper to wrap or insert text formatting
  const insertFormatting = (before: string, after: string = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    let start = savedCursorPos.current ?? content.length;
    let end = start;

    if (textarea && document.activeElement === textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    }

    const hasSelection = start !== end;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const replacement = `${before}${selectedText}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    onChange(newContent);
    savedCursorPos.current = start + replacement.length;

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        if (!hasSelection && defaultPlaceholder) {
          textarea.setSelectionRange(start + before.length, start + before.length + defaultPlaceholder.length);
        } else {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + selectedText.length
          );
        }
      }
    }, 10);
  };

  // Helper to manually clean and sanitize any giant base64 codes in the text
  const handleCleanGiantCode = () => {
    const { sanitized, cleanedCount } = sanitizeMarkdownImages(content);
    if (cleanedCount > 0) {
      onChange(sanitized);
      setPasteFeedback(`✨ Limpeza concluída: ${cleanedCount} imagem(ns) foram salvas e os códigos base64 gigantes foram removidos!`);
      setTimeout(() => setPasteFeedback(null), 4000);
    } else {
      setPasteFeedback('✅ Seu texto já está 100% limpo, sem códigos base64.');
      setTimeout(() => setPasteFeedback(null), 3000);
    }
  };

  // Helper for multi-line block formatting (lists, quotes, headings)
  const formatLines = (prefixType: 'bullet' | 'number' | 'checklist' | 'quote' | 'h1' | 'h2' | 'h3') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const firstLineStart = content.lastIndexOf('\n', start - 1) + 1;
    let lastLineEnd = content.indexOf('\n', end);
    if (lastLineEnd === -1) lastLineEnd = content.length;

    const selectedBlock = content.substring(firstLineStart, lastLineEnd);
    const lines = selectedBlock.split('\n');

    const formattedLines = lines.map((line, index) => {
      const cleanLine = line.replace(/^(\s*)(#+\s+|[-*]\s+|\d+\.\s+|-\s*\[[ x]\]\s+|>\s*)/, '$1');
      
      switch (prefixType) {
        case 'bullet':
          return `- ${cleanLine || 'Item da lista'}`;
        case 'number':
          return `${index + 1}. ${cleanLine || 'Item numerado'}`;
        case 'checklist':
          return `- [ ] ${cleanLine || 'Tarefa de manutenção / inspeção'}`;
        case 'quote':
          return `> ${cleanLine || 'Citação ou referência regulamentar...'}`;
        case 'h1':
          return `# ${cleanLine || 'Título Principal'}`;
        case 'h2':
          return `## ${cleanLine || 'Título da Seção'}`;
        case 'h3':
          return `### ${cleanLine || 'Subtítulo Técnico'}`;
        default:
          return line;
      }
    });

    const replacement = formattedLines.join('\n');
    const newContent = content.substring(0, firstLineStart) + replacement + content.substring(lastLineEnd);

    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(firstLineStart, firstLineStart + replacement.length);
    }, 10);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'texto em negrito');
    } else if (modifier && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'texto em itálico');
    } else if (modifier && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      insertFormatting('<u>', '</u>', 'texto sublinhado');
    } else if (modifier && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setShowLinkModal(true);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        if (content.substring(lineStart, lineStart + 2) === '  ') {
          const newContent = content.substring(0, lineStart) + content.substring(lineStart + 2);
          onChange(newContent);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, end - 2));
          }, 10);
        }
      } else {
        const newContent = content.substring(0, start) + '  ' + content.substring(end);
        onChange(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
        }, 10);
      }
    }
  };

  // High-performance image processing and insertion via media service
  const processAndInsertImage = async (file: File | Blob, caption?: string) => {
    try {
      setIsImgUploading(true);
      setPasteFeedback('⏳ Otimizando e carregando imagem...');
      
      const fileName = file instanceof File ? file.name : 'figura_artigo';
      const cleanAlt = caption?.trim() || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Figura Técnica';
      
      const result = await uploadImageMedia(file, cleanAlt);
      
      // Clean short markdown string - NO giant base64 text pollution!
      const markdown = `\n\n![${cleanAlt}](${result.url})\n\n`;
      insertFormatting(markdown);
      
      setPasteFeedback(`🖼️ Imagem "${cleanAlt}" inserida com sucesso!`);
      setTimeout(() => setPasteFeedback(null), 3500);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setPasteFeedback('❌ Erro ao processar imagem.');
      setTimeout(() => setPasteFeedback(null), 3500);
    } finally {
      setIsImgUploading(false);
    }
  };

  // Inline Image file handler from modal
  const handleInlineImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsImgUploading(true);
    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const result = await uploadImageMedia(file, cleanName);
      setImgUrl(result.url);
      if (!imgCaption.trim()) {
        setImgCaption(`Figura: ${cleanName}`);
      }
    } catch {
      // fallback
    } finally {
      setIsImgUploading(false);
    }
  };

  // Handle Preset Image Selection
  const handleSelectPreset = (preset: AviationImagePreset) => {
    setSelectedPresetId(preset.id);
    setImgUrl(preset.url);
    setImgCaption(preset.caption);
  };

  // Direct Clipboard Paste handler (Ctrl+V / Cmd+V)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check for Image Items (Screenshots, clipboard images)
    const items = Array.from(clipboardData.items || []);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        await processAndInsertImage(file, 'Figura: Detalhe Técnico');
        return;
      }
    }

    if (clipboardData.files && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        await processAndInsertImage(file, file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        return;
      }
    }

    // 2. Check for HTML containing rich images
    const html = clipboardData.getData('text/html');
    if (html && (html.includes('<img') || html.includes('<figure'))) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgs = doc.querySelectorAll('img');
        if (imgs.length > 0) {
          let convertedMarkdown = '';
          imgs.forEach(img => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || 'Figura Técnica';
            if (src && !src.startsWith('webkit-fake-url') && !src.startsWith('data:')) {
              convertedMarkdown += `\n\n![${alt}](${src})\n\n`;
            }
          });
          if (convertedMarkdown) {
            e.preventDefault();
            insertFormatting(convertedMarkdown);
            setPasteFeedback('🖼️ Imagem inserida com sucesso!');
            setTimeout(() => setPasteFeedback(null), 3500);
            return;
          }
        }
      } catch {
        // Continue with normal text paste
      }
    }

    // 3. Check for Direct Image Web URL
    const text = clipboardData.getData('text/plain');
    if (text && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(text.trim())) {
      e.preventDefault();
      insertFormatting(`\n\n![Figura Técnica](${text.trim()})\n\n`);
      setPasteFeedback('🔗 Link de imagem convertido em Markdown!');
      setTimeout(() => setPasteFeedback(null), 3500);
      return;
    }
  };

  // Drag & drop image files onto editor
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        await processAndInsertImage(file, file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  // Insert Inline Image into Markdown from Modal
  const handleInsertImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imgUrl.trim()) return;

    const cleanAlt = imgCaption.trim() ? imgCaption.trim() : 'Figura Técnica';
    const imageMarkdown = `\n\n![${cleanAlt}](${imgUrl.trim()})\n\n`;

    insertFormatting(imageMarkdown);
    setShowImageModal(false);
    setImgUrl('');
    setImgCaption('');
    setSelectedPresetId(null);
  };

  // Remove specific image from article markdown
  const handleRemoveImage = (img: ExtractedImage) => {
    const updatedContent = content.replace(img.fullMatch, '');
    onChange(updatedContent);
    setPasteFeedback('🗑️ Imagem removida do artigo.');
    setTimeout(() => setPasteFeedback(null), 2500);
  };

  // Copy Image Markdown code
  const handleCopyImageCode = (img: ExtractedImage) => {
    navigator.clipboard.writeText(img.fullMatch);
    setPasteFeedback('📋 Código Markdown da imagem copiado!');
    setTimeout(() => setPasteFeedback(null), 2500);
  };

  // Insert Custom Technical Table
  const generateCustomTable = () => {
    let tableMd = '\n\n';
    tableMd += '| ' + Array.from({ length: tableCols }, (_, i) => `Coluna ${i + 1}`).join(' | ') + ' |\n';
    tableMd += '| ' + Array.from({ length: tableCols }, () => '---').join(' | ') + ' |\n';
    for (let r = 0; r < tableRows; r++) {
      tableMd += '| ' + Array.from({ length: tableCols }, (_, c) => `Dado ${r + 1}.${c + 1}`).join(' | ') + ' |\n';
    }
    tableMd += '\n';

    insertFormatting(tableMd);
    setShowTableModal(false);
  };

  // Color text wrapping helper
  const insertColorText = (colorName: string, hexColor: string) => {
    insertFormatting(`<span style="color: ${hexColor}; font-weight: bold;">`, `</span>`, `texto em destaque ${colorName}`);
    setShowColorMenu(false);
  };

  // Aviation Callouts
  const insertCallout = (type: 'safety' | 'tip' | 'warning' | 'procedure') => {
    let calloutText = '';
    switch (type) {
      case 'safety':
        calloutText = '\n\n> 🛡️ **NOTA DO ESPECIALISTA / SIPAER:**\n> Informações vitais de segurança operacional e conformidade regulamentar com os padrões da ANAC/FAA.\n\n';
        break;
      case 'tip':
        calloutText = '\n\n> 💡 **DICA DE MANUTENÇÃO PRÁTICA (CHT):**\n> Boas práticas de bancada, uso correto de ferramental calibrado e torqueamento conforme AMM.\n\n';
        break;
      case 'warning':
        calloutText = '\n\n> ⚠️ **ALERTA OPERACIONAL / PONTO CRÍTICO:**\n> Atenção rigorosa aos limites dimensionais e de tolerância estabelecidos pelo fabricante.\n\n';
        break;
      case 'procedure':
        calloutText = '\n\n> 📋 **CHECKLIST DE INSPEÇÃO:**\n> - [ ] 1. Verificação visual inicial\n> - [ ] 2. Teste funcional e calibração\n> - [ ] 3. Registro no diário de bordo e liberação\n\n';
        break;
    }
    insertFormatting(calloutText);
    setShowCalloutMenu(false);
  };

  // Link Insertion
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || 'link de referência';
    insertFormatting(`[${text}](${linkUrl.trim()})`);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleCopyAllMarkdown = () => {
    navigator.clipboard.writeText(content);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden shadow-xs transition-all flex flex-col ${
        isMaximized
          ? 'fixed inset-4 sm:inset-8 z-50 shadow-2xl flex flex-col bg-white'
          : 'relative'
      }`}
    >
      {/* 1. TOP HEADER BAR: Mode Selector & Status */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#E2E8F0] p-1 rounded-xl text-xs font-bold font-['Outfit']">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dividido (Lado a Lado)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-[#0A192F] shadow-xs'
                : 'text-[#64748B] hover:text-[#0A192F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualização Real</span>
          </button>
        </div>

        {/* Word count, Reading time and Fullscreen */}
        <div className="flex items-center gap-3 text-xs text-[#64748B]">
          <span className="hidden sm:inline font-mono">
            {wordCount} palavras • {charCount} caract.
          </span>
          <span className="flex items-center gap-1 text-[#0E2954] font-bold">
            <Clock className="w-3.5 h-3.5" /> ~{readTimeMin} min
          </span>

          <div className="h-4 w-[1px] bg-[#CBD5E1]" />

          <button
            type="button"
            onClick={handleCopyAllMarkdown}
            className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0A192F] transition-colors cursor-pointer"
            title="Copiar todo o Markdown para a área de transferência"
          >
            {copiedMd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0A192F] transition-colors cursor-pointer"
            title={isMaximized ? 'Restaurar tamanho' : 'Modo Foco / Tela Cheia'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. RICH TOOLBAR (Formatting Buttons) */}
      <div className="bg-white border-b border-[#E2E8F0] px-3 py-2 flex flex-wrap items-center gap-1 text-[#334155]">
        {/* Headings */}
        <button
          type="button"
          onClick={() => formatLines('h1')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F] font-bold text-xs"
          title="Título Principal (H1)"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatLines('h2')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F] font-bold text-xs"
          title="Seção Técnica (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatLines('h3')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F] font-bold text-xs"
          title="Subseção (H3)"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-[#E2E8F0] mx-1" />

        {/* Text styling */}
        <button
          type="button"
          onClick={() => insertFormatting('**', '**', 'negrito')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('*', '*', 'itálico')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('<u>', '</u>', 'sublinhado')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Sublinhado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('~~', '~~', 'tachado')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('`', '`', 'código')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Código em linha"
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Color Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorMenu(!showColorMenu)}
            className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#1D4ED8] flex items-center gap-1 font-bold text-xs"
            title="Destacar texto com cores técnicas"
          >
            <Palette className="w-4 h-4" />
          </button>

          {showColorMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-[#CBD5E1] p-2 z-50 space-y-1">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block px-2 py-1">
                Cores Técnicas
              </span>
              <button
                type="button"
                onClick={() => insertColorText('Azul Aeronáutico', '#1D4ED8')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-bold text-[#1D4ED8]"
              >
                <span className="w-3 h-3 rounded-full bg-[#1D4ED8]" /> Azul Aeronáutico
              </button>
              <button
                type="button"
                onClick={() => insertColorText('Verde Operacional', '#059669')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-bold text-[#059669]"
              >
                <span className="w-3 h-3 rounded-full bg-[#059669]" /> Verde Conforme
              </button>
              <button
                type="button"
                onClick={() => insertColorText('Âmbar de Atenção', '#D97706')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-bold text-[#D97706]"
              >
                <span className="w-3 h-3 rounded-full bg-[#D97706]" /> Âmbar Atenção
              </button>
              <button
                type="button"
                onClick={() => insertColorText('Vermelho Alerta', '#DC2626')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-bold text-[#DC2626]"
              >
                <span className="w-3 h-3 rounded-full bg-[#DC2626]" /> Vermelho Crítico
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-[#E2E8F0] mx-1" />

        {/* Lists & Blocks */}
        <button
          type="button"
          onClick={() => formatLines('bullet')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Lista com marcadores"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatLines('number')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatLines('checklist')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Checklist com caixas de checagem"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatLines('quote')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Citação / Bloco de texto"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('\n\n---\n\n')}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Linha Divisória Aeronáutica"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-[#E2E8F0] mx-1" />

        {/* Media & Tables */}
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Inserir Link (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* HIGHLIGHTED IMAGE BUTTON */}
        <button
          type="button"
          onClick={handleOpenImageModal}
          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] font-bold text-xs flex items-center gap-1.5 transition-colors border border-blue-200 cursor-pointer"
          title="Inserir Imagem no ponto do cursor (Fotos do PC, Aviação ou Web)"
        >
          <ImageIcon className="w-4 h-4 text-[#1D4ED8]" />
          <span>Inserir Imagem</span>
        </button>

        {/* Clean Giant Code Button (visible if base64 is detected) */}
        {content.includes('data:image/') && (
          <button
            type="button"
            onClick={handleCleanGiantCode}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs animate-pulse cursor-pointer"
            title="Detectamos códigos base64 gigantes. Clique para converter em imagens limpas e leves!"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Limpar Código Gigante</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowTableModal(true)}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] hover:text-[#0A192F]"
          title="Criar Tabela Técnica"
        >
          <Table className="w-4 h-4" />
        </button>

        {/* Callout Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCalloutMenu(!showCalloutMenu)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs ${
              showCalloutMenu ? 'bg-amber-100 text-amber-900' : 'hover:bg-amber-50 text-amber-800'
            }`}
            title="Caixas de Aviso e Alertas da Aviação"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Avisos</span>
          </button>

          {showCalloutMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-[#CBD5E1] p-3 z-50 space-y-2">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Caixas de Destaque Aeronáutico
              </span>
              <button
                type="button"
                onClick={() => insertCallout('safety')}
                className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50 text-left transition-colors border border-blue-100"
              >
                <ShieldAlert className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-[#0A192F] block">Nota SIPAER / ANAC</span>
                  <span className="text-[10px] text-[#64748B]">Caixa azul preventiva</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertCallout('tip')}
                className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors border border-emerald-100"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-[#0A192F] block">Dica de Manutenção CHT</span>
                  <span className="text-[10px] text-[#64748B]">Boas práticas de bancada</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertCallout('warning')}
                className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-amber-50 text-left transition-colors border border-amber-100"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-[#0A192F] block">Limitação Manual (AMM)</span>
                  <span className="text-[10px] text-[#64748B]">Advertência técnica</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertCallout('procedure')}
                className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-100 text-left transition-colors border border-slate-200"
              >
                <CheckSquare className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-[#0A192F] block">Protocolo Escuro / Checklist</span>
                  <span className="text-[10px] text-[#64748B]">Bloco escuro de etapas</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (Editor / Split / Preview) */}
      <div className="relative flex-1 flex flex-col min-h-0 bg-white">
        {pasteFeedback && (
          <div className="absolute top-3 right-4 z-30 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold font-['Outfit'] shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-3.5 h-3.5" />
            <span>{pasteFeedback}</span>
          </div>
        )}

        {isImgUploading && (
          <div className="absolute top-3 right-4 z-30 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold font-['Outfit'] shadow-lg flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Otimizando e inserindo imagem...</span>
          </div>
        )}

        {viewMode === 'editor' && (
          <div className="relative flex-1 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              required
              value={content}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onSelect={captureCursorPos}
              onClick={captureCursorPos}
              onKeyUp={captureCursorPos}
              onFocus={captureCursorPos}
              onDragOver={e => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              placeholder="Comece a escrever seu artigo técnico aqui... Você pode colar imagens diretamente (Ctrl+V) ou arrastar fotos para dentro desta área!"
              style={{ minHeight: isMaximized ? '100%' : minHeight }}
              className={`w-full flex-1 p-5 font-mono text-xs sm:text-sm text-[#0A192F] leading-relaxed bg-white border-0 focus:outline-hidden resize-y transition-colors ${
                isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-400 ring-inset' : ''
              }`}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0] flex-1 min-h-0">
            <textarea
              ref={textareaRef}
              required
              value={content}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onSelect={captureCursorPos}
              onClick={captureCursorPos}
              onKeyUp={captureCursorPos}
              onFocus={captureCursorPos}
              onDragOver={e => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              placeholder="Escreva em Markdown à esquerda (ou cole fotos com Ctrl+V) e veja o resultado final à direita..."
              style={{ minHeight: isMaximized ? '100%' : minHeight }}
              className={`w-full p-5 font-mono text-xs sm:text-sm text-[#0A192F] leading-relaxed bg-white border-0 focus:outline-hidden resize-y overflow-y-auto transition-colors ${
                isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-400 ring-inset' : ''
              }`}
            />
            <div
              style={{ minHeight: isMaximized ? '100%' : minHeight }}
              className="p-6 bg-[#F8FAFC] overflow-y-auto max-h-[750px]"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#1D4ED8]" /> Pré-visualização Técnica Dinâmica
                </span>
                <span className="text-[10px] text-[#94A3B8]">Atualizado em tempo real</span>
              </div>
              <MarkdownContent content={content || '*Nenhum conteúdo inserido ainda. Comece a digitar ou cole uma imagem à esquerda.*'} />
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="p-6 sm:p-10 bg-[#F8FAFC] overflow-y-auto flex-1 min-h-[450px]">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-12 border border-[#E2E8F0] shadow-sm">
              <MarkdownContent content={content || '## Nenhum conteúdo digitado ainda\n\nComece a escrever no modo **Editor** para visualizar seu artigo completo aqui.'} />
            </div>
          </div>
        )}
      </div>

      {/* 4. ARTICLE MEDIA TRAY (Visual Gallery of all images inside the post) */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMediaTray(!showMediaTray)}
            className="flex items-center gap-2 text-xs font-bold text-[#0A192F] font-['Outfit'] cursor-pointer hover:text-[#1D4ED8] transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#1D4ED8]" />
            <span>Figuras & Mídias Deste Artigo ({articleImages.length})</span>
            {showMediaTray ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="text-[11px] font-bold text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              + Adicionar Figura
            </button>
          </div>
        </div>

        {showMediaTray && (
          <div className="px-4 pb-3 pt-1">
            {articleImages.length === 0 ? (
              <div className="py-2 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                <span>💡 Nenhuma imagem no corpo do artigo ainda. Cole (Ctrl+V), arraste uma foto ou clique em</span>
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="text-[#1D4ED8] font-bold underline cursor-pointer"
                >
                  Adicionar Imagem
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {articleImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-xl border border-[#CBD5E1] shadow-2xs flex items-center gap-2.5 group hover:border-[#1D4ED8] transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                      <img
                        src={resolveImageUrl(img.url)}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-[#0A192F] truncate block" title={img.alt}>
                        {img.alt || `Figura ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] truncate block">
                        {img.url.startsWith('/api/media/') ? 'Mídia Otimizada' : 'Link Web'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyImageCode(img)}
                        className="p-1 text-slate-400 hover:text-[#1D4ED8] rounded-md hover:bg-slate-100 cursor-pointer"
                        title="Copiar código Markdown"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                        title="Excluir imagem do texto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MODAL: INSERT LINK */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#CBD5E1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#0A192F] font-['Outfit'] flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#1D4ED8]" /> Inserir Link no Artigo
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              onKeyDown={e => {
                if (e.key === 'Enter' && linkUrl) {
                  e.preventDefault();
                  handleInsertLink();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                  Texto do Link
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="Ex: Regulamento Brasileiro RBAC 145"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                  URL de Destino *
                </label>
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://anac.gov.br/..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#64748B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="px-5 py-2 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Inserir Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: MODERN IMAGE INSERTION (Upload from PC, 1-Click Aviation Photos, or Web URL) */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#CBD5E1] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-bold text-[#0A192F] font-['Outfit'] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#1D4ED8]" /> Inserir Imagem / Diagrama no Artigo
                </h3>
                <p className="text-xs text-[#64748B]">
                  Fotos são otimizadas automaticamente para carregamento rápido e sem poluir o código.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switch: 3 Tabs */}
            <div className="flex rounded-xl p-1 bg-[#E2E8F0] text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setImgSourceType('upload')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imgSourceType === 'upload'
                    ? 'bg-white text-[#0A192F] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0A192F]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Do Meu Computador
              </button>
              <button
                type="button"
                onClick={() => setImgSourceType('preset')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imgSourceType === 'preset'
                    ? 'bg-white text-[#0A192F] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0A192F]'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-[#1D4ED8]" /> Fotos de Aviação
              </button>
              <button
                type="button"
                onClick={() => setImgSourceType('url')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imgSourceType === 'url'
                    ? 'bg-white text-[#0A192F] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0A192F]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> Link da Web
              </button>
            </div>

            <div
              onKeyDown={e => {
                if (e.key === 'Enter' && imgUrl) {
                  e.preventDefault();
                  handleInsertImage();
                }
              }}
              className="space-y-4"
            >
              {/* TAB 1: UPLOAD FROM COMPUTER */}
              {imgSourceType === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleInlineImageFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {!imgUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 border-2 border-dashed border-[#CBD5E1] hover:border-[#1D4ED8] rounded-2xl text-center cursor-pointer bg-[#F8FAFC] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center mx-auto mb-2 border border-blue-100">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[#0A192F] block font-['Outfit']">
                        {isImgUploading ? 'Otimizando e carregando imagem...' : 'Clique para selecionar a imagem do computador'}
                      </span>
                      <span className="text-[11px] text-[#64748B] mt-1 block">
                        PNG, JPG, WEBP • Otimização automática sem perda de qualidade
                      </span>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-slate-900 p-2">
                      <div className="aspect-video max-h-48 w-full rounded-xl overflow-hidden flex items-center justify-center">
                        <img src={resolveImageUrl(imgUrl)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between pt-2 px-1 text-xs">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Imagem pronta
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setImgUrl('');
                            setImgCaption('');
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                        >
                          Trocar Arquivo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 1-CLICK AVIATION PRESET PHOTOS */}
              {imgSourceType === 'preset' && (
                <div className="space-y-2">
                  <span className="text-xs text-[#64748B] block">
                    Selecione uma foto técnica de alta resolução pronta para enriquecer sua matéria:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {AVIATION_PRESET_IMAGES.map(preset => {
                      const isSelected = selectedPresetId === preset.id || imgUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8] shadow-md scale-[1.02]'
                              : 'border-[#CBD5E1] hover:border-blue-300 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-video bg-slate-900">
                            <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-1.5 bg-white">
                            <span className="text-[11px] font-bold text-[#0A192F] block truncate leading-tight">
                              {preset.title}
                            </span>
                            <span className="text-[9px] text-[#1D4ED8] font-semibold uppercase block truncate">
                              {preset.category}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 p-1 bg-[#1D4ED8] text-white rounded-full">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: WEB URL */}
              {imgSourceType === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                    URL Direta da Imagem *
                  </label>
                  <input
                    type="url"
                    value={imgUrl}
                    onChange={e => setImgUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                  />
                  {imgUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-[#E2E8F0] aspect-video max-h-36 bg-slate-900">
                      <img
                        src={imgUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                  Legenda Técnica da Imagem (Exibida abaixo da foto)
                </label>
                <input
                  type="text"
                  value={imgCaption}
                  onChange={e => setImgCaption(e.target.value)}
                  placeholder="Ex: Figura 1: Injeção de combustível e palhetas de alta pressão do compressor..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#64748B] text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!imgUrl.trim()}
                  className="px-5 py-2 bg-[#0A192F] hover:bg-[#0E2954] disabled:opacity-40 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Inserir no Artigo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: GENERATE CUSTOM TABLE */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-[#CBD5E1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#0A192F] font-['Outfit'] flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-600" /> Criar Tabela Técnica
              </h3>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  generateCustomTable();
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                    Linhas (1 a 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={e => setTableRows(parseInt(e.target.value) || 3)}
                    className="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase mb-1">
                    Colunas (1 a 6)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={tableCols}
                    onChange={e => setTableCols(parseInt(e.target.value) || 3)}
                    className="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0E2954]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#64748B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={generateCustomTable}
                  className="px-5 py-2 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Gerar Tabela
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
