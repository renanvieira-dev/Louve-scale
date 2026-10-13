import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import NewScheduleModal from './components/NewScheduleModal';
import NewSongModal from './components/NewSongModal';
import TeamChatWidget from './components/TeamChatWidget';
import Logo from './components/Logo';
import { supabase } from './services/supabase';
import { schedulesService } from './services/schedulesService';
import { 
  Calendar, 
  Plus, 
  Music2, 
  Users, 
  Trash2, 
  Video, 
  FileText, 
  Phone, 
  Cake, 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  Mail, 
  Lock, 
  User, 
  LogIn, 
  Loader2, 
  Check,
  Search
} from 'lucide-react';

const AVAILABLE_ROLES = [
  'Ministro(a) de Louvor',
  'Backing Vocal',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado / Piano',
  'Bateria',
  'Mídia / Projeção',
  'Técnico de Som'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Dados principais
  const [schedules, setSchedules] = useState([]);
  const [songs, setSongs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modais
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);

  // Estados da Tela de Login / Cadastro
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authSelectedRoles, setAuthSelectedRoles] = useState(['Backing Vocal']);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 1. Verificar Sessão no Supabase
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            const googleName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
            
            await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: googleName,
              avatar_url: googleAvatar,
              roles: ['Backing Vocal'],
              instrument_role: 'Backing Vocal',
              role: 'member'
            });
          }

          setCurrentUser({ user: session.user, profile: profile || {} });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Erro na checagem de sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setCurrentUser({ user: session.user, profile: profile || {} });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Buscar Dados da Aplicação
  const fetchData = async () => {
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (profilesData) setProfiles(profilesData);

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true });
      if (songsData) setSongs(songsData);

      const schedulesData = await schedulesService.getSchedules();
      if (schedulesData) setSchedules(schedulesData);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Alternar função na lista de múltiplas funções
  const toggleRoleSelection = (roleName) => {
    setAuthSelectedRoles((prev) => {
      if (prev.includes(roleName)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  // Login com Conta Google
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Erro no login com Google:', err);
      setAuthError(err.message || 'Erro ao conectar com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Login / Cadastro com E-mail e Senha
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              full_name: authFullName.trim(),
              instrument_role: authSelectedRoles[0] || 'Voluntário',
              roles: authSelectedRoles
            }
          }
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: authFullName.trim(),
            roles: authSelectedRoles,
            instrument_role: authSelectedRoles[0] || 'Voluntário',
            role: 'member'
          });
        }
      }
    } catch (err) {
      console.error('Erro de autenticação:', err);
      setAuthError(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Ativar ou Desativar Admin para um Voluntário
  const handleToggleAdmin = async (profileId, currentRole) => {
    const isCurrentUserAdmin = currentUser?.profile?.role === 'admin';
    if (!isCurrentUserAdmin) {
      alert('Apenas administradores podem gerenciar permissões.');
      return;
    }

    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const actionName = newRole === 'admin' ? 'conceder acesso de Administrador' : 'remover permissão de Administrador';

    if (!confirm(`Deseja realmente ${actionName} para este membro?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );

      // Se alterou a própria permissão, atualiza no currentUser
      if (profileId === currentUser?.user?.id) {
        setCurrentUser((prev) => ({
          ...prev,
          profile: { ...prev.profile, role: newRole }
        }));
      }
    } catch (err) {
      console.error('Erro ao atualizar permissão de admin:', err);
      alert('Não foi possível alterar a permissão.');
    }
  };

  // Salvar Escala
  const handleSaveSchedule = async (schedulePayload) => {
    try {
      await schedulesService.createSchedule(schedulePayload);
      await fetchData();
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar escala:', err);
      alert('Erro ao salvar escala.');
    }
  };

  // Salvar Louvor
  const handleSaveSong = async (songPayload) => {
    try {
      const { error } = await supabase.from('songs').insert([songPayload]);
      if (error) throw error;
      await fetchData();
      setIsSongModalOpen(false);
    } catch (err) {
      console.error('Erro ao cadastrar música:', err);
      alert('Erro ao adicionar o louvor.');
    }
  };

  // Excluir Louvor
  const handleDeleteSong = async (songId) => {
    if (!confirm('Deseja excluir esta música do repertório?')) return;
    try {
      const { error } = await supabase.from('songs').delete().eq('id', songId);
      if (error) throw error;
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (err) {
      console.error('Erro ao excluir música:', err);
      alert('Erro ao excluir louvor.');
    }
  };

  // Upload Avatar
  const handleAvatarUpload = async (file) => {
    if (!currentUser?.user?.id) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.user.id);

      setCurrentUser((prev) => ({
        ...prev,
        profile: { ...prev.profile, avatar_url: publicUrl }
      }));
    } catch (err) {
      console.error('Erro no upload de avatar:', err);
      alert('Não foi possível enviar a foto de perfil.');
    }
  };

  // Filtros
  const filteredSongs = songs.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.artist?.toLowerCase().includes(q) ||
      s.default_key?.toLowerCase().includes(q)
    );
  });

  const filteredMembers = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.instrument_role?.toLowerCase().includes(q) ||
      (Array.isArray(p.roles) && p.roles.some((r) => r.toLowerCase().includes(q)))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-church-dark flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-church-blue animate-spin" />
        <span className="text-xs font-semibold">Carregando LouveScale...</span>
      </div>
    );
  }

  // ==========================================
  // TELA DE LOGIN / CADASTRO COM GOOGLE & MÚLTIPLAS FUNÇÕES
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-church-dark text-church-silver flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-church-card border border-church-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in">
          
          <div className="text-center flex flex-col items-center">
            <Logo size={46} className="mb-3" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              Louve<span className="text-church-blue">Scale</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ministério Internacional Emmanuel • Gestão de Louvor
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs text-white transition-all cursor-pointer shadow-md hover:border-slate-500"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-church-blue" />
            ) : (
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
            )}
            Continuar com a Conta Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-church-border"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ou com e-mail</span>
            <div className="flex-1 h-px bg-church-border"></div>
          </div>

          <div className="grid grid-cols-2 p-1 bg-church-dark border border-church-border rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-church-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-church-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Novo Membro
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-church-red/20 border border-church-red/40 text-red-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-church-blue" /> Nome Completo *
                  </label>
                  <input
                    required
                    type="text"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-church-blue" /> Funções no Louvor *
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {authSelectedRoles.length} selecionada(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-church-dark border border-church-border">
                    {AVAILABLE_ROLES.map((role) => {
                      const isSelected = authSelectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRoleSelection(role)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-church-blue text-white border-church-blue shadow-sm shadow-blue-600/30'
                              : 'bg-church-card text-slate-400 border-church-border hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-church-blue" /> E-mail *
              </label>
              <input
                required
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-church-blue" /> Senha *
              </label>
              <input
                required
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-3 bg-church-blue hover:bg-church-blue-hover disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {authMode === 'login' ? 'Entrar no Sistema' : 'Cadastrar Voluntário'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  const isCurrentUserAdmin = currentUser?.profile?.role === 'admin';

  // ==========================================
  // APLICAÇÃO LOGADA
  // ==========================================
  return (
    <div className="min-h-screen bg-church-dark text-church-silver flex flex-col items-center antialiased selection:bg-church-blue selection:text-white">
      <div className="w-full max-w-7xl min-h-screen flex flex-col px-4 sm:px-8 lg:px-12 py-4">
        
        {/* Header Oficial LouveScale */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onAvatarUpload={handleAvatarUpload}
        />

        {/* Conteúdo Principal */}
        <main className="flex-1 mt-6">
          
          {/* ABA 1: PAINEL */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              songs={songs}
              schedules={schedules}
              profiles={profiles}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* ABA 2: ESCALAS */}
          {activeTab === 'schedules' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Escalas e Ensaios <Calendar className="w-5 h-5 text-church-blue" />
                  </h2>
                  <p className="text-xs text-slate-400">
                    Acompanhe a formação da equipe, repertório e sincronize com a sua agenda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-4 py-2 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Escala
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="bg-church-card border border-church-border rounded-3xl p-12 text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Nenhuma escala cadastrada no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map((item) => (
                    <div key={item.id} className="bg-church-card border border-church-border p-5 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.type === 'rehearsal' 
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                            : 'bg-church-blue/10 text-church-blue border border-church-blue/20'
                        }`}>
                          {item.type === 'rehearsal' ? 'Ensaio' : 'Culto Oficial'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.event_date))}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                      <div className="pt-2 border-t border-church-border flex items-center justify-between text-xs text-slate-400">
                        <span>Equipe: {item.schedule_members?.length || 0}</span>
                        <span>Músicas: {item.schedule_songs?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: MÚSICAS */}
          {activeTab === 'songs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Repertório de Louvor <Music2 className="w-5 h-5 text-church-blue" />
                  </h2>
                  <p className="text-xs text-slate-400">
                    Músicas cadastradas, tons padrão, links de cifras e referências.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSongModalOpen(true)}
                  className="px-4 py-2 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Música
                </button>
              </div>

              {filteredSongs.length === 0 ? (
                <div className="bg-church-card border border-church-border rounded-3xl p-12 text-center text-slate-400">
                  <Music2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Nenhuma música encontrada.</p>
                  <p className="text-xs text-slate-500 mt-1">Clique em "Nova Música" para adicionar o repertório do ministério.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSongs.map((song) => (
                    <div 
                      key={song.id} 
                      className="bg-church-card border border-church-border hover:border-church-blue/50 p-5 rounded-3xl space-y-3 transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-white leading-tight">{song.title}</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{song.artist}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-950/60 border border-church-blue/30 text-blue-400 flex-shrink-0">
                            {song.default_key || 'C'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {song.bpm && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-church-dark text-slate-400 border border-church-border">
                              {song.bpm} BPM
                            </span>
                          )}
                          {Array.isArray(song.tags) && song.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-church-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-church-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {song.chords_url && (
                            <a 
                              href={song.chords_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-church-blue text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                              title="Ver Cifra"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" /> Cifra
                            </a>
                          )}
                          {song.youtube_url && (
                            <a 
                              href={song.youtube_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-church-red text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                              title="Ver no YouTube"
                            >
                              <Video className="w-3.5 h-3.5 text-red-500" /> Vídeo
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSong(song.id)}
                          className="text-slate-600 hover:text-church-red p-1 rounded-lg transition-colors cursor-pointer"
                          title="Remover música"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: VOLUNTÁRIOS COMPLETA COM GESTÃO DE ADMIN */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Equipe e Voluntários <Users className="w-5 h-5 text-church-blue" />
                  </h2>
                  <p className="text-xs text-slate-400">
                    Membros cadastrados no ministério de louvor, funções e permissões.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 bg-church-card border border-church-border px-3 py-1.5 rounded-xl">
                    {profiles.length} voluntários
                  </span>
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="bg-church-card border border-church-border rounded-3xl p-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Nenhum voluntário encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMembers.map((member) => {
                    const isMe = member.id === currentUser?.user?.id;
                    const isAdmin = member.role === 'admin';
                    const memberRoles = Array.isArray(member.roles) && member.roles.length > 0 
                      ? member.roles 
                      : [member.instrument_role || 'Voluntário'];

                    return (
                      <div 
                        key={member.id} 
                        className={`bg-church-card border p-4 sm:p-5 rounded-3xl flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                          isMe ? 'border-church-blue/60 bg-blue-950/10' : 'border-church-border hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {member.avatar_url ? (
                                <img 
                                  src={member.avatar_url} 
                                  alt={member.full_name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-sm bg-slate-800">
                                  {member.full_name?.charAt(0).toUpperCase() || 'V'}
                                </div>
                              )}
                            </div>

                            {/* Informações */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-extrabold text-white truncate leading-tight">
                                  {member.full_name}
                                </h3>
                                {isMe && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-church-blue text-white">
                                    Você
                                  </span>
                                )}
                                {isAdmin && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-church-red/20 text-church-red border border-church-red/30 flex items-center gap-0.5">
                                    <Shield className="w-2.5 h-2.5" /> Admin
                                  </span>
                                )}
                              </div>

                              {/* Badges de Instrumentos / Funções */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {memberRoles.map((r, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/60 border border-church-blue/30 text-blue-400"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Metadados: Aniversário e WhatsApp */}
                          <div className="pt-3 mt-3 border-t border-church-border flex items-center justify-between text-xs text-slate-400">
                            {member.birth_date ? (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Cake className="w-3.5 h-3.5 text-church-blue" />
                                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(member.birth_date + 'T00:00:00'))}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-600">Sem data informada</span>
                            )}

                            {member.phone && (
                              <a
                                href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Abrir WhatsApp"
                              >
                                <Phone className="w-3 h-3" /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>

                        {/* BOTÃO PARA ATIVAR / DESATIVAR ADMIN (Disponível para administradores) */}
                        {isCurrentUserAdmin && (
                          <div className="pt-3 border-t border-church-border flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-slate-500" /> Permissão Admin:
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleAdmin(member.id, member.role)}
                              disabled={isMe} // Evita que você remova o seu próprio admin por engano
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isMe 
                                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800' 
                                  : isAdmin
                                    ? 'bg-church-red/20 hover:bg-church-red text-church-red hover:text-white border border-church-red/40'
                                    : 'bg-church-blue/20 hover:bg-church-blue text-church-blue hover:text-white border border-church-blue/40'
                              }`}
                              title={isMe ? 'Você não pode revogar o seu próprio acesso de admin' : 'Alterar cargo de administrador'}
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" /> Remover Admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" /> Tornar Admin
                                </>
                              )}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>

        {/* Modal de Escala */}
        <NewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          profiles={profiles}
          onSave={handleSaveSchedule}
        />

        {/* Modal de Música */}
        <NewSongModal
          isOpen={isSongModalOpen}
          onClose={() => setIsSongModalOpen(false)}
          onSave={handleSaveSong}
        />

        {/* Chat Flutuante da Equipe */}
        <TeamChatWidget
          currentUser={currentUser}
          songsPool={songs}
        />

      </div>
    </div>
  );
}