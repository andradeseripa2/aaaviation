import { Post } from '../types';
import { resolveImageUrl } from '../services/mediaService';

/**
 * Generates and prints a clean, executive aviation technical document for the given post.
 * Strips UI clutter (ads, sidebars, interactive controls) and applies executive typography,
 * formal aviation report headers, technical metadata, and page break optimizations.
 */
export const downloadExecutivePdf = (post: Post, authorName: string = 'Alexandre Andrade', authorRole: string = 'Especialista em Manutenção Aeronáutica'): void => {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    // If popup blocked, fallback to normal window.print
    window.print();
    return;
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const accessYear = new Date().getFullYear();
  const currentUrl = window.location.href;
  const coverUrl = post.coverImage ? resolveImageUrl(post.coverImage) : '';

  // Clean Markdown basic parsing to HTML for printing if needed, or structured content
  const formatBodyContent = (content: string): string => {
    return content
      // Convert markdown headers
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 14pt; font-weight: 700; color: #0A192F; margin-top: 18pt; margin-bottom: 8pt; border-bottom: 1px solid #E2E8F0; padding-bottom: 4pt;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 16pt; font-weight: 800; color: #0A192F; margin-top: 22pt; margin-bottom: 10pt; border-bottom: 2px solid #1D4ED8; padding-bottom: 4pt;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 18pt; font-weight: 900; color: #0A192F; margin-top: 24pt; margin-bottom: 12pt;">$1</h1>')
      // Bold and italics
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Blockquotes
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left: 4px solid #1D4ED8; background-color: #F8FAFC; padding: 8pt 12pt; margin: 12pt 0; font-style: italic; color: #334155;">$1</blockquote>')
      // Bullet lists
      .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 4pt; color: #334155;">$1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p style="margin-bottom: 12pt; line-height: 1.65; color: #1E293B; text-align: justify;">')
      .replace(/\n/gim, '<br />');
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${post.title} — Alexandre Andrade Aviation (PDF Executivo)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1E293B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    .doc-container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Executive Top Header */
    .executive-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0A192F;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 13pt;
      font-weight: 800;
      color: #0A192F;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      color: #1D4ED8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .doc-meta-badge {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #64748B;
    }

    .doc-badge-pill {
      display: inline-block;
      background-color: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      margin-bottom: 4px;
    }

    /* Post Title Block */
    .article-title-block {
      margin-bottom: 20px;
    }

    .category-tag {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      color: #1D4ED8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    h1.article-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22pt;
      font-weight: 900;
      color: #0A192F;
      line-height: 1.2;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }

    .article-subtitle {
      font-size: 12pt;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    /* Author / Meta Strip */
    .meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 8.5pt;
      color: #475569;
      margin-bottom: 20px;
    }

    .author-info {
      font-weight: 600;
      color: #0A192F;
    }

    /* Cover Image */
    .article-cover {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
      margin-bottom: 20px;
    }

    /* Article Content */
    .article-body {
      font-size: 10.5pt;
      line-height: 1.7;
      color: #1E293B;
      text-align: justify;
    }

    .article-body p {
      margin-bottom: 12pt;
    }

    /* Executive Footer */
    .executive-footer {
      margin-top: 35px;
      padding-top: 14px;
      border-top: 1.5px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 7.5pt;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      page-break-inside: avoid;
    }

    .disclaimer-box {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 8pt;
      color: #92400E;
      margin-top: 24px;
      page-break-inside: avoid;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <!-- Executive Aviation Header -->
    <header class="executive-header">
      <div class="brand-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#0A192F"/>
          <path d="M16 6L24 22L16 18L8 22L16 6Z" fill="#38BDF8"/>
          <path d="M16 10L20.5 19L16 16.5L11.5 19L16 10Z" fill="white"/>
        </svg>
        <div>
          <div class="brand-title">Alexandre Andrade Aviation</div>
          <div class="brand-sub">Relatório Técnico & Artigo de Engenharia</div>
        </div>
      </div>

      <div class="doc-meta-badge">
        <div class="doc-badge-pill">${post.technicalBadge || post.category.toUpperCase()}</div>
        <div>Doc Ref: AAA-${post.id.slice(0, 8).toUpperCase()}</div>
        <div>Emitido: ${currentDate}</div>
      </div>
    </header>

    <!-- Main Title & Metadata -->
    <section class="article-title-block">
      <div class="category-tag">Categoria: ${post.category.toUpperCase()}</div>
      <h1 class="article-title">${post.title}</h1>
      ${post.subtitle ? `<div class="article-subtitle">${post.subtitle}</div>` : ''}

      <div class="meta-strip">
        <div><strong>Autor Técnico:</strong> ${authorName} (${authorRole})</div>
        <div><strong>Publicação Original:</strong> ${post.date} • ${post.readTimeMinutes} min de leitura</div>
      </div>
    </section>

    <!-- Cover Image (if available) -->
    ${
      coverUrl
        ? `<img src="${coverUrl}" alt="${post.title}" class="article-cover" />`
        : ''
    }

    <!-- Article Content -->
    <main class="article-body">
      <p style="margin-bottom: 12pt; line-height: 1.65; color: #1E293B; text-align: justify;">
        ${formatBodyContent(post.content)}
      </p>
    </main>

    <!-- Technical Safety Disclaimer -->
    <div class="disclaimer-box">
      <strong>⚠️ NOTA OPERACIONAL & DE SEGURANÇA:</strong> As informações contidas neste documento técnico têm caráter puramente informativo, educativo e de disseminação de melhores práticas. Para quaisquer intervenções, manutenções ou operações de voo, consulte sempre os manuais vigentes do fabricante da aeronave (AMM, IPC, FCOM, QRH) e as diretrizes oficiais dos órgãos reguladores (ANAC, FAA, EASA).
    </div>

    <!-- Executive Footer -->
    <footer class="executive-footer">
      <div>
        <strong>Alexandre Andrade Aviation Portal</strong><br />
        Disponível online em: <span style="color: #1D4ED8;">${currentUrl}</span>
      </div>
      <div style="text-align: right;">
        © ${accessYear} Alexandre Andrade. Todos os direitos reservados.<br />
        Documento gerado para leitura e estudo exclusivo.
      </div>
    </footer>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
