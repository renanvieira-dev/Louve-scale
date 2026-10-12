import React from 'react';
import { LogOut, Shield, User } from 'lucide-react';
import Logo from './Logo';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery, 
  currentUser, 
  onLogout 
}) {
  const isAdmin = currentUser?.profile?.role === 'admin';

  return (
    <header className="w-full flex flex-col gap-3 sm:gap-4">
      {/* Linha Superior: Logo + Perfil/Logout */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 sm:pb-4 gap-2">
        
        {/* Marca / Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <Logo size={32} className="shadow-md shadow-[#a3e635]/20 rounded-xl sm:rounded-2xl w-8 h-8 sm:w-9 sm:h-9" />
          <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
            Louve<span className="text-[#a3e635]">Scale</span>
          </span>
        </div>

        {/* Perfil & Botão Logout */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#131614] border border-zinc-800 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl">
            {isAdmin ? (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#a3e635]">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Admin</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-400">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline truncate max-w-[80px]">
                  {Array.isArray(currentUser?.profile?.roles)
                    ? currentUser.profile.roles[0]
                    : (currentUser?.profile?.instrument_role || 'Membro')}
                </span>
              </span>
            )}
            <span className="text-[11px] sm:text-xs text-white font-medium max-w-[90px] sm:max-w-[130px] truncate">
              {currentUser?.profile?.full_name?.split(' ')[0] || currentUser?.user?.email?.split('@')[0]}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer flex-shrink-0"
            title="Terminar sessão"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>

      {/* Navegação entre Abas (Grid compacto no mobile, centralizado e sem cortar) */}
      <nav className="grid grid-cols-3 bg-[#131614] p-1 rounded-2xl border border-zinc-800/80 gap-1 w-full max-w-md mx-auto sm:max-w-none sm:flex sm:justify-start">
        {[
          { id: 'dashboard', label: 'Painel' },
          { id: 'schedules', label: 'Escalas' },
          { id: 'songs', label: 'Músicas' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-3 text-center sm:px-5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#a3e635] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Barra de Pesquisa */}
      <div className="w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por títulos, artistas ou tons..."
          className="w-full bg-[#131614] border border-zinc-800 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]/60 transition-colors"
        />
      </div>
    </header>
  );
}