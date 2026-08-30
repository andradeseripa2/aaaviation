import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Shield, Lock, FileText, CheckCircle, Cookie, ArrowLeft, Mail } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { navigate, contactInfo } = useBlog();
  const contactEmail = contactInfo?.email || 'contato@aaaviation.com.br';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#1D4ED8] dark:text-blue-400 hover:underline mb-6 cursor-pointer font-['Outfit']"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para a Página Inicial</span>
      </button>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#070F1E] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs space-y-8">
        {/* Header */}
        <div className="border-b border-[#F1F5F9] dark:border-slate-800 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 text-xs font-bold font-['Outfit'] uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Transparência & Conformidade Legal
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
            Política de Privacidade & Proteção de Dados
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} • Em total conformidade com a LGPD (Lei nº 13.709/2018), GDPR e Diretrizes do Google AdSense.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-[#334155] dark:text-slate-300 leading-relaxed font-sans">
          {/* 1. Introdução */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">1</span>
              Introdução e Compromisso
            </h2>
            <p>
              O portal <strong>Alexandre Andrade Aviation (aaaviation.com.br)</strong>, mantido pelo especialista Alexandre Andrade, tem o compromisso de proteger a privacidade, a integridade e os dados pessoais de todos os seus leitores, assinantes e visitantes. Esta Política descreve como coletamos, armazenamos, utilizamos e protegemos suas informações de acordo com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e as normas internacionais de navegação segura.
            </p>
          </section>

          {/* 2. Google AdSense e Cookies de Terceiros */}
          <section className="space-y-3 p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <Cookie className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              2. Google AdSense, Cookies e Publicidade Personalizada
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Nosso site utiliza os serviços do <strong>Google AdSense</strong> para a exibição de anúncios publicitários contextuais e relevantes. Conforme as diretrizes obrigatórias do Google:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li>
                <strong>Cookies de Terceiros:</strong> Fornecedores terceiros, incluindo o Google, usam cookies para veicular anúncios com base em visitas anteriores dos usuários a este ou a outros websites na internet.
              </li>
              <li>
                <strong>Cookie DART:</strong> Com o uso de cookies de publicidade, o Google e seus parceiros podem veicular anúncios para os usuários com base nas visitas feitas a este site e/ou a outros sites na Internet.
              </li>
              <li>
                <strong>Desativação de Anúncios Personalizados:</strong> Os usuários podem desativar a publicidade personalizada acessando as <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] dark:text-blue-400 font-semibold underline">Configurações de Anúncios do Google</a>. Alternativamente, você pode desativar o uso de cookies de terceiros para publicidade personalizada visitando o portal <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-[#1D4ED8] dark:text-blue-400 font-semibold underline">www.aboutads.info</a>.
              </li>
              <li>
                <strong>Transparência de Rede:</strong> Não realizamos veiculação de anúncios em páginas sem conteúdo editorial próprio, telas de login ou telas restritas.
              </li>
            </ul>
          </section>

          {/* 3. Dados Coletados */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">3</span>
              Dados Coletados e Finalidades
            </h2>
            <p>Coletamos apenas as informações estritamente necessárias para a melhor experiência técnica:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-xs text-[#0A192F] dark:text-white mb-1">Newsletter & Briefing Semanal</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Apenas o endereço de e-mail fornecido voluntariamente pelo usuário para receber as edições técnicas aos sábados. Cancelamento com 1 clique a qualquer momento.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-xs text-[#0A192F] dark:text-white mb-1">Comentários & Comunidade Hangar</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Nome, e-mail e título técnico (opcional) para identificação nas discussões e moderação técnica anti-spam.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Direitos do Titular (LGPD) */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">4</span>
              Seus Direitos como Titular dos Dados (Art. 18 LGPD)
            </h2>
            <p>Você tem total direito de, a qualquer momento e gratuitamente:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar seus dados armazenados (e-mail, comentários, avaliações).</li>
              <li>Solicitar a correção de dados incompletos ou inexatos.</li>
              <li>Solicitar a exclusão completa e definitiva dos seus dados de nossa base de e-mails ou banco de dados.</li>
            </ul>
          </section>

          {/* 5. Segurança da Informação */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">5</span>
              Segurança e Armazenamento
            </h2>
            <p>
              Utilizamos criptografia ponta a ponta (SSL/HTTPS certificado de 256 bits), bancos de dados seguros e nunca vendemos, alugamos ou comercializamos informações pessoais de leitores com quaisquer terceiros.
            </p>
          </section>

          {/* 6. Encarregado de Dados e Contato */}
          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
              6. Contato com o Responsável / DPO
            </h2>
            <p>
              Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos da LGPD, entre em contato direto pelo e-mail:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0A192F] dark:text-white block font-['Outfit']">
                  Alexandre Andrade Aviation
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">{contactEmail}</span>
              </div>
              <button
                onClick={() => navigate('contact')}
                className="px-4 py-2 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors font-['Outfit'] cursor-pointer"
              >
                Página de Contato
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
