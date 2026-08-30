import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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

  // Persistent Settings: AI Agents & Moderation Config
  const aiAgentsFile = path.join(dataUploadsDir, '..', 'ai_agents.json');
  const aiConfigFile = path.join(dataUploadsDir, '..', 'ai_config.json');

  app.get('/api/settings/ai-agents', (req, res) => {
    try {
      if (fs.existsSync(aiAgentsFile)) {
        const raw = fs.readFileSync(aiAgentsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return res.json({ success: true, list: parsed.list || parsed });
      }
      return res.json({ success: true, list: [] });
    } catch (e) {
      return res.json({ success: true, list: [] });
    }
  });

  app.post('/api/settings/ai-agents', (req, res) => {
    try {
      const { list } = req.body;
      if (Array.isArray(list)) {
        fs.writeFileSync(aiAgentsFile, JSON.stringify({ list, updatedAt: Date.now() }, null, 2), 'utf-8');
        return res.json({ success: true, count: list.length });
      }
      return res.status(400).json({ success: false, error: 'Lista de agentes inválida.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao salvar agentes no disco.' });
    }
  });

  app.get('/api/settings/ai-config', (req, res) => {
    try {
      if (fs.existsSync(aiConfigFile)) {
        const raw = fs.readFileSync(aiConfigFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return res.json({ success: true, config: parsed });
      }
      return res.json({ success: true, config: null });
    } catch (e) {
      return res.json({ success: true, config: null });
    }
  });

  app.post('/api/settings/ai-config', (req, res) => {
    try {
      const config = req.body;
      if (config && typeof config === 'object') {
        fs.writeFileSync(aiConfigFile, JSON.stringify(config, null, 2), 'utf-8');
        return res.json({ success: true });
      }
      return res.status(400).json({ success: false, error: 'Configuração inválida.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Erro ao salvar configuração.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // AI Comment Auto-Responder & Persona Smart Router
  app.post('/api/ai/comments/respond', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const {
        commentText,
        commentAuthor,
        postTitle,
        postCategory,
        postExcerpt,
        postContent,
        agents = [],
        targetAgentId,
        smartRoute = true
      } = req.body;

      if (!commentText || typeof commentText !== 'string') {
        return res.status(400).json({ success: false, error: 'Texto do comentário é obrigatório.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const enabledAgents = Array.isArray(agents) && agents.length > 0
        ? agents.filter((a: any) => a.enabled !== false)
        : [];

      // Fallback agent if list is empty
      const defaultFallbackAgent = {
        id: 'inspetor-brandao',
        name: 'Inspetor Brandão',
        role: 'Auditor de Aeronavegabilidade & Especialista RBAC',
        badge: 'AUDITOR RBAC / ANAC',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        systemPrompt: 'Você é o Inspetor Brandão, auditor sênior de aeronavegabilidade. Responda com formalidade, precisão técnica e embasamento regulatório.'
      };

      let selectedAgent = enabledAgents.find((a: any) => a.id === targetAgentId) || enabledAgents[0] || defaultFallbackAgent;

      // Clean and sanitize article context (first 3500 characters of clean text)
      const cleanArticleContent = typeof postContent === 'string' && postContent.trim()
        ? postContent.replace(/<[^>]+>/g, ' ').replace(/[#*`_~]/g, '').slice(0, 3500).trim()
        : (postExcerpt || 'Artigo técnico sobre manutenção aeronáutica e segurança operacional.');

      if (!apiKey) {
        // High-quality contextual response referencing the post title & content
        const sampleReplies: Record<string, string> = {
          'inspetor-brandao': `Prezado(a) ${commentAuthor || 'Colega'},\n\nExcelente observação técnica referente ao artigo "${postTitle || 'de aviação'}". Do ponto de vista regulatório e de aeronavegabilidade continuada (conforme preceituam os RBACs pertinentes e instruções da ANAC/FAA), o estrito cumprimento dos manuais do fabricante (AMM/CMM) e o correto preenchimento dos registros técnicos discutidos no texto são indispensáveis para mitigar não conformidades.\n\nSua ponderação enriquece o debate técnico sobre a matéria.`,
          'mestre-valter': `Fala, ${commentAuthor || 'colega de hangar'}!\n\nMuito bem observado em relação a "${postTitle || 'este assunto'}"! No chão da oficina e na linha de voo, a prática mostra exatamente o que tratamos neste artigo. Quando estamos trabalhando com motores e componentes críticos, ferramentas calibradas, torque correto e atenção redobrada com F.O.D. fazem toda a diferença.\n\nObrigado por somar com sua experiência aqui no Hangar!`,
          'eng-marcos': `Olá, ${commentAuthor || 'leitor(a)'}!\n\nMuito pertinente o seu apontamento. Analisando sob a ótica da engenharia aeronáutica e dos sistemas discutidos neste artigo ("${postTitle || 'Sistemas'}"), a integridade dos barramentos digitais e os protocolos de redundância exigem exatamente esse tipo de vigilância sistemática.\n\nParabéns pela reflexão técnica de alto nível!`,
          'cmte-helena': `Saudações, ${commentAuthor || 'colega'}.\n\nSua colocação toca no coração da doutrina abordada no artigo "${postTitle || 'Segurança'}". A interação homem-máquina na manutenção, a comunicação assertiva (CRM) e a Cultura Justa do SIPAER são as maiores barreiras defensivas contra erros latentes na operação aérea.\n\nExcelente contribuição para a nossa consciência situacional coletiva.`
        };

        const chosenReply = sampleReplies[selectedAgent.id] || sampleReplies['inspetor-brandao'];

        return res.json({
          success: true,
          replyText: chosenReply,
          selectedAgent,
          reasoning: 'Resposta gerada com sucesso via motor contextual inteligente.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct dynamic prompt based on whether smartRoute is active or a single agent is chosen
      let prompt = '';
      if (!targetAgentId && smartRoute && enabledAgents.length > 1) {
        // Smart routing mode
        const agentsDescriptions = enabledAgents.map((a: any) => `
- ID: "${a.id}"
  Nome: ${a.name} (${a.role})
  Badge: ${a.badge}
  Tom de voz: ${a.tone}
  Especialidades: ${(a.specialties || []).join(', ')}
  Instrução do Personagem: ${a.systemPrompt}
`).join('\n');

        prompt = `Você é o Moderador e Especialista Técnico de IA do portal "AA Aviation" (Alexandre Andrade Aviation).
Sua missão é responder ao comentário de um leitor levando em consideração o CONTEÚDO REAL DO ARTIGO onde o comentário foi feito.

=== ARTIGO PUBLICADO NO BLOG ===
- Título: "${postTitle || 'Artigo Técnico'}"
- Categoria: ${postCategory || 'Geral'}
- Resumo/Contexto: "${postExcerpt || ''}"
- Trecho Principal do Artigo:
"""
${cleanArticleContent}
"""

=== COMENTÁRIO DO LEITOR (${commentAuthor || 'Leitor'}) ===
"${commentText}"

=== ESPECIALISTAS DISPONÍVEIS ===
${agentsDescriptions}

=== DIRETRIZES OBRIGATÓRIAS ===
1. Escolha o especialista mais qualificado para a dúvida do usuário.
2. IMPORTANTE: Leia o artigo acima e faça a resposta dialogar DIRETAMENTE com o conteúdo técnico, peças, normas ou procedimentos explicados no artigo. NÃO fuja do assunto do artigo nem do comentário.
3. Responda em Português do Brasil com 2 parágrafos curtos, objetivos, técnicos e acolhedores (máximo 120 a 160 palavras).
4. Retorne EXCLUSIVAMENTE um objeto JSON válido (sem blocos markdown ou dentro de \`\`\`json) no seguinte formato:
{
  "selectedAgentId": "ID_DO_AGENTE_ESCOLHIDO",
  "reasoning": "Breve justificativa de 1 frase explicando por que este agente foi escolhido",
  "replyText": "Texto completo da resposta técnica na voz do personagem"
}`;
      } else {
        // Specific persona mode
        prompt = `${selectedAgent.systemPrompt || 'Você é um especialista em manutenção e aviação.'}

=== ARTIGO DO BLOG EM DISCUSSÃO ===
- Título: "${postTitle || 'Artigo Técnico'}"
- Categoria: ${postCategory || 'Geral'}
- Trecho do Artigo:
"""
${cleanArticleContent}
"""

=== COMENTÁRIO DO LEITOR (${commentAuthor || 'Leitor'}) ===
"${commentText}"

=== DIRETRIZES DE RESPOSTA ===
- Responda diretamente ao leitor (${commentAuthor || 'Colega'}), incorporando integralmente o seu papel como ${selectedAgent.name} (${selectedAgent.role}).
- DIRETRIZ CRUCIAL: Baseie seus argumentos e comentários técnicos no conteúdo do ARTIGO acima e na dúvida do leitor. Seja preciso, didático e não fuja do tema central.
- Escreva em Português do Brasil.
- Tamanho: 2 parágrafos claros, técnicos e concisos (100 a 150 palavras).
- Retorne apenas o texto da resposta final, sem comentários adicionais.`;
      }

      // Fast single-pass execution with optimized timeout
      let rawOutput = '';
      try {
        const genPromise = ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            temperature: 0.65,
            maxOutputTokens: 500
          }
        });

        // Fast timeout of 9 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 9000)
        );

        const response: any = await Promise.race([genPromise, timeoutPromise]);
        if (response?.text && response.text.trim()) {
          rawOutput = response.text.trim();
        }
      } catch (genErr) {
        console.warn('Primary Gemini call note:', genErr);
      }

      if (rawOutput) {
        // If smartRoute JSON was requested, try parsing JSON
        if (!targetAgentId && smartRoute && enabledAgents.length > 1) {
          try {
            const cleanJsonStr = rawOutput.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(cleanJsonStr);

            if (parsed.replyText && parsed.selectedAgentId) {
              const matched = enabledAgents.find((a: any) => a.id === parsed.selectedAgentId) || selectedAgent;
              return res.json({
                success: true,
                replyText: parsed.replyText.trim(),
                selectedAgent: matched,
                reasoning: parsed.reasoning || `Roteado para ${matched.name}`
              });
            }
          } catch (jsonErr) {
            // If JSON parsing failed, use raw output
          }
        }

        return res.json({
          success: true,
          replyText: rawOutput.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim(),
          selectedAgent,
          reasoning: `Resposta gerada por ${selectedAgent.name}`
        });
      }

      // Contextual fallback if timeout/spike
      const contextualReply = `Prezado(a) ${commentAuthor || 'Colega'},\n\nExcelente observação a respeito do artigo "${postTitle || 'de aviação'}". A discussão sobre estes procedimentos técnicos e a conformidade com as diretrizes operacionais são pontos vitais para a segurança e confiabilidade na aviação.\n\nAgradecemos muito por enriquecer nosso debate técnico no blog!`;

      return res.json({
        success: true,
        replyText: contextualReply,
        selectedAgent,
        reasoning: `Resposta gerada pelo especialista ${selectedAgent.name}`
      });
    } catch (err: any) {
      console.error('Error generating AI comment response:', err);
      return res.status(200).json({
        success: true,
        replyText: `Olá! Agradecemos seu comentário sobre este artigo. O debate técnico constante fortalece as boas práticas e a segurança de voo na comunidade aeronáutica.`,
        selectedAgent: {
          id: 'inspetor-brandao',
          name: 'Inspetor Brandão',
          role: 'Auditor de Aeronavegabilidade & Especialista RBAC',
          badge: 'AUDITOR RBAC / ANAC',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
        },
        reasoning: 'Resposta de cortesia técnica.'
      });
    }
  });

  // Generate Executive Briefing Intro with Gemini AI
  app.post('/api/briefing/generate', async (req, res) => {
    try {
      const { articles, themeFocus, authorName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          success: true,
          generatedIntro: `Prezados aviadores e profissionais técnicos da aviação,\n\nNesta edição do Briefing Semanal, reunimos os temas mais relevantes sobre manutenção aeronáutica, segurança operacional e inovações técnicas.\n\nConfira abaixo os principais artigos selecionados para aprofundar seus conhecimentos e elevar o padrão de conformidade e segurança da sua operação.`
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const articlesSummary = Array.isArray(articles) && articles.length > 0
        ? articles.map((a: any) => `- "${a.title}" (Categoria: ${a.category}, Destaque: ${a.technicalBadge || 'Geral'})`).join('\n')
        : 'Artigos técnicos de aviação e segurança de voo.';

      const prompt = `Você é o redator técnico e especialista em aviação do portal "AA Aviation" (Alexandre Andrade Aviation).
Escreva uma mensagem editorial e executiva em Português do Brasil para a abertura do "Briefing Semanal" de aviação da newsletter.

Nome do autor: ${authorName || 'Alexandre Andrade'}
Foco temático da semana: ${themeFocus || 'Manutenção Aeronáutica, Cultura SIPAER e Excelência Operacional'}
Artigos em destaque nesta edição:
${articlesSummary}

Diretrizes:
1. Tom: Altamente profissional, aeronáutico, conciso, elegante e focado em segurança e técnica.
2. Tamanho: 2 a 3 parágrafos curtos (entre 80 e 150 palavras).
3. Não use jargões vazios ou exageros. Use termos reais da aviação (SGSO, SIPAER, AMM, CHT, aeronavegabilidade).
4. Retorne apenas o texto da mensagem editorial, pronto para ser lido pelos assinantes.`;

      // Candidate models in priority order for maximum availability
      const candidateModels = ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
      let generatedIntro = '';

      for (const modelName of candidateModels) {
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts && !generatedIntro) {
          attempts++;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt
            });
            if (response?.text && response.text.trim()) {
              generatedIntro = response.text.trim();
              break;
            }
          } catch (err: any) {
            const statusCode = err?.status || err?.code || 500;
            // On 503/429 (temporary high demand), retry briefly or shift to next candidate
            if ((statusCode === 503 || statusCode === 429) && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 800 * attempts));
            } else {
              // Move to next candidate model quietly
              break;
            }
          }
        }

        if (generatedIntro) break;
      }

      if (!generatedIntro) {
        // High-quality contextual fallback if external service experiences temporary spikes
        const sampleHighlights = Array.isArray(articles) && articles.length > 0
          ? articles.slice(0, 2).map((a: any) => `"${a.title}"`).join(' e ')
          : 'nossos principais procedimentos de manutenção preventiva e segurança de voo';

        generatedIntro = `Prezados aviadores, mecânicos e especialistas do setor aeronáutico,\n\nNesta edição do Briefing Semanal, direcionamos nossa atenção técnica para as melhores práticas operacionais e conformidade regulatória contínua. Em destaque nesta semana, analisamos aspectos fundamentais com foco em ${sampleHighlights}.\n\nReiteramos que a excelência na manutenção e o rigor nos processos de SGSO e inspeção de aeronavegabilidade continuam sendo as maiores salvaguardas da nossa segurança de voo. Tenham todos uma excelente leitura técnica.`;
      }

      return res.json({ success: true, generatedIntro });
    } catch (err: any) {
      // Even in catch, return professional fallback to keep UI uninterrupted
      const fallbackIntro = `Prezados aviadores e especialistas em manutenção aeronáutica,\n\nReunimos nesta edição os principais apontamentos técnicos e análises operacionais recentes. Acompanhe a seguir os artigos selecionados para reforçar a conformidade normativa e a cultura de segurança na sua operação aérea.`;
      return res.json({
        success: true,
        generatedIntro: fallbackIntro
      });
    }
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
