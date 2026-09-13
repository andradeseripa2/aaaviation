import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Ensure persistent upload directories exist on disk
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const dataUploadsDir = path.join(process.cwd(), 'data', 'uploads');
  try {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
    fs.mkdirSync(dataUploadsDir, { recursive: true });
  } catch (e) {
    console.warn('Upload directory initialization note:', e);
  }

  // In-memory media store & fast caching
  const mediaStore = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number; name?: string }>();

  // Load Firebase Config for Cloud Media Sync across all devices and containers
  let firebaseConfig: { projectId?: string; apiKey?: string; firestoreDatabaseId?: string } = {};
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Firebase config loading note:', e);
  }

  async function fetchMediaFromFirestore(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      return null;
    }
    try {
      const cleanId = mediaId.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
      const databasesToTry = [
        firebaseConfig.firestoreDatabaseId,
        '(default)'
      ].filter(Boolean) as string[];

      for (const dbId of databasesToTry) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/media/${encodeURIComponent(cleanId)}?key=${firebaseConfig.apiKey}`;
          const response = await fetch(url);
          if (response.ok) {
            const data: any = await response.json();
            const dataUrl = data?.fields?.dataUrl?.stringValue;
            if (dataUrl && typeof dataUrl === 'string') {
              const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              const mimeType = matches ? matches[1] : (cleanId.endsWith('.webp') ? 'image/webp' : cleanId.endsWith('.png') ? 'image/png' : 'image/jpeg');
              const base64Data = matches ? matches[2] : dataUrl;
              const buffer = Buffer.from(base64Data, 'base64');
              return { buffer, mimeType };
            }
          }
        } catch {}
      }
      return null;
    } catch (err) {
      console.warn('Error fetching media from Firestore REST:', err);
      return null;
    }
  }

  async function saveMediaToFirestore(mediaId: string, dataUrl: string, name?: string) {
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.firestoreDatabaseId) {
      return;
    }
    try {
      const cleanId = mediaId.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/media/${encodeURIComponent(cleanId)}?key=${firebaseConfig.apiKey}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            id: { stringValue: cleanId },
            dataUrl: { stringValue: dataUrl },
            name: { stringValue: name || cleanId },
            updatedAt: { stringValue: new Date().toISOString() }
          }
        })
      });
    } catch (err) {
      console.warn('Error saving media to Firestore REST:', err);
    }
  }

  // Pre-load any existing uploaded images from disk into cache
  try {
    const files = fs.readdirSync(publicUploadsDir);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = path.join(publicUploadsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
        const buffer = fs.readFileSync(filePath);
        mediaStore.set(file, { buffer, mimeType, createdAt: stats.mtimeMs, name: file });
      }
    }
  } catch (e) {
    // Disk reading fallback
  }

  // Serve persistent uploads directly
  app.use('/uploads', express.static(publicUploadsDir, { maxAge: '30d', immutable: true }));

  // Explicit route for Google AdSense ads.txt verification
  app.get('/ads.txt', (req, res) => {
    const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(adsTxtPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(adsTxtPath);
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send('google.com, pub-6609396265350793, DIRECT, f08c47fec0942fa0\n');
  });

  // Explicit route for robots.txt
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(robotsPath);
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send('User-agent: *\nAllow: /\nSitemap: https://aaaviation.com.br/sitemap.xml\n');
  });

  // Explicit route for sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.sendFile(sitemapPath);
    }
    res.status(404).send('Not found');
  });

  // Explicit route for llms.txt & llms-full.txt (Agentic & LLM Navigation)
  app.get(['/llms.txt', '/llms-full.txt'], (req, res) => {
    const filename = req.path.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(filePath);
    }
    res.status(404).send('Not found');
  });

  // Explicit route for logo.png, image.png, favicon, apple-touch-icon and icons
  app.get(['/author.webp', '/logo.png', '/logo.webp', '/logoret.png', '/logoret.webp', '/logoqua.png', '/logoqua.webp', '/image.png', '/favicon.png', '/favicon.ico', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png', '/icon-192.png', '/icon-512.png'], (req, res) => {
    const requested = req.path.replace(/^\//, '');
    const specificPath = path.join(process.cwd(), 'public', requested);
    if (fs.existsSync(specificPath)) {
      const mime = requested.endsWith('.ico') ? 'image/x-icon' : requested.endsWith('.webp') ? 'image/webp' : requested.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(specificPath);
    }
    const imgPath = path.join(process.cwd(), 'public', 'image.png');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const targetPath = fs.existsSync(imgPath) ? imgPath : fs.existsSync(logoPath) ? logoPath : null;
    if (targetPath) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(targetPath);
    }
    res.status(404).send('Not found');
  });

  app.get('/favicon.svg', (req, res) => {
    const favPath = path.join(process.cwd(), 'public', 'favicon.svg');
    if (fs.existsSync(favPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(favPath);
    }
    res.status(404).send('Not found');
  });

  // Media Upload Endpoint (Accepts base64, persists to memory, disk and Firestore Cloud)
  app.post('/api/media/upload', async (req, res) => {
    try {
      const { imageBase64, name = 'imagem_artigo', mimeType = 'image/webp' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ success: false, error: 'Dados da imagem não fornecidos.' });
      }

      // Extract binary data from data URI if present
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const actualMime = matches ? matches[1] : mimeType;
      const base64Data = matches ? matches[2] : imageBase64;
      const fullDataUrl = matches ? imageBase64 : `data:${actualMime};base64,${base64Data}`;
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate clean unique ID or use requested mediaId
      const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 30);
      const extension = actualMime.includes('png') ? 'png' : actualMime.includes('webp') ? 'webp' : 'jpg';
      const rawRequestedId = (req.body.mediaId || '').replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
      const mediaId = rawRequestedId || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}.${extension}`;

      // Save to memory cache
      mediaStore.set(mediaId, {
        buffer,
        mimeType: actualMime,
        createdAt: Date.now(),
        name
      });

      // Persist to local disk
      try {
        fs.writeFileSync(path.join(publicUploadsDir, mediaId), buffer);
        fs.writeFileSync(path.join(dataUploadsDir, mediaId), buffer);
      } catch (writeErr) {
        console.warn('Disk write note:', writeErr);
      }

      // Persist directly to Firestore Cloud Database for cross-device synchronization
      saveMediaToFirestore(mediaId, fullDataUrl, cleanName).catch(() => {});

      const url = `/api/media/${mediaId}`;

      return res.json({
        success: true,
        mediaId,
        url,
        sizeBytes: buffer.length,
        mimeType: actualMime
      });
    } catch (err: any) {
      console.error('Error uploading media:', err);
      return res.status(500).json({ success: false, error: 'Erro ao processar imagem.' });
    }
  });

  // Media Serving Endpoint (Memory -> Disk -> Firestore Cloud Database Sync)
  app.get('/api/media/:mediaId', async (req, res) => {
    const { mediaId } = req.params;
    const cleanId = mediaId.replace(/^\/api\/media\//, '').replace(/^media:/, '').trim();
    
    // 1. Check in-memory store
    let media = mediaStore.get(cleanId) || mediaStore.get(mediaId);

    // 2. If not in RAM, read from permanent disk storage
    if (!media) {
      const publicPath = path.join(publicUploadsDir, cleanId);
      const dataPath = path.join(dataUploadsDir, cleanId);
      const diskPath = fs.existsSync(publicPath) ? publicPath : fs.existsSync(dataPath) ? dataPath : null;

      if (diskPath) {
        try {
          const buffer = fs.readFileSync(diskPath);
          const ext = path.extname(cleanId).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
          media = { buffer, mimeType, createdAt: Date.now(), name: cleanId };
          mediaStore.set(cleanId, media);
        } catch (e) {
          // File reading error
        }
      }
    }

    // 3. If not in RAM or Disk, fetch directly from cloud Firestore
    if (!media) {
      const cloudMedia = await fetchMediaFromFirestore(cleanId);
      if (cloudMedia) {
        media = {
          buffer: cloudMedia.buffer,
          mimeType: cloudMedia.mimeType,
          createdAt: Date.now(),
          name: cleanId
        };
        mediaStore.set(cleanId, media);
        // Persist locally for instant future requests
        try {
          fs.writeFileSync(path.join(publicUploadsDir, cleanId), cloudMedia.buffer);
          fs.writeFileSync(path.join(dataUploadsDir, cleanId), cloudMedia.buffer);
        } catch {}
      }
    }

    if (!media) {
      // Fallback to high-resolution aviation image
      return res.redirect(302, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80');
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(media.buffer);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      resendConfigured: Boolean(process.env.RESEND_API_KEY)
    });
  });

  // Dispatch Briefing Emails (via Resend API or Simulation)
  app.post('/api/briefing/send', async (req, res) => {
    try {
      const {
        recipients, // Array of { email: string; id?: string }
        subject,
        htmlContent,
        testMode = false
      } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum destinatário informado.' });
      }

      if (!subject || !htmlContent) {
        return res.status(400).json({ success: false, error: 'Assunto e conteúdo do e-mail são obrigatórios.' });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const senderEmail = process.env.SENDER_EMAIL || 'Alexandre Andrade Aviation <onboarding@resend.dev>';

      // If Resend API Key is configured, make real API calls
      if (resendApiKey) {
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Send in batches to respect rate limits
        for (const recipient of recipients) {
          const emailAddr = typeof recipient === 'string' ? recipient : recipient.email;
          if (!emailAddr || !emailAddr.includes('@')) continue;

          try {
            const resp = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: senderEmail,
                to: [emailAddr],
                subject: subject,
                html: htmlContent
              })
            });

            if (resp.ok) {
              successCount++;
            } else {
              const errData = await resp.json().catch(() => ({ message: 'Resend API error' }));
              failCount++;
              errors.push(`${emailAddr}: ${errData.message || resp.statusText}`);
            }
          } catch (sendErr: any) {
            failCount++;
            errors.push(`${emailAddr}: ${sendErr?.message || 'Network error'}`);
          }
        }

        return res.json({
          success: successCount > 0 || (failCount === 0 && recipients.length === 0),
          realSend: true,
          recipientCount: recipients.length,
          successCount,
          failCount,
          errors: errors.slice(0, 10),
          message: `Disparo concluído: ${successCount} e-mail(s) enviados com sucesso${failCount > 0 ? `, ${failCount} falhas.` : '.'}`
        });
      }

      // If RESEND_API_KEY is not yet configured, return successful simulated delivery
      return res.json({
        success: true,
        realSend: false,
        simulated: true,
        recipientCount: recipients.length,
        successCount: recipients.length,
        failCount: 0,
        message: `Briefing processado com sucesso para ${recipients.length} assinante(s) (Modo Simulação / Prévia). Configure RESEND_API_KEY no painel de configurações (.env) para disparo em servidores SMTP externos.`
      });
    } catch (err: any) {
      console.error('Error sending briefing:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Falha ao processar envio do briefing.'
      });
    }
  });

  // Fetch post details for Server-Side Meta & Open Graph injection (LinkedIn, Googlebot, WhatsApp)
  async function fetchPostBySlugFromFirestore(slug: string): Promise<{
    title: string;
    excerpt?: string;
    coverImage?: string;
    authorName?: string;
    date?: string;
  } | null> {
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      return null;
    }
    try {
      const databasesToTry = [
        firebaseConfig.firestoreDatabaseId,
        '(default)'
      ].filter(Boolean) as string[];

      for (const dbId of databasesToTry) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/posts?key=${firebaseConfig.apiKey}`;
          const response = await fetch(url);
          if (response.ok) {
            const data: any = await response.json();
            const docs = data?.documents || [];
            for (const doc of docs) {
              const fields = doc.fields || {};
              const docSlug = fields.slug?.stringValue;
              if (docSlug === slug) {
                return {
                  title: fields.title?.stringValue || 'Artigo Técnico',
                  excerpt: fields.excerpt?.stringValue || fields.subtitle?.stringValue || '',
                  coverImage: fields.coverImage?.stringValue || '',
                  authorName: fields.author?.mapValue?.fields?.name?.stringValue || 'Alexandre Andrade',
                  date: fields.date?.stringValue || ''
                };
              }
            }
          }
        } catch {}
      }
      return null;
    } catch {
      return null;
    }
  }

  function injectMetaIntoHtml(html: string, meta: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  }): string {
    let modified = html;
    if (meta.title) {
      const fullTitle = `${meta.title} | Alexandre Andrade`;
      modified = modified.replace(/<title>.*?<\/title>/i, `<title>${fullTitle}</title>`);
      modified = modified.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${meta.title}" />`);
      modified = modified.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${meta.title}" />`);
    }
    if (meta.description) {
      modified = modified.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${meta.description}" />`);
      modified = modified.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${meta.description}" />`);
      modified = modified.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${meta.description}" />`);
    }
    if (meta.image) {
      const absoluteImage = meta.image.startsWith('http') ? meta.image : `https://aaaviation.com.br${meta.image.startsWith('/') ? '' : '/'}${meta.image}`;
      modified = modified.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${absoluteImage}" />`);
      modified = modified.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${absoluteImage}" />`);
    }
    if (meta.url) {
      modified = modified.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${meta.url}" />`);
      modified = modified.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${meta.url}" />`);
    }
    return modified;
  }

  // Mount Vite development middleware or serve static production build with dynamic route meta
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtmlTemplate = fs.existsSync(path.join(distPath, 'index.html'))
      ? fs.readFileSync(path.join(distPath, 'index.html'), 'utf8')
      : '';

    app.use(express.static(distPath));

    app.get('*', async (req, res) => {
      const urlPath = req.path;

      // Check if this is a post route e.g. /post/:slug or /blog/:slug
      const postMatch = urlPath.match(/^\/(?:post|blog)\/([^/]+)/);
      if (postMatch && postMatch[1] && indexHtmlTemplate) {
        const slug = postMatch[1];
        const postData = await fetchPostBySlugFromFirestore(slug);
        if (postData) {
          const renderedHtml = injectMetaIntoHtml(indexHtmlTemplate, {
            title: postData.title,
            description: postData.excerpt || 'Análise Técnica de Manutenção Aeronáutica e Segurança de Voo por Alexandre Andrade.',
            image: postData.coverImage || '/logoqua.webp',
            url: `https://aaaviation.com.br${urlPath}`
          });
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(renderedHtml);
        }
      }

      // Check static known routes
      if (urlPath.startsWith('/sobre') && indexHtmlTemplate) {
        const renderedHtml = injectMetaIntoHtml(indexHtmlTemplate, {
          title: 'Sobre Alexandre Andrade | Especialista em Manutenção & SIPAER',
          description: 'Conheça a trajetória de Alexandre Andrade, especialista em manutenção aeronáutica pela FAB, inspetor ILA e investigador SIPAER.',
          url: 'https://aaaviation.com.br/sobre'
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(renderedHtml);
      }

      if (urlPath.startsWith('/contato') && indexHtmlTemplate) {
        const renderedHtml = injectMetaIntoHtml(indexHtmlTemplate, {
          title: 'Consultoria Técnica & Palestras | Contato',
          description: 'Entre em contato com Alexandre Andrade para consultoria aeronáutica em MRO, auditorias SGSO e palestras corporativas em CRM/MRM.',
          url: 'https://aaaviation.com.br/contato'
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(renderedHtml);
      }

      if (indexHtmlTemplate) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(indexHtmlTemplate);
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Alexandre Andrade Aviation server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
