import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Mail, CheckCircle2, Send } from 'lucide-react';

interface NewsletterSectionProps {
  variant?: 'card' | 'banner';
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ variant = 'banner' }) => {
  const { subscribeNewsletter } = useBlog();
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const res = await subscribeNewsletter(email);
    setFeedback(res);
    if (res.success) {
      setEmail('');
    }
  };

  if (variant === 'card') {
    return (
      <div className="p-6 bg-white dark:bg-[#0B1528] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-[#0A192F] dark:text-white">
          <Mail className="w-5 h-5 text-[#1D4ED8] dark:text-blue-400" />
          <h4 className="font-extrabold text-base font-['Outfit']">Newsletter Técnica</h4>
        </div>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4 leading-relaxed">
          Receba boletins semanais com estudos de caso e atualizações regulatórias.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Seu email corporativo"
            required
            className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
          />
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#0A192F] dark:bg-blue-600 hover:bg-[#0E2954] dark:hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors font-['Outfit'] cursor-pointer"
          >
            Inscrever-se
          </button>
        </form>

        {feedback && (
          <p className={`mt-2 text-xs ${feedback.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {feedback.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      id="newsletter-section"
      className="relative overflow-hidden bg-white dark:bg-[#0B1528] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl md:rounded-3xl p-6 sm:p-10 shadow-xs transition-colors"
    >
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <div className="p-2 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0A192F] dark:text-white font-['Outfit']">
              Briefing Semanal
            </h3>
          </div>
          <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
            Receba as últimas análises técnicas, estudos de caso de segurança e novidades do mundo da aviação diretamente na sua caixa de entrada. Sem spam.
          </p>
        </div>

        <div className="lg:col-span-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
              className="flex-1 px-4 py-3 text-sm bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954] dark:focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#0E2954] dark:bg-blue-600 hover:bg-[#172554] dark:hover:bg-blue-500 text-white text-sm font-bold tracking-wide rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer"
            >
              <span>Inscrever-se</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          {feedback && (
            <div
              className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                feedback.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {feedback.success && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
