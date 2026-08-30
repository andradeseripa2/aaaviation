import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlog } from '../../context/BlogContext';
import { Logo } from '../common/Logo';
import {
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Download,
  MessageSquare,
  Bookmark,
  Award,
  Sparkles
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    login,
    signup,
    loginWithGoogle,
    resetPassword
  } = useAuth();
  const { navigate } = useBlog();

  // Mode: 'login' | 'signup' | 'forgot-password'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Forgot Password Flow
    if (authMode === 'forgot-password') {
      if (!email.trim()) {
        setError('Por favor, informe seu e-mail cadastrado.');
        return;
      }
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(
          'Enviamos as instruções de redefinição para o seu e-mail! Verifique sua caixa de entrada e spam.'
        );
      } else {
        setError(res.error || 'Erro ao solicitar redefinição de senha.');
      }
      return;
    }

    // 2. Signup Flow
    if (authMode === 'signup') {
      if (password.length < 6) {
        setError('A senha deve possuir no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem. Por favor, confira os campos.');
        return;
      }

      setLoading(true);
      const res = await signup(name, email, password, title);
      setLoading(false);
      if (res.success) {
        navigate('home');
      } else {
        setError(res.error || 'Falha no cadastro.');
      }
      return;
    }

    // 3. Login Flow
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('home');
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
      navigate('home');
    } else if (!res.cancelled && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Card */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] font-['Outfit']">
            {authMode === 'login'
              ? 'Acesse sua Conta'
              : authMode === 'signup'
              ? 'Criar Conta no Portal'
              : 'Redefinir sua Senha'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            {authMode === 'login'
              ? 'Conecte-se para debater artigos técnicos e gerenciar seu perfil com segurança no Firebase.'
              : authMode === 'signup'
              ? 'Junte-se à comunidade de mantenedores, pilotos e especialistas em aviação.'
              : 'Digite seu e-mail para receber um link oficial de redefinição de senha.'}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm space-y-5">
          {/* Google Sign In Button */}
          {authMode !== 'forgot-password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#CBD5E1] hover:border-[#94A3B8] text-[#0A192F] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-3 font-['Outfit'] cursor-pointer disabled:opacity-50"
              >
                {/* Official Google Icon SVG */}
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
                <span className="bg-white px-3 text-[11px] font-mono font-bold text-[#94A3B8] uppercase">
                  Ou com e-mail e senha
                </span>
              </div>
            </div>
          )}

          {/* Member Benefits Strip */}
          <div className="p-4 bg-[#EFF6FF] border border-blue-100 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A192F] font-['Outfit'] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Vantagens da sua Conta Gratuita</span>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% Grátis
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#334155]">
              <li className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                <span>PDF Executivo para Estudo</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                <span>Comentar & Debater com IA</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Salvar Artigos Favoritos</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Insígnias de Leitor Técnico</span>
              </li>
            </ul>
          </div>

          {/* Toggle Tabs (Login vs Signup) */}
          {authMode !== 'forgot-password' ? (
            <div className="flex p-1 bg-[#F1F5F9] rounded-xl text-xs font-bold font-['Outfit']">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
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
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-[#0A192F] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Cadastrar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="text-xs font-bold text-[#0A192F] font-['Outfit']">
                Recuperação de Acesso
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
                Voltar ao Login
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup extra fields */}
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Amanda Silva"
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                    />
                    <User className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                    Título / Assinatura Profissional
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Mecânico CHT Aviônicos, Piloto Comercial, Aluno"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                E-mail *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                />
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
              </div>
            </div>

            {/* Password Field (for login and signup) */}
            {authMode !== 'forgot-password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider font-['Outfit']">
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
                      className="text-[11px] font-bold text-[#1D4ED8] hover:text-[#0E2954] hover:underline font-['Outfit'] cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authMode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-[#94A3B8] hover:text-[#0A192F] transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (for signup only) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1 font-['Outfit']">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha digitada"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0E2954]"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-1 text-[#94A3B8] hover:text-[#0A192F] transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Feedback */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Feedback */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0A192F] hover:bg-[#0E2954] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 font-['Outfit'] cursor-pointer disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Processando...'
                  : authMode === 'login'
                  ? 'Entrar na Conta'
                  : authMode === 'signup'
                  ? 'Criar Minha Conta'
                  : 'Enviar Link de Redefinição'}
              </span>
              {authMode === 'forgot-password' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
