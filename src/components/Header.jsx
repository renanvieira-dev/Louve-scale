import React, { useRef } from 'react';
import Logo from './Logo';
import InstallPwaModal from './InstallPwaModal';
import { 
  LayoutDashboard, 
  Calendar, 
  Music2, 
  Users, 
  Search, 
  LogOut, 
  Shield, 
  Camera, 
  X 
} from 'lucide-react';

export default function Header({
  activeTab = 'dashboard',
  setActiveTab,
  searchQuery = '',
  setSearchQuery,
  currentUser = null,
  onLogout,
  onAvatarUpload
}) {
  const fileInputRef = useRef(null);

  const profile = currentUser?.profile || {};
  const isAdmin = profile.role === 'admin';
  const firstName = profile.full_name ? profile.full_name.split(' ')[0] : 'Voluntário';

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'schedules', label: 'Escalas', icon: Calendar },
    { id: 'songs', label: 'Músicas', icon: Music2 },
    { id: 'members', label: 'Voluntários', icon: Users },
  ];

  return (
    <header className="w-full space-y-4 flex-shrink-0">
      
      {/* Input oculto para carregar fotografia de perfil */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* BARRA SUPERIOR PRINCIPAL */}
      <div className="flex items-center justify-between gap-3">
        
        {/* Lado Esquerdo: Logótipo LouveScale */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <Logo size={36} className="transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              Louve<span className="text-church-blue">Scale</span>
            </h1>
          </div>
        </div>

        {/* Centro: Navegação em Abas (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-church-card p-1.5 rounded-2xl border border-church-border shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-church-blue text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Lado Direito: Instalar App + Perfil do Utilizador + Sair */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Botão PWA inteligente para smartphone */}
          <InstallPwaModal />

          {/* Cartão de Perfil */}
          <div className="flex items-center gap-2 bg-church-card border border-church-border pl-1.5 pr-3 py-1 rounded-2xl shadow-sm">
            <div 
              onClick={handleAvatarClick}
              className="relative w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer group flex-shrink-0"
              title="Clique para alterar a fotografia"
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-slate-300">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="text-left hidden min-[420px]:block">
              {isAdmin && (
                <span className="text-[9px] font-black text-church-red flex items-center gap-0.5 uppercase tracking-wide leading-none">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[100px] sm:max-w-[140px]">
                {firstName}
              </span>
            </div>
          </div>

          {/* Botão de Terminar Sessão (Logout) */}
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-2xl bg-church-card hover:bg-church-red/20 border border-church-border hover:border-church-red/40 text-slate-400 hover:text-church-red flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* NAVEGAÇÃO MOBILE (Visível em ecrãs pequenos) */}
      <div className="flex md:hidden grid grid-cols-4 gap-1 bg-church-card p-1 rounded-2xl border border-church-border shadow-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-church-blue text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* BARRA DE PESQUISA DINÂMICA */}
      {activeTab !== 'dashboard' && (
        <div className="relative w-full animate-in fade-in">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'songs'
                ? 'Pesquisar por títulos, artistas ou tons...'
                : activeTab === 'schedules'
                  ? 'Pesquisar por título do culto, voluntário ou louvor...'
                  : 'Pesquisar voluntários por nome ou instrumento...'
            }
            className="w-full box-border bg-church-card border border-church-border rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-church-blue transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

    </header>
  );
}