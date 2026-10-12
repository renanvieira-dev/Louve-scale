import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, Music, Calendar, Check } from 'lucide-react';
import Logo from './Logo';
import { authService } from '../services/authService';

const AVAILABLE_ROLES = [
  'Vocal / Ministro(a)',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado / Piano',
  'Bateria',
  'Mídia / Projeção',
  'Técnico de Som'
];

export default function AuthModal({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['Vocal / Ministro(a)']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // manter pelo menos 1
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName, selectedRoles, birthDate);
      } else {
        await authService.signIn(email, password);
      }
      const currentUser = await authService.getCurrentUser();
      onLoginSuccess(currentUser);
    } catch (err) {
      setErrorMsg(err.message || 'Erro durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      await authService.signInWithGoogle(selectedRoles);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao conectar com Google.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Identidade Visual com Logo SVG */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={52} className="shadow-lg shadow-[#a3e635]/20 rounded-2xl mb-3" />
          <h2 className="text-xl font-extrabold text-white">LouveScale</h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isSignUp ? 'Cadastre-se na equipe de louvor' : 'Acesse suas escalas e repertórios'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Seleção de Múltiplas Funções */}
        {isSignUp && (
          <div className="mb-4 p-3.5 bg-[#0b0d0c] border border-zinc-800/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#a3e635]" />
                O que você toca ou faz na equipe?
              </label>
              <span className="text-[10px] text-zinc-500">Marque todas</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#a3e635]/15 border border-[#a3e635] text-[#a3e635]'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{role}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#a3e635] flex-shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão de Login com o Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mb-4 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
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
          Continuar com o Google
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-zinc-800 w-full"></div>
          <span className="bg-[#131614] px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider absolute">
            ou com e-mail
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    required
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Data de Nascimento (para o mural)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    required
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                required
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#a3e635] hover:bg-[#b5f448] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSignUp ? 'Cadastrar na Equipe' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-xs text-zinc-400 hover:text-[#a3e635] transition-colors cursor-pointer"
          >
            {isSignUp ? 'Já tem cadastro? Entrar' : 'Primeiro acesso? Crie sua conta com suas funções'}
          </button>
        </div>

      </div>
    </div>
  );
}