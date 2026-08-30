import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { FileText, AlertTriangle, ShieldCheck, ArrowLeft, Mail } from 'lucide-react';

export const TermsOfUsePage: React.FC = () => {
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
            <FileText className="w-3.5 h-3.5" />
            Condições Gerais de Uso
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A192F] dark:text-white font-['Outfit'] tracking-tight">
            Termos de Uso & Isenção de Responsabilidade
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} • Portal Técnico de Aviação e Segurança de Voo.
          </p>
        </div>

        {/* Content sections */}
        <div className="space-y-6 text-sm text-[#334155] dark:text-slate-300 leading-relaxed font-sans">
          {/* 1. Finalidade Educacional */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">1</span>
              Finalidade Exclusivamente Educacional e Doutrinária
            </h2>
            <p>
              Todo o conteúdo publicado no portal <strong>Alexandre Andrade Aviation (aaaviation.com.br)</strong> — incluindo artigos técnicos, fluxogramas, estudos de caso SIPAER, análises de acidentes, checklists e dados de regulamentação (RBAC, ANAC, FAA, ICAO) — possui finalidade <strong>estritamente educativa, doutrinária e informativa</strong>.
            </p>
          </section>

          {/* 2. Aviso Institucional e Não-Substituição de Manuais */}
          <section className="space-y-3 p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              2. Prevalência dos Manuais Oficiais do Fabricante
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Em nenhuma hipótese os artigos deste blog substituem ou alteram a documentação técnica oficial atualizada das aeronaves. Para qualquer intervenção de manutenção, despacho ou operação real:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li>Consulte sempre o <strong>AMM (Aircraft Maintenance Manual)</strong>, <strong>CMM</strong>, <strong>IPC</strong>, <strong>SRM</strong>, <strong>AFM/POH</strong> e as <strong>Diretrizes de Aeronavegabilidade (ADs/DA)</strong> vigentes emitidas pelos órgãos competentes (ANAC/FAA/EASA).</li>
              <li>As opiniões, análises e reflexões aqui emitidas são de caráter pessoal do autor e <strong>não representam posicionamento oficial</strong> do CENIPA, Força Aérea Brasileira (FAB), ANAC ou qualquer fabricante aeronáutico.</li>
            </ul>
          </section>

          {/* 3. Propriedade Intelectual */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">3</span>
              Propriedade Intelectual e Citação de Conteúdo
            </h2>
            <p>
              Os textos originais, ilustrações didáticas e gráficos conceituais são de autoria de Alexandre Andrade. É permitida a citação parcial de trechos para fins acadêmicos e de debate técnico, desde que acompanhada de créditos explícitos com link direto para o artigo correspondente. É vedada a cópia integral ou reprodução comercial não autorizada.
            </p>
          </section>

          {/* 4. Conduta nos Comentários */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300 flex items-center justify-center text-xs font-mono font-bold">4</span>
              Regras da Comunidade Hangar (Comentários)
            </h2>
            <p>
              Valorizamos o debate técnico e a cultura justa (Just Culture). Comentários que contenham ofensas pessoais, spam, propaganda não autorizada ou dados sensíveis serão moderados e removidos pela equipe de administração.
            </p>
          </section>

          {/* 5. Contato */}
          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-[#0A192F] dark:text-white font-['Outfit'] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
              5. Contato e Esclarecimentos
            </h2>
            <p>
              Em caso de dúvidas a respeito destes Termos de Uso, entre em contato através de nossa página oficial ou pelo e-mail: <strong className="text-blue-600 dark:text-blue-400 font-mono">{contactEmail}</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
