import React, { useRef, useState } from 'react';
import { LogOut, Shield, User, Camera, Loader2 } from 'lucide-react';
import Logo from './Logo';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery, 
  currentUser, 
  onLogout,
  onAvatarUpload 
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = currentUser?.profile?.role === 'admin';
  const avatarUrl = currentUser?.profile?.avatar_url || 
                    currentUser?.user?.user_metadata?.avatar_url || 
                    currentUser?.user?.user_metadata?.picture;

  const tabs = [
    { id: 'dashboard', label: 'Painel' },
    { id: 'schedules', label: 'Escalas' },
    { id: 'songs', label: 'Músicas' },
    { id: 'members', label: 'Voluntários' }
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Selecione uma imagem com menos de 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      if (onAvatarUpload) {
        await onAvatarUpload(file);
      }
    } catch {
      alert('Erro ao carregar foto de perfil.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header className="w-full flex flex-col gap-3 sm:gap-4">
      {/* Linha Superior */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 sm:pb-4 gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Logo size={34} className="shadow-md shadow-[#a3e635]/20 rounded-2xl w-8 h-8 sm:w-9 sm:h-9" />
          <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
            Louve<span className="text-[#a3e635]">Scale</span>
          </span>
        </div>

        {/* Abas no Desktop (centralizadas) */}
        <nav className="hidden sm:flex items-center gap-1 bg-[#131614] p-1.5 rounded-2xl border border-zinc-800/80">
          {tabs.map((tab) => (
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

        {/* Perfil & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          <div className="flex items-center gap-2 bg-[#131614] border border-zinc-800 p-1.5 pr-3 rounded-2xl">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Avatar Interativo */}
            <div
              onClick={handleAvatarClick}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden cursor-pointer group border border-zinc-700/80 hover:border-[#a3e635] transition-all flex items-center justify-center bg-zinc-900 flex-shrink-0"
              title="Clique para trocar a sua foto de perfil"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-zinc-400 group-hover:text-[#a3e635]" />
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#a3e635] animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            </div>

            {/* Informações do Membro */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#a3e635]">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-400">
                    {Array.isArray(currentUser?.profile?.roles)
                      ? currentUser.profile.roles[0]
                      : (currentUser?.profile?.instrument_role || 'Membro')}
                  </span>
                )}
              </div>
              <span className="text-xs text-white font-bold max-w-[100px] sm:max-w-[120px] truncate leading-tight">
                {currentUser?.profile?.full_name?.split(' ')[0] || currentUser?.user?.email?.split('@')[0]}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-2xl bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
            title="Terminar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Abas no Mobile (grade com 4 colunas) */}
      <nav className="grid grid-cols-4 sm:hidden bg-[#131614] p-1 rounded-2xl border border-zinc-800/80 gap-1 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeTab === tab.id
                ? 'bg-[#a3e635] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
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
          className="w-full bg-[#131614] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]/60 transition-colors"
        />
      </div>
    </header>
  );
}