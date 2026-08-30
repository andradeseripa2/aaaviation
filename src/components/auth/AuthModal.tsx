import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  User,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Download,
  Bookmark,
  Sparkles,
  Award
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  actionType?: 'rating' | 'reply' | 'comment' | 'pdf' | 'bookmark' | 'general';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  actionType = 'general'
}) => {
  const {
    login,
    signup,
    loginWithGoogle,
    resetPassword
  } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [userTitle, setUserTitle] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const defaultTitle =
    actionType === 'pdf'
      ? 'Baixar Artigo em PDF Executivo'
      : actionType === 'rating'
      ? 'Faça login para avaliar'
      : actionType === 'reply'
      ? 'Faça login para responder'
      : actionType === 'bookmark'
      ? 'Faça login para salvar artigos'
      : 'Acesse ou Crie sua Conta Grátis';

  const defaultSubtitle =
    actionType === 'pdf'
      ? 'O download de artigos técnicos em PDF executivo limpo é um recurso exclusivo e 100% gratuito para leitores cadastrados.'
      : actionType === 'rating'
      ? 'Avaliações de artigos técnicos são gravadas com segurança e exclusivas para membros cadastrados.'
      : actionType === 'reply'
      ? 'Participe do debate técnico e responda aos comentários dos especialistas.'
      : actionType === 'bookmark'
      ? 'Salve artigos para leitura posterior sincronizados em todos os seus dispositivos.'
      : 'Crie sua conta gratuita em menos de 1 minuto para ter acesso a todos os recursos do portal.';

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (authMode === 'forgot-password') {
      if (!email.trim()) {
        setError('Por favor, informe seu e-mail cadastrado.');
        return;
      }
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Enviamos o link de redefinição de senha para seu e-mail!');
      } else {
        setError(res.error || 'Erro ao solicitar redefinição.');
      }
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 dígitos.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      setLoading(true);
      const res = await signup(name, email, password, userTitle);
      setLoading(false);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Falha no cadastro.');
      }
      return;
    }

    // Login mode
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Falha ao autenticar.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else if (!res.cancelled && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header with Close */}
        <div className="relative p-5 sm:p-6 pb-4 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-[#E2E8F0] shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#64748B] hover:text-[#0A192F] hover:bg-[#E2E8F0] rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#EFF6FF] text-[#1D4ED8] rounded-xl shrink-0">
              {actionType === 'pdf' ? (
                <Download className="w-5 h-5 text-[#1D4ED8]" />
              ) : actionType === 'rating' ? (
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              ) : actionType === 'bookmark' ? (
                <Bookmark className="w-5 h-5 fill-amber-400 text-amber-500" />
              ) : (
                <MessageSquare className="w-5 h-5 text-[#1D4ED8]" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#0A192F] font-['Outfit'] leading-tight">
                {title || defaultTitle}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-[#1D4ED8] uppercase tracking-wider">
                  Alexandre Andrade Aviation
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                  100% Gratuito
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Member Benefits Strip */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A192F] font-['Outfit'] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Vantagens da sua Conta Gratuita</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#334155]">
              <li className="flex items-center gap-1.5">
                <Download className="w-3 h-3 text-[#1D4ED8] shrink-0" />
                <span>PDF Executivo para Estudo</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#1D4ED8] shrink-0" />
                <span>Comentar & Debater com IA</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Bookmark className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Salvar Artigos Favoritos</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="w-3 h-3 text-purple-600 shrink-0" />
                <span>Insígnias de Leitor Técnico</span>
              </li>
            </ul>
          </div>

          {/* Google Sign in Button */}
          {authMode !== 'forgot-password' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0A192F] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2.5 font-['Outfit'] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {googleLoading
                    ? 'Conectando ao Google...'
                    : authMode === 'login'
                    ? 'Entrar com o Google'
                    : 'Cadastrar com o Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E2E8F0] w-full" />
                <span className="bg-white px-2 text-[10px] font-mono font-bold text-[#94A3B8] uppercase">
                  Ou e-mail
                </span>
              </div>
            </div>
          )}

          {/* Toggle Tabs */}
          {authMode !== 'forgot-password' ? (
            <div className="flex p-1 bg-[#F1F5F9] rounded-xl text-xs font-bold font-['Outfit']">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-[#0A192F] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-[#0A192F] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Cadastrar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="text-xs font-bold text-[#0A192F] font-['Outfit']">
                Redefinir Senha
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#1D4ED8] hover:underline font-bold font-['Outfit'] cursor-pointer"
              >
                Voltar
              </button>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Carlos Santana"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                    />
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                    Especialidade / Título
                  </label>
                  <input
                    type="text"
                    value={userTitle}
                    onChange={e => setUserTitle(e.target.value)}
                    placeholder="Ex: Mecânico CHT, Piloto, Estudante"
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                E-mail *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                />
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
              </div>
            </div>

            {authMode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider font-['Outfit']">
                    Senha *
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot-password');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] font-bold text-[#1D4ED8] hover:underline font-['Outfit'] cursor-pointer"
                    >
                      Esqueci senha
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authMode === 'signup' ? 'Mínimo 6 dígitos' : '••••••••'}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 p-1 text-[#94A3B8] hover:text-[#0A192F] cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2 p-1 text-[#94A3B8] hover:text-[#0A192F] cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Processando...'
                  : authMode === 'login'
                  ? 'Entrar e Continuar'
                  : authMode === 'signup'
                  ? 'Cadastrar e Continuar'
                  : 'Enviar Link de Redefinição'}
              </span>
              {authMode === 'forgot-password' ? (
                <KeyRound className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
