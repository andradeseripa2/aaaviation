import { Post } from '../types';

export interface EmailTemplateOptions {
  subject: string;
  preheader?: string;
  editorGreeting?: string;
  customMessage?: string;
  posts: Post[];
  appUrl?: string;
  unsubscribeUrl?: string;
  editionNumber?: number | string;
  dateStr?: string;
}

/**
 * Converts basic markdown formatting (bold, italic, lists, quotes, links) to bulletproof clean inline HTML
 * tailored for email clients like Gmail, Outlook, Apple Mail.
 */
export function formatMarkdownForEmail(text: string): string {
  if (!text) return '';

  let html = text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Escape HTML special chars
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Markdown Headers
  html = html.replace(/^### (.*$)/gim, '<h4 style="margin: 16px 0 8px 0; font-size: 15px; font-weight: 700; color: #0A192F; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="margin: 18px 0 10px 0; font-size: 17px; font-weight: 800; color: #0A192F; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="margin: 22px 0 12px 0; font-size: 19px; font-weight: 800; color: #0A192F; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">$1</h2>');

  // Blockquotes (e.g. > Doutrina de segurança...)
  html = html.replace(/^\> (.*$)/gim, '<div style="margin: 14px 0; padding: 10px 16px; background-color: #F8FAFC; border-left: 4px solid #1D4ED8; border-radius: 4px; font-style: italic; color: #334155; font-size: 13.5px; line-height: 1.6;">$1</div>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0A192F;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em style="color: #1E293B;">$1</em>');

  // Links [Title](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #1D4ED8; font-weight: 600; text-decoration: underline;">$1</a>');

  // Unordered list items (- Item or * Item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom: 6px; padding-left: 4px; color: #334155; font-size: 14px; line-height: 1.6;">$1</li>');

  // Wrap loose <li> in <ul>
  html = html.replace(/(<li.*<\/li>(\s*<li.*<\/li>)*)/gim, '<ul style="margin: 12px 0 16px 0; padding-left: 20px; list-style-type: square; color: #1D4ED8;">$1</ul>');

  // Paragraphs (split by double linebreaks)
  const paragraphs = html.split(/\n\n+/);
  const formattedParagraphs = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul')) {
      return p;
    }
    // Convert remaining single linebreaks to <br/>
    const inner = p.replace(/\n/g, '<br/>');
    return `<p style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.7; color: #334155;">${inner}</p>`;
  });

  return formattedParagraphs.filter(Boolean).join('');
}

/**
 * Generates an executive, highly polished HTML email template for Alexandre Andrade Aviation Briefing.
 * Matches the tone, typography, and aesthetic of the blog.
 */
export function generateBriefingHtml({
  subject,
  preheader = 'Os principais destaques em manutenção aeronáutica, segurança de voo e tecnologia aeroespacial.',
  editorGreeting = 'Prezados aviadores, mecânicos e especialistas em aviação,',
  customMessage,
  posts,
  appUrl = 'https://aaaviation.com.br',
  unsubscribeUrl = '#',
  editionNumber = 'Edição Semanal',
  dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}: EmailTemplateOptions): string {
  const cleanAppUrl = (appUrl || '').replace(/\/$/, '');

  const formattedMessage = customMessage
    ? formatMarkdownForEmail(customMessage)
    : `<p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.7; color: #334155;">
        Bem-vindo à nova edição do nosso <strong style="color: #0A192F;">Briefing Semanal</strong>. Reunimos os temas mais relevantes para elevar a precisão técnica e a cultura de segurança na aviação brasileira e internacional.
      </p>`;

  const articlesHtml = posts.map(post => {
    const postUrl = `${cleanAppUrl}/post/${post.slug || post.id}`;
    const categoryBadge = (post.category || 'AVIAÇÃO').toUpperCase();
    const coverImg = post.coverImage || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80';

    return `
      <!-- ARTICLE CARD -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 6px rgba(10, 25, 47, 0.04);">
        ${coverImg ? `
        <tr>
          <td>
            <a href="${postUrl}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${coverImg}" alt="${post.title}" width="100%" style="display: block; width: 100%; max-height: 220px; object-fit: cover; border: 0;" />
            </a>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 22px 24px;">
            <!-- BADGE & READ TIME -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align: middle;">
                  <span style="display: inline-block; padding: 4px 10px; background-color: #EFF6FF; color: #1D4ED8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ${categoryBadge}
                  </span>
                  ${post.technicalBadge ? `
                    <span style="display: inline-block; margin-left: 6px; padding: 4px 8px; background-color: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${post.technicalBadge}
                    </span>
                  ` : ''}
                </td>
                <td align="right" style="vertical-align: middle; color: #64748B; font-size: 12px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ⏱️ ${post.readTimeMinutes || 5} min de leitura
                </td>
              </tr>
            </table>

            <!-- TITLE -->
            <h3 style="margin: 14px 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 1.35; color: #0A192F;">
              <a href="${postUrl}" target="_blank" style="color: #0A192F; text-decoration: none;">
                ${post.title}
              </a>
            </h3>

            <!-- EXCERPT -->
            <p style="margin: 0 0 18px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.6; color: #475569;">
              ${post.excerpt || (post.content ? post.content.substring(0, 140) + '...' : '')}
            </p>

            <!-- ACTION BUTTON -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="border-radius: 10px; background-color: #0A192F;">
                  <a href="${postUrl}" target="_blank" style="display: inline-block; padding: 10px 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px;">
                    Ler Análise Completa &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; color: #1E293B;">
  
  <!-- PREHEADER (Hidden in email body, visible in inbox summary) -->
  <div style="display: none; font-size: 1px; color: #F1F5F9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        
        <!-- MAIN CONTAINER -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(10, 25, 47, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- BRAND HEADER WITH AVIATION THEME -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A192F 0%, #0E2954 100%); padding: 36px 28px; text-align: center; border-bottom: 3px solid #F59E0B;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; margin-bottom: 8px; padding: 4px 12px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 999px;">
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 800; color: #FBBF24; text-transform: uppercase; letter-spacing: 2px;">
                        ✈️ BRIEFING SEMANAL DE AVIAÇÃO
                      </p>
                    </div>
                    <h1 style="margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.5px;">
                      ALEXANDRE ANDRADE
                    </h1>
                    <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #93C5FD; font-weight: 500;">
                      ${editionNumber} &bull; ${dateStr}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EDITORIAL OPENING MESSAGE -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 32px 20px 32px; background-color: #FFFFFF;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 800; color: #0A192F; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${editorGreeting}
              </p>
              
              <div style="margin-bottom: 24px;">
                ${formattedMessage}
              </div>

              <div style="border-top: 1px solid #E2E8F0; margin: 24px 0 20px 0;"></div>
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 18px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; color: #0A192F; text-transform: uppercase; letter-spacing: 0.8px;">
                      🔍 Artigos em Destaque Nesta Edição
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ARTICLES LIST -->
          <tr>
            <td class="mobile-padding" style="padding: 0 32px 10px 32px;">
              ${articlesHtml || `
                <p style="text-align: center; color: #64748B; padding: 24px 0; font-size: 14px;">Nenhum artigo selecionado para este briefing.</p>
              `}
            </td>
          </tr>

          <!-- SAFETY & SIPAER DOCTRINE PILLAR -->
          <tr>
            <td class="mobile-padding" style="padding: 10px 32px 28px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #F59E0B; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      🛡️ Pílula de Segurança & Fator Humano (SIPAER)
                    </h4>
                    <p style="margin: 0; font-size: 13.5px; line-height: 1.6; color: #334155; font-style: italic;">
                      "A prevenção de acidentes na aviação depende da estrita adesão aos manuais técnicos (AMM/CMM), da comunicação assertiva entre tripulação e manutenção e do relato proativo de ocorrências."
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA PORTAL ACCESS -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 28px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #0A192F;">
                Deseja acessar todo o acervo técnico, manuais e debates aeronáuticos?
              </p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #1D4ED8; box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);">
                    <a href="${cleanAppUrl}" target="_blank" style="display: inline-block; padding: 12px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; letter-spacing: 0.3px;">
                      Acessar Portal Completo &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0A192F; padding: 36px 24px; text-align: center; color: #94A3B8;">
              <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Alexandre Andrade Aviation
              </h3>
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.6; color: #94A3B8;">
                Manutenção Aeronáutica &bull; Segurança Operacional &bull; Investigação SIPAER<br/>
                Portal: <a href="${cleanAppUrl || 'https://aaaviation.com.br'}" target="_blank" style="color: #93C5FD; text-decoration: underline;">aaaviation.com.br</a>
              </p>

              <div style="border-top: 1px solid #1E293B; margin: 18px 0;"></div>

              <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #64748B;">
                Você está recebendo este briefing técnico porque se cadastrou no portal de Alexandre Andrade.<br/>
                Para gerenciar suas preferências de e-mail ou cancelar sua inscrição, <a href="${unsubscribeUrl}" target="_blank" style="color: #94A3B8; text-decoration: underline;">clique aqui</a>.
              </p>
            </td>
          </tr>

        </table>
        <!-- END CONTAINER -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
