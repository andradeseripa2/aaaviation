import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// 1. Read Firebase configuration
let firebaseConfig = {
  projectId: 'gen-lang-client-0436793854',
  apiKey: 'AIzaSyDWTQJ-Tem8McnV__dyMFzI-DbvA9wHEE4',
  firestoreDatabaseId: 'ai-studio-alexandreandrade-1f3da25f-8ac3-41f4-956a-2899be5dc07d'
};

try {
  const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    firebaseConfig = { ...firebaseConfig, ...JSON.parse(raw) };
  }
} catch (err) {
  console.warn('[SSG] Could not read firebase-applet-config.json, using defaults.');
}

const DOMAIN = 'https://aaaviation.com.br';
const DIST_DIR = path.join(process.cwd(), 'dist');

const STATIC_ROUTES = [
  {
    path: '/sobre',
    title: 'Sobre Alexandre Andrade | Especialista em Manutenção & SIPAER',
    description: 'Mais de uma década de experiência na Força Aérea Brasileira (FAB). Inspetor de aeronaves formado pelo ILA e Elemento Credenciado SIPAER para investigação de acidentes aeronáuticos.',
    h1: 'Sobre Alexandre Andrade — Doutrina Técnica & Segurança de Voo',
    bodyText: 'Mais de 20 anos de vivência prática dedicados à manutenção estrutural, motores aeronáuticos, fatores humanos e segurança de voo. Trajetória técnica em C-95 Bandeirante, C-97 Brasília e caças F-5 Tiger II da FAB.'
  },
  {
    path: '/contato',
    title: 'Consultoria Técnica & Palestras em Segurança de Voo | Contato',
    description: 'Solicite consultoria técnica em MRO, auditorias SGSO (RBAC 145/91/135) e palestras corporativas em CRM/MRM com Alexandre Andrade.',
    h1: 'Consultoria Especializada, Treinamentos & Palestras',
    bodyText: 'Atendimento especializado para operadores executivos, companhias aéreas, oficinas homologadas e centros de formação aeronáutica em todo o Brasil. Auditorias de SGSO, palestras em Fatores Humanos e pareceres em aeronavegabilidade.'
  },
  {
    path: '/blog',
    title: 'Artigos Técnicos & Doutrina Aeronáutica | Blog Alexandre Andrade',
    description: 'Acervo completo de análises técnicas sobre manutenção de aeronaves, motores turboélice e reação, inspeções SGSO, fatores humanos e cultura SIPAER.',
    h1: 'Artigos Técnicos & Doutrina de Manutenção Aeronáutica',
    bodyText: 'Navegue por artigos técnicos fundamentados em manuais de fabricante (AMM, SRM, CMM), normas RBAC da ANAC e metodologias de prevenção do SIPAER/CENIPA.'
  },
  {
    path: '/privacidade',
    title: 'Política de Privacidade & Proteção de Dados (LGPD) | Alexandre Andrade',
    description: 'Conheça nossa política de privacidade e conformidade com a LGPD para armazenamento seguro de dados de sessão, newsletter e contato.',
    h1: 'Política de Privacidade & Segurança de Dados',
    bodyText: 'Compromisso com a proteção e privacidade dos dados dos leitores e assinantes da newsletter técnica, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).'
  },
  {
    path: '/termos',
    title: 'Termos de Uso & Isenção de Responsabilidade | Alexandre Andrade',
    description: 'Termos de uso do portal Alexandre Andrade Aviation. Aviso institucional sobre caráter estritamente educativo e doutrinário dos artigos.',
    h1: 'Termos de Uso & Aviso Institucional',
    bodyText: 'Todo o conteúdo deste portal tem caráter estritamente educacional e doutrinário. Para intervenções operacionais, consulte sempre os manuais atualizados do fabricante (AMM) e regulamentos vigentes da ANAC.'
  }
];

const CATEGORIES = [
  {
    slug: 'manutencao',
    name: 'Manutenção Aeronáutica',
    description: 'Rotinas de hangar, inspeções boroscópicas, certificações CHT, MRO e casos práticos de manutenção estrutural e de sistemas.'
  },
  {
    slug: 'safety',
    name: 'Safety & SIPAER',
    description: 'Cultura de segurança de voo, investigação e prevenção de incidentes aeronáuticos, fatores humanos e SGSO.'
  },
  {
    slug: 'carreira',
    name: 'Carreira & Formação Técnica',
    description: 'Trajetória profissional para mecânicos e inspetores, certificações CHT ANAC, formação militar e ingresso na aviação civil.'
  },
  {
    slug: 'curiosidades',
    name: 'Engenharia & Curiosidades',
    description: 'Física do voo, aerodinâmica, fatos históricos da aviação militar e civil e análises técnicas fascinantes.'
  }
];

async function fetchPostsFromFirestore() {
  const postsMap = new Map();

  try {
    console.log(`[SSG] Initializing Firebase SDK for database: ${firebaseConfig.firestoreDatabaseId}...`);
    const app = initializeApp(firebaseConfig);
    const db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);

    const snap = await getDocs(collection(db, 'posts'));
    console.log(`[SSG] Firestore fetch complete. Total raw documents retrieved: ${snap.size}`);

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = data?.id || docSnap.id;
      const published = typeof data?.published === 'boolean' ? data.published : true;
      if (!published) return;

      const slug = data.slug || id;
      const title = data.title || 'Artigo Técnico';
      const subtitle = data.subtitle || '';
      const excerpt = data.excerpt || subtitle || '';
      const category = data.category || 'manutencao';
      const date = data.date || data.createdAt?.substring(0, 10) || '2026';
      const readTimeMinutes = Number(data.readTimeMinutes || 5);
      const coverImage = data.coverImage || '/logoqua.webp';
      const content = data.content || '';
      const authorName = data.author?.name || 'Alexandre Andrade';
      const authorRole = data.author?.role || 'Especialista em Manutenção & Investigador SIPAER';
      const authorAvatar = data.author?.avatar || '/author.webp';

      postsMap.set(slug, {
        id,
        slug,
        title,
        subtitle,
        excerpt,
        category,
        date,
        readTimeMinutes,
        coverImage,
        content,
        published: true,
        author: {
          name: authorName,
          role: authorRole,
          avatar: authorAvatar
        }
      });
    });
  } catch (err) {
    console.error(`[SSG] Error querying Firestore (${firebaseConfig.firestoreDatabaseId}):`, err?.message || err);
  }

  const postsList = Array.from(postsMap.values());
  console.log(`[SSG] Total published articles ready for SSG generation: ${postsList.length}`);
  postsList.forEach(p => {
    console.log(`[SSG] -> Article: "${p.title}" (slug: /post/${p.slug})`);
  });

  return postsList;
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToPlainText(md = '') {
  return String(md)
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}.*?`{1,3}/gs, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function generateStaticHtml(templateHtml, meta) {
  let html = templateHtml;

  const fullTitle = `${meta.title} | Alexandre Andrade Aviation`;
  const absoluteUrl = meta.url.startsWith('http') ? meta.url : `${DOMAIN}${meta.url.startsWith('/') ? '' : '/'}${meta.url}`;
  const rawImage = meta.image || '/logoqua.webp';
  const absoluteImage = rawImage.startsWith('http') ? rawImage : `${DOMAIN}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/gi, `<title>${escapeHtml(fullTitle)}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/gi,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  // Replace Canonical URL
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/gi,
    `<link rel="canonical" href="${escapeHtml(absoluteUrl)}" />`
  );

  // Replace Open Graph Tags
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/gi,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/gi,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/gi,
    `<meta property="og:url" content="${escapeHtml(absoluteUrl)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?" \/>/gi,
    `<meta property="og:image" content="${escapeHtml(absoluteImage)}" />`
  );
  html = html.replace(
    /<meta property="og:type" content=".*?" \/>/gi,
    `<meta property="og:type" content="${escapeHtml(meta.type || 'website')}" />`
  );

  // Replace Twitter Card Tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/gi,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/gi,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?" \/>/gi,
    `<meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />`
  );

  // Pre-rendered semantic layout inside #root
  const preRenderedContent = `
  <div id="root">
    <header class="bg-[#0A192F] text-white p-4 border-b border-blue-900">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <a href="/" class="text-lg font-bold font-['Outfit'] text-white">Alexandre Andrade Aviation</a>
        <nav class="flex gap-4 text-xs font-semibold">
          <a href="/" class="hover:text-blue-300">Início</a>
          <a href="/blog" class="hover:text-blue-300">Artigos</a>
          <a href="/sobre" class="hover:text-blue-300">Sobre</a>
          <a href="/contato" class="hover:text-blue-300">Consultoria & Contato</a>
        </nav>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <article>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0A192F] mb-4">${escapeHtml(meta.h1)}</h1>
        <div class="text-slate-700 leading-relaxed space-y-4">
          ${meta.bodyHtml}
        </div>
      </article>

      <section class="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
        <h3 class="text-base font-bold text-[#0A192F] mb-2">Alexandre Andrade — Consultoria em Manutenção Aeronáutica & SIPAER</h3>
        <p class="text-xs text-slate-600 mb-4">Mais de uma década na Força Aérea Brasileira (FAB). Auditorias SGSO, fatores humanos (CRM/MRM) e pareceres técnicos.</p>
        <div class="flex gap-3">
          <a href="/contato" class="px-4 py-2 bg-[#0A192F] text-white text-xs font-bold rounded-xl">Solicitar Consultoria</a>
          <a href="/sobre" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl">Conhecer o Autor</a>
        </div>
      </section>
    </main>

    <footer class="mt-16 bg-[#0A192F] text-slate-400 text-xs py-8 px-4 border-t border-blue-900 text-center">
      <p>© ${new Date().getFullYear()} Alexandre Andrade. Todos os direitos reservados. Safety First • SIPAER Culture.</p>
      <p class="mt-2 text-[11px] text-slate-500">Aviso Institucional: As opiniões expressas são pessoais e não representam posição oficial do CENIPA, ANAC ou FAB.</p>
    </footer>
  </div>`;

  // Replace entire #root container content up to noscript
  if (html.includes('id="root"')) {
    html = html.replace(/<div id="root">[\s\S]*?(?=\s*<noscript>)/i, preRenderedContent.trim());
  }

  // Inject JSON-LD Schema if provided
  if (meta.schemaJson) {
    const schemaTag = `<script type="application/ld+json">\n${JSON.stringify(meta.schemaJson, null, 2)}\n</script>\n</head>`;
    html = html.replace(/<\/head>/i, schemaTag);
  }

  return html;
}

function writeHtmlFile(relPath, content) {
  // 1. Write folder index (e.g. dist/sobre/index.html)
  const targetDir = path.join(DIST_DIR, relPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), content, 'utf8');

  // 2. Also write flat HTML file (e.g. dist/sobre.html) so Netlify serves both /sobre and /sobre/ perfectly
  const cleanPath = relPath.replace(/\/$/, '');
  if (!cleanPath.endsWith('index')) {
    const flatFile = path.join(DIST_DIR, `${cleanPath}.html`);
    fs.mkdirSync(path.dirname(flatFile), { recursive: true });
    fs.writeFileSync(flatFile, content, 'utf8');
  }
}

async function runSSG() {
  console.log('[SSG] Starting Static Site Generation (SSG) for Netlify deployment...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[SSG] Dist directory not found at: ${DIST_DIR}. Please run 'vite build' first.`);
    process.exit(1);
  }

  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('[SSG] index.html not found in dist/. Cannot generate static routes.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Fetch real published posts directly from Firestore using Firebase JS SDK
  const posts = await fetchPostsFromFirestore();

  const generatedRoutes = [];

  // Helper to build list of all published post cards with semantic <a> links
  const allArticlesListHtml = `
    <div class="space-y-4 mt-6">
      <h2 class="text-xl font-bold text-[#0A192F]">Artigos Técnicos Publicados</h2>
      <ul class="space-y-4">
        ${posts.map(p => `
          <li class="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-colors">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0E2954] uppercase tracking-wide font-mono">${escapeHtml(p.category || 'manutencao')}</span>
              <span class="text-xs text-slate-400 font-mono">${escapeHtml(p.date || '')} • ${p.readTimeMinutes || 5} min de leitura</span>
            </div>
            <h3 class="text-lg font-bold text-[#0A192F] mb-1">
              <a href="/post/${escapeHtml(p.slug)}" class="hover:text-blue-600">${escapeHtml(p.title)}</a>
            </h3>
            <p class="text-xs text-slate-600 mb-3">${escapeHtml(p.excerpt || '')}</p>
            <a href="/post/${escapeHtml(p.slug)}" class="inline-flex items-center text-xs font-bold text-[#0E2954] hover:underline">
              Ler artigo completo (${escapeHtml(p.title)}) →
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  // 1. Generate Static Institutional Pages
  for (const page of STATIC_ROUTES) {
    let bodyContent = `<p>${escapeHtml(page.bodyText)}</p>`;
    if (page.path === '/blog') {
      bodyContent += allArticlesListHtml;
    }

    const html = generateStaticHtml(templateHtml, {
      title: page.title,
      description: page.description,
      url: page.path,
      h1: page.h1,
      bodyHtml: bodyContent,
      type: 'website',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: `${DOMAIN}${page.path}`
      }
    });

    writeHtmlFile(page.path.replace(/^\//, ''), html);
    generatedRoutes.push(page.path);
    console.log(`[SSG] Generated static HTML: ${page.path}/index.html & ${page.path}.html`);
  }

  // 2. Generate Category Pages
  for (const cat of CATEGORIES) {
    const categoryPosts = posts.filter(p => p.category === cat.slug);
    let postListHtml = '';
    if (categoryPosts.length > 0) {
      postListHtml = `<ul class="space-y-3 mt-4">` +
        categoryPosts.map(p => `
          <li class="p-4 border border-slate-200 rounded-xl bg-white">
            <a href="/post/${escapeHtml(p.slug)}" class="font-bold text-[#0A192F] hover:text-blue-600 block text-base">${escapeHtml(p.title)}</a>
            <p class="text-xs text-slate-600 mt-1">${escapeHtml(p.excerpt || '')}</p>
            <span class="text-[11px] text-slate-400 font-mono mt-2 inline-block">${escapeHtml(p.date || '')} • ${p.readTimeMinutes || 5} min de leitura</span>
          </li>
        `).join('') +
        `</ul>`;
    } else {
      postListHtml = `<p class="text-sm text-slate-500">Artigos técnicos em fase de edição para esta categoria.</p>`;
    }

    const catPath = `/categoria/${cat.slug}`;
    const html = generateStaticHtml(templateHtml, {
      title: `${cat.name} | Artigos Técnicos de Aviação`,
      description: cat.description,
      url: catPath,
      h1: `${cat.name} — Acervo Técnico`,
      bodyHtml: `<p class="text-sm text-slate-600 mb-6">${escapeHtml(cat.description)}</p>${postListHtml}`,
      type: 'website',
      schemaJson: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: cat.name,
        description: cat.description,
        url: `${DOMAIN}${catPath}`
      }
    });

    writeHtmlFile(`categoria/${cat.slug}`, html);
    generatedRoutes.push(catPath);
    console.log(`[SSG] Generated static HTML: ${catPath}/index.html & ${catPath}.html`);
  }

  // 3. Generate Post Pages (Real Published Articles from Firestore)
  for (const post of posts) {
    const plainExcerpt = post.excerpt || markdownToPlainText(post.content).slice(0, 160) || 'Artigo técnico sobre aviação por Alexandre Andrade.';
    const paragraphs = (post.content || '')
      .split(/\n\n+/)
      .filter(Boolean)
      .slice(0, 10)
      .map(p => `<p class="mb-4">${escapeHtml(markdownToPlainText(p))}</p>`)
      .join('');

    const postBodyHtml = `
      <div class="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Publicado por <strong>${escapeHtml(post.author?.name || 'Alexandre Andrade')}</strong></span>
        <span>${escapeHtml(post.date || '')} • ${post.readTimeMinutes || 5} min de leitura</span>
      </div>
      ${post.coverImage && !post.coverImage.startsWith('/api/media/') ? `<div class="mb-6"><img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" class="w-full h-auto rounded-2xl object-cover max-h-96" /></div>` : ''}
      <div class="article-content space-y-4">
        ${paragraphs || `<p>${escapeHtml(plainExcerpt)}</p>`}
      </div>
    `;

    const postSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: plainExcerpt,
      image: post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `${DOMAIN}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`) : `${DOMAIN}/logoqua.webp`,
      datePublished: post.date || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: post.author?.name || 'Alexandre Andrade',
        url: `${DOMAIN}/sobre`
      },
      publisher: {
        '@type': 'Organization',
        name: 'Alexandre Andrade Aviation',
        logo: {
          '@type': 'ImageObject',
          url: `${DOMAIN}/logoqua.webp`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${DOMAIN}/post/${post.slug}`
      }
    };

    // Primary route: /post/:slug
    const postHtml = generateStaticHtml(templateHtml, {
      title: post.title,
      description: plainExcerpt,
      image: post.coverImage,
      url: `/post/${post.slug}`,
      type: 'article',
      author: post.author?.name || 'Alexandre Andrade',
      datePublished: post.date,
      h1: post.title,
      bodyHtml: postBodyHtml,
      schemaJson: postSchema
    });

    writeHtmlFile(`post/${post.slug}`, postHtml);
    generatedRoutes.push(`/post/${post.slug}`);
    console.log(`[SSG] Generated static article HTML: /post/${post.slug}/index.html & /post/${post.slug}.html`);

    // Alias routes for maximum link compatibility: /blog/:slug and /artigo/:slug
    writeHtmlFile(`blog/${post.slug}`, postHtml);
    writeHtmlFile(`artigo/${post.slug}`, postHtml);
  }

  // 4. Update Root index.html pre-rendered content with real crawler links
  const homeWithLinks = templateHtml.replace(
    /<!-- High-Authority Technical Aviation Content[\s\S]*?<\/div>\s*<\/div>/i,
    `<!-- High-Authority Technical Aviation Content (Parsed by Google AdSense & Search Crawlers) -->
      <div class="p-6 bg-slate-50 border-t border-slate-200">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-[#0A192F]">Alexandre Andrade Aviation — Manutenção Aeronáutica &amp; SIPAER</h1>
          <p class="text-sm text-slate-600 mt-1">Portal técnico especializado em Manutenção Aeronáutica, Segurança Operacional (SIPAER/CENIPA), Regulamentação RBAC/ANAC e Gestão SGSO.</p>
          <nav class="flex gap-4 text-xs font-semibold mt-3">
            <a href="/" class="text-[#0E2954] hover:underline">Início</a>
            <a href="/sobre" class="text-[#0E2954] hover:underline">Sobre o Autor</a>
            <a href="/blog" class="text-[#0E2954] hover:underline">Artigos Técnicos</a>
            <a href="/contato" class="text-[#0E2954] hover:underline">Consultoria &amp; Contato</a>
          </nav>
        </header>

        <section class="mt-6">
          <h2 class="text-lg font-bold text-[#0A192F] mb-3">Artigos Técnicos Publicados</h2>
          <ul class="space-y-3">
            ${posts.map(p => `
              <li class="p-4 bg-white border border-slate-200 rounded-xl">
                <a href="/post/${escapeHtml(p.slug)}" class="font-bold text-[#0A192F] hover:text-blue-600">${escapeHtml(p.title)}</a>
                <p class="text-xs text-slate-600 mt-1">${escapeHtml(p.excerpt || '')}</p>
                <span class="text-[11px] text-slate-400 font-mono mt-2 inline-block">${escapeHtml(p.date || '')} • ${p.readTimeMinutes || 5} min de leitura</span>
              </li>
            `).join('')}
          </ul>
        </section>
      </div>
    </div>`
  );
  fs.writeFileSync(indexHtmlPath, homeWithLinks, 'utf8');

  // 5. Update Sitemap XML with real published posts
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- Página Inicial -->
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Páginas Institucionais -->
  <url>
    <loc>${DOMAIN}/sobre</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/contato</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${DOMAIN}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Categorias -->
${CATEGORIES.map(c => `  <url>
    <loc>${DOMAIN}/categoria/${c.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Artigos Publicados Reais -->
${posts.map(p => `  <url>
    <loc>${DOMAIN}/post/${p.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Páginas Legais -->
  <url>
    <loc>${DOMAIN}/privacidade</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${DOMAIN}/termos</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  const publicSitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(path.dirname(publicSitemapPath))) {
    fs.writeFileSync(publicSitemapPath, sitemapXml, 'utf8');
  }

  // 6. Ensure Netlify _redirects exist in dist/
  const redirectsContent = `
# Netlify Static Redirects: Static files are served directly (200 OK)
# Fallback SPA rule for any client-side dynamic routes:
/*    /index.html   200
`.trim();

  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), redirectsContent + '\n', 'utf8');

  console.log(`[SSG] Done! Successfully generated ${generatedRoutes.length} static routes for all ${posts.length} real published articles and updated sitemap.xml.`);
  process.exit(0);
}

runSSG().catch(err => {
  console.error('[SSG] Unhandled error during SSG:', err);
  process.exit(1);
});
