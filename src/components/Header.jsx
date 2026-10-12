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
      {/* Barra Superior Principal */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 sm:pb-4 gap-4">
        
        {/* Lado Esquerdo: Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Logo size={34} className="shadow-md shadow-[#a3e635]/20 rounded-2xl w-8 h-8 sm:w-9 sm:h-9" />
          <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
            Louve<span className="text-[#a3e635]">Scale</span>
          </span>
        </div>

        {/* Centro (Desktop): Abas compactas centralizadas como era antes */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#131614] p-1.5 rounded-2xl border border-zinc-800/80">
          {[
            { id: 'dashboard', label: 'Painel' },
            { id: 'schedules', label: 'Escalas' },
            { id: 'songs', label: 'Músicas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Lado Direito: Perfil + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#131614] border border-zinc-800 px-3 py-1.5 rounded-xl">
            {isAdmin ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#a3e635]">
                <Shield className="w-3.5 h-3.5" /> Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                <User className="w-3.5 h-3.5" /> {
                  Array.isArray(currentUser?.profile?.roles)
                    ? currentUser.profile.roles[0]
                    : (currentUser?.profile?.instrument_role || 'Membro')
                }
              </span>
            )}
            <span className="text-xs text-white font-medium max-w-[120px] truncate">
              {currentUser?.profile?.full_name?.split(' ')[0] || currentUser?.user?.email?.split('@')[0]}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
            title="Terminar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Navegação Mobile (Exibida SOMENTE em telas pequenas, abaixo do topo) */}
      <nav className="grid grid-cols-3 sm:hidden bg-[#131614] p-1 rounded-2xl border border-zinc-800/80 gap-1 w-full">
        {[
          { id: 'dashboard', label: 'Painel' },
          { id: 'schedules', label: 'Escalas' },
          { id: 'songs', label: 'Músicas' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-3 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#a3e635] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Barra de Pesquisa Geral */}
      <div className="w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por títulos, artistas ou tons..."
          className="w-full bg-[#131614] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]/60 transition-colors"
        />
      </div>
    </header>
  );
}