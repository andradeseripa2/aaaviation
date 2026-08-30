import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { Star, CheckCircle, Award, Sparkles, UserCheck } from 'lucide-react';

interface PostRatingProps {
  postId: string;
}

export const PostRating: React.FC<PostRatingProps> = ({ postId }) => {
  const { ratePost, getPostRatingInfo } = useBlog();
  const { user } = useAuth();

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [justRated, setJustRated] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  const ratingInfo = getPostRatingInfo(postId);
  const userCurrentRating = user ? ratingInfo.userRating : null;
  const displayRating = hoverRating || userCurrentRating || 0;

  const handleStarClick = async (score: number) => {
    if (!user) {
      setPendingRating(score);
      setAuthModalOpen(true);
      return;
    }

    const res = await ratePost(postId, score);
    if (res.success) {
      setJustRated(score);
      setTimeout(() => setJustRated(null), 4000);
    }
  };

  const handleAuthSuccess = async () => {
    if (pendingRating) {
      await ratePost(postId, pendingRating);
      setJustRated(pendingRating);
      setPendingRating(null);
      setTimeout(() => setJustRated(null), 4000);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return 'Insuficiente / Precisa de revisão';
      case 2:
        return 'Regular';
      case 3:
        return 'Bom conteúdo técnico';
      case 4:
        return 'Muito bom / Relevante';
      case 5:
        return 'Excelente / Referência técnica!';
      default:
        return 'Selecione de 1 a 5 estrelas';
    }
  };

  return (
    <>
      <section className="my-10 p-6 sm:p-8 bg-gradient-to-br from-white to-[#F8FAFC] border border-[#CBD5E1] rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left Title & Explanation */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-xs font-bold font-['Outfit'] uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Avaliação do Artigo Técnico</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0A192F] font-['Outfit']">
              O que você achou desta análise?
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md">
              Sua avaliação ajuda outros profissionais e entusiastas a encontrar o melhor conteúdo sobre manutenção e segurança.
            </p>
          </div>

          {/* Right Star Selector & Live Score */}
          <div className="flex flex-col items-center sm:items-end space-y-2">
            {/* 5 Stars Button Row */}
            <div className="flex items-center gap-1.5 p-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
              {[1, 2, 3, 4, 5].map(starIndex => {
                const isFilled = starIndex <= (hoverRating !== null ? hoverRating : (userCurrentRating || 0));
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => handleStarClick(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 sm:p-1.5 rounded-xl hover:scale-115 transition-transform duration-150 focus:outline-hidden cursor-pointer"
                    aria-label={`Avaliar com ${starIndex} estrelas`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                          : 'text-[#CBD5E1] hover:text-[#94A3B8]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Hover / Selected Label */}
            <div className="text-[11px] font-semibold text-[#475569] font-['Outfit'] text-center sm:text-right min-h-[18px]">
              {hoverRating ? (
                <span className="text-[#1D4ED8]">{getRatingLabel(hoverRating)}</span>
              ) : userCurrentRating ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Sua nota: {userCurrentRating} de 5 estrelas
                </span>
              ) : (
                <span className="text-[#94A3B8]">Clique nas estrelas para avaliar</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Statistics Bar */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-base font-black text-[#0A192F] font-['Outfit']">
              <span className="text-amber-500 text-lg">★</span>
              <span>{ratingInfo.average.toFixed(1)}</span>
              <span className="text-xs text-[#94A3B8] font-normal font-sans">/ 5.0</span>
            </div>
            <span className="text-[#CBD5E1]">|</span>
            <span className="font-medium text-[#475569]">
              {ratingInfo.count} {ratingInfo.count === 1 ? 'avaliação de leitor' : 'avaliações de leitores'}
            </span>
          </div>

          {justRated && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 animate-in fade-in duration-300">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Avaliação de {justRated} estrelas registrada com sucesso!</span>
            </div>
          )}

          {!user && (
            <button
              onClick={() => {
                setPendingRating(5);
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:text-[#0E2954] transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faça login para salvar sua nota</span>
            </button>
          )}
        </div>
      </section>

      {/* Login / Signup Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        actionType="rating"
        title="Avaliação de Artigo Técnico"
        subtitle="Entre na sua conta ou crie uma nova para avaliar artigos técnicos com estrelas e apoiar as publicações de Alexandre Andrade."
      />
    </>
  );
};
