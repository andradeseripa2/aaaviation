import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlog } from '../../context/BlogContext';
import {
  Award,
  BookmarkCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserPlus,
  Compass,
  CheckCircle2,
  Download
} from 'lucide-react';
import { AVAILABLE_BADGES } from '../../data/badgesData';
import { BadgePill } from '../common/BadgePill';

export const CommunityHangarCta: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useBlog();

  // If user is already logged in, show a friendly status card with their badges preview
  if (user) {
    return (
      <section className="mb-14 rounded-2xl md:rounded-3xl bg-linear-to-br from-[#0A192F] via-[#0E2954] to-[#07122A] text-white p-6 sm:p-8 border border-blue-900/60 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-amber-400 text-xs font-bold uppercase font-mono tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hangar Ativo &bull; Membro Credenciado</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Outfit']">
              Bem-vindo de volta, {user.name}!
            </h3>
            <p className="text-sm text-slate-300">
              Seu hangar técnico está liberado. Salve matérias, participe dos debates com sua credencial técnica e conquiste novas insígnias de voo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('profile')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0A192F] hover:bg-slate-100 text-xs font-bold tracking-wide transition-all shadow-sm font-['Outfit'] cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Ver Minhas Insígnias & Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('bookmarks')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900/60 hover:bg-blue-800/60 text-white text-xs font-bold tracking-wide border border-blue-700/60 transition-all font-['Outfit'] cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4 text-blue-300" />
              <span>Meus Salvos</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Not logged in -> Show high-conversion Hangar Community CTA
  const highlightBadges = AVAILABLE_BADGES.slice(0, 4);

  return (
    <section className="mb-16 rounded-3xl bg-linear-to-br from-[#070F1E] via-[#0A192F] to-[#0E2954] text-white p-6 sm:p-10 lg:p-12 border border-blue-900/50 shadow-xl relative overflow-hidden">
      {/* Aerodynamic background glow & line grid */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Pitch & Benefits */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-amber-400 text-xs font-bold font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Comunidade Técnica de Aviação</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit'] tracking-tight leading-tight">
            Faça parte do <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-sky-300 to-amber-300">Hangar de Especialistas</span>
          </h3>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Crie sua conta gratuita em segundos para elevar sua experiência técnica, interagir com quem vive a linha de voo e construir sua reputação doutrinária.
          </p>

          {/* Core Member Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <div className="w-6 h-6 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
                <Download className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white font-['Outfit']">PDF Executivo</h4>
              <p className="text-[11px] text-slate-400 leading-tight">Downloads limpos para estudo offline e impressão.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <div className="w-6 h-6 rounded-lg bg-sky-600/30 flex items-center justify-center text-sky-400">
                <BookmarkCheck className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white font-['Outfit']">Acervo & Salvos</h4>
              <p className="text-[11px] text-slate-400 leading-tight">Guarde relatórios para consulta em hangar.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white font-['Outfit']">Debates & IA</h4>
              <p className="text-[11px] text-slate-400 leading-tight">Comente e debata com especialistas de IA.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <div className="w-6 h-6 rounded-lg bg-amber-600/30 flex items-center justify-center text-amber-400">
                <Award className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white font-['Outfit']">Insígnias de Voo</h4>
              <p className="text-[11px] text-slate-400 leading-tight">Desbloqueie condecorações técnicas.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-blue-500/25 font-['Outfit'] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta Gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-sm font-bold border border-slate-700 transition-all font-['Outfit'] cursor-pointer"
            >
              <span>Já tenho conta</span>
            </button>
          </div>
        </div>

        {/* Right Side: Badges Preview Showcase */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase font-['Outfit'] tracking-wider text-slate-200">
                Insígnias Desbloqueáveis
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
              CONQUISTAS
            </span>
          </div>

          <div className="space-y-3">
            {highlightBadges.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-['Outfit']">{b.name}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{b.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                  {b.rarity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Interaja com artigos para desbloquear</span>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 cursor-pointer font-['Outfit']"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
