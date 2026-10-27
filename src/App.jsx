import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import NewScheduleModal from './components/NewScheduleModal';
import NewSongModal from './components/NewSongModal';
import TeamChatWidget from './components/TeamChatWidget';
import Logo from './components/Logo';
import { supabase } from './services/supabase';
import { schedulesService } from './services/schedulesService';
import { generateGoogleCalendarUrl } from './utils/calendarUtils';
import { 
  Calendar, 
  Plus, 
  Music2, 
  Users, 
  Trash2, 
  Pencil, 
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
  Clock, 
  CalendarPlus, 
  SlidersHorizontal,
  X,
  Bell,
  History
} from 'lucide-react';

const AVAILABLE_ROLES = [
  'Ministro(a) de Louvor',
  'Backing Vocal',
  'Backing Vocal (Soprano)',
  'Backing Vocal (Contralto)',
  'Backing Vocal (Tenor)',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado / Piano',
  'Bateria',
  'Mídia / Projeção',
  'Técnico de Som'
];

const sanitizeRoles = (rolesList) => {
  if (!Array.isArray(rolesList)) return [];
  const deprecated = [
    'Vocal / Ministro(a)', 
    'Vocal/Ministro', 
    'Voz/Ministro', 
    'Vocal / Ministro',
    'Voz / Ministro(a)'
  ];
  return Array.from(new Set(rolesList.filter((r) => !deprecated.includes(r))));
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-separador na aba de Escalas: 'upcoming' | 'past'
  const [scheduleSubTab, setScheduleSubTab] = useState('upcoming');

  // Estados principais
  const [schedules, setSchedules] = useState([]);
  const [songs, setSongs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais de Criação/Edição de Escala
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Modais de Música (Criação e Edição)
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);

  // Modal para o Admin editar funções de um membro
  const [editingMemberRoles, setEditingMemberRoles] = useState(null);
  const [memberSelectedRoles, setMemberSelectedRoles] = useState([]);
  const [isSavingMemberRoles, setIsSavingMemberRoles] = useState(false);

  // Notificações no Dispositivo
  const [mobileNotice, setMobileNotice] = useState(null);

  // Autenticação
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authSelectedRoles, setAuthSelectedRoles] = useState(['Backing Vocal']);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const triggerMobileNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch (err) {
        console.warn('Falha na notificação nativa:', err);
      }
    }

    setMobileNotice({ title, message });
    setTimeout(() => {
      setMobileNotice(null);
    }, 5000);
  };

  // 1. Verificação de Sessão
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

          const pendingRolesRaw = localStorage.getItem('louvescale_pending_roles');
          const pendingRoles = pendingRolesRaw ? JSON.parse(pendingRolesRaw) : null;

          if (!profile) {
            const googleName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
            const initialRoles = pendingRoles && pendingRoles.length > 0 ? pendingRoles : ['Backing Vocal'];

            const newProfilePayload = {
              id: session.user.id,
              full_name: googleName,
              avatar_url: googleAvatar,
              roles: initialRoles,
              instrument_role: initialRoles[0] || 'Voluntário',
              role: 'member'
            };

            await supabase.from('profiles').upsert(newProfilePayload);
            setCurrentUser({ user: session.user, profile: newProfilePayload });
            triggerMobileNotification('Registo Concluído! 🎉', `Bem-vindo(a), ${googleName}! O seu perfil foi criado.`);
          } else {
            setCurrentUser({ user: session.user, profile });
            if (pendingRoles) {
              triggerMobileNotification('Bem-vindo de volta! 👋', `Olá, ${profile.full_name}! Já possui registo.`);
            }
          }

          localStorage.removeItem('louvescale_pending_roles');
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Erro de sessão:', err);
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

  // 2. Google One Tap
  useEffect(() => {
    if (currentUser || loading) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const initializeGoogleOneTap = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              try {
                setGoogleLoading(true);
                const { error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: response.credential
                });
                if (error) throw error;
              } catch (err) {
                console.error('Erro no login Google One Tap:', err);
                setAuthError('Não foi possível autenticar com o Google One Tap.');
              } finally {
                setGoogleLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn('Google One Tap não pôde ser iniciado:', e);
        }
      }
    };

    const timer = setTimeout(initializeGoogleOneTap, 600);
    return () => clearTimeout(timer);
  }, [currentUser, loading]);

  // 3. Obtenção de dados do Supabase
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
      console.error('Erro ao procurar dados:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const toggleAuthRole = (roleName) => {
    setAuthSelectedRoles((prev) => {
      if (prev.includes(roleName)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setAuthError('');

      if (authMode === 'register' && authSelectedRoles.length > 0) {
        localStorage.setItem('louvescale_pending_roles', JSON.stringify(authSelectedRoles));
      }

      if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin }
            });
          }
        });
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Erro no Google OAuth:', err);
      setAuthError(err.message || 'Falha ao ligar à conta Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou palavra-passe incorretos. Verifique os seus dados.');
          }
          throw error;
        }
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

        if (error) {
          const errMsg = error.message?.toLowerCase() || '';
          if (
            errMsg.includes('already registered') || 
            errMsg.includes('already in use') || 
            errMsg.includes('user already exists')
          ) {
            setAuthError('Este e-mail já se encontra registado! Aceda com a sua palavra-passe no separador "Entrar".');
            setAuthMode('login');
            setAuthPassword('');
            return;
          }
          throw error;
        }

        if (data?.user?.identities && data.user.identities.length === 0) {
          setAuthError('Este e-mail já possui conta no LouveScale! Por favor, inicie sessão com a sua palavra-passe.');
          setAuthMode('login');
          setAuthPassword('');
          return;
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: authFullName.trim(),
            roles: authSelectedRoles,
            instrument_role: authSelectedRoles[0] || 'Voluntário',
            role: 'member'
          });
          triggerMobileNotification('Registo Concluído! 🎉', 'Bem-vindo ao LouveScale! O seu perfil foi criado.');
        }
      }
    } catch (err) {
      console.error('Erro de autenticação:', err);
      setAuthError(err.message || 'Falha ao autenticar.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Guardar Escala
  const handleSaveSchedule = async (schedulePayload, scheduleId) => {
    try {
      const creatorName = currentUser?.profile?.full_name || 'Admin';

      if (scheduleId) {
        await schedulesService.updateSchedule(scheduleId, schedulePayload);
        triggerMobileNotification(
          'Escala Atualizada! 📅',
          `A escala "${schedulePayload.title}" foi editada por ${creatorName}.`
        );
      } else {
        await schedulesService.createSchedule(schedulePayload);
        triggerMobileNotification(
          'Nova Escala Criada! 📅',
          `"${schedulePayload.title}" foi criada por ${creatorName}. Verifique o seu horário e repertório!`
        );
      }

      await fetchData();
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error('Erro ao guardar escala:', err);
      alert('Erro ao guardar escala.');
    }
  };

  // Eliminar Escala
  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Deseja realmente eliminar esta escala?')) return;
    try {
      await schedulesService.deleteSchedule(scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (err) {
      console.error('Erro ao eliminar escala:', err);
      alert('Erro ao eliminar escala.');
    }
  };

  const handleOpenEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  // Guardar ou Editar Música (sem exigir .single() para evitar o erro PGRST116)
  const handleSaveSong = async (songPayload, songId = null) => {
    try {
      const cleanPayload = {
        title: songPayload.title?.trim(),
        artist: songPayload.artist?.trim(),
        default_key: songPayload.default_key || 'G',
        chords_url: songPayload.chords_url?.trim() || null,
        youtube_url: songPayload.youtube_url?.trim() || null
      };

      if (songPayload.bpm) {
        cleanPayload.bpm = parseInt(songPayload.bpm, 10);
      }

      let resultData = null;

      if (songId) {
        const { error } = await supabase
          .from('songs')
          .update(cleanPayload)
          .eq('id', songId);

        if (error) throw error;
        resultData = { id: songId, ...cleanPayload };

        triggerMobileNotification(
          'Música Atualizada! 🎵',
          `"${cleanPayload.title}" foi editada com sucesso.`
        );
      } else {
        const { data, error } = await supabase
          .from('songs')
          .insert([cleanPayload])
          .select();

        if (error) throw error;
        resultData = data && data.length > 0 ? data[0] : cleanPayload;

        const creatorName = currentUser?.profile?.full_name || 'Membro do Louvor';
        triggerMobileNotification(
          'Novo Louvor Adicionado! 🎵',
          `"${cleanPayload.title}" (${cleanPayload.artist}) adicionada por ${creatorName}. Tom ${cleanPayload.default_key}.`
        );
      }

      await fetchData();
      setIsSongModalOpen(false);
      setEditingSong(null);
      return resultData;
    } catch (err) {
      console.error('Erro ao cadastrar/atualizar música:', err);
      alert('Erro ao guardar louvor: ' + (err.message || 'Verifique os dados.'));
      throw err;
    }
  };

  // Abrir Modal para Editar Música
  const handleOpenEditSong = (song) => {
    setEditingSong(song);
    setIsSongModalOpen(true);
  };

  // Eliminar Música
  const handleDeleteSong = async (songId) => {
    if (!confirm('Deseja eliminar esta música do repertório?')) return;
    try {
      const { error } = await supabase.from('songs').delete().eq('id', songId);
      if (error) throw error;
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (err) {
      console.error('Erro ao eliminar música:', err);
      alert('Erro ao eliminar louvor.');
    }
  };

  // Alternar Permissão de Admin
  const handleToggleAdmin = async (profileId, currentRole) => {
    const isUserAdmin = currentUser?.profile?.role === 'admin';
    if (!isUserAdmin) {
      alert('Apenas administradores podem gerir permissões.');
      return;
    }

    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (!confirm('Deseja alterar a permissão de administrador deste voluntário?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );

      if (profileId === currentUser?.user?.id) {
        setCurrentUser((prev) => ({
          ...prev,
          profile: { ...prev.profile, role: newRole }
        }));
      }
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
      alert('Não foi possível alterar a permissão.');
    }
  };

  // Abrir Modal de Funções do Membro (Admin)
  const handleOpenEditMemberRoles = (member) => {
    const rawRoles = Array.isArray(member.roles) && member.roles.length > 0
      ? member.roles
      : (member.instrument_role ? [member.instrument_role] : ['Voluntário']);

    const cleanedRoles = sanitizeRoles(rawRoles);

    setEditingMemberRoles(member);
    setMemberSelectedRoles(cleanedRoles.length > 0 ? cleanedRoles : ['Ministro(a) de Louvor']);
  };

  // Guardar Funções alteradas pelo Admin
  const handleSaveMemberRoles = async () => {
    if (!editingMemberRoles) return;
    if (memberSelectedRoles.length === 0) {
      alert('O voluntário precisa de ter pelo menos 1 função no ministério.');
      return;
    }

    try {
      setIsSavingMemberRoles(true);
      const primaryRole = memberSelectedRoles[0] || 'Voluntário';

      const { error } = await supabase
        .from('profiles')
        .update({
          roles: memberSelectedRoles,
          instrument_role: primaryRole
        })
        .eq('id', editingMemberRoles.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === editingMemberRoles.id
            ? { ...p, roles: memberSelectedRoles, instrument_role: primaryRole }
            : p
        )
      );

      if (editingMemberRoles.id === currentUser?.user?.id) {
        setCurrentUser((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            roles: memberSelectedRoles,
            instrument_role: primaryRole
          }
        }));
      }

      setEditingMemberRoles(null);
    } catch (err) {
      console.error('Erro ao guardar funções:', err);
      alert('Não foi possível atualizar as funções.');
    } finally {
      setIsSavingMemberRoles(false);
    }
  };

  // Enviar Fotografia de Perfil
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
      console.error('Erro no upload de foto:', err);
      alert('Não foi possível atualizar a fotografia.');
    }
  };

  // Separação cronológica: Próximas Escalas vs. Encerradas (Histórico)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingSchedules = schedules
    .filter((s) => new Date(s.event_date) >= startOfToday)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  const pastSchedules = schedules
    .filter((s) => new Date(s.event_date) < startOfToday)
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

  const activeScheduleList = scheduleSubTab === 'upcoming' ? upcomingSchedules : pastSchedules;

  const filteredSchedules = activeScheduleList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q) ||
      item.schedule_members?.some((m) => (m.profile?.full_name || '').toLowerCase().includes(q)) ||
      item.schedule_songs?.some((s) => (s.song?.title || '').toLowerCase().includes(q))
    );
  });

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

  const isCurrentUserAdmin = currentUser?.profile?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-church-dark flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-church-blue animate-spin" />
        <span className="text-xs font-semibold">A carregar o LouveScale...</span>
      </div>
    );
  }

  // ==========================================
  // ECRÃ DE LOGIN / REGISTO
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-church-dark text-church-silver flex items-center justify-center p-4 pt-12 sm:pt-4">
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

          {authMode === 'register' && (
            <div className="space-y-2 p-3 bg-church-dark rounded-2xl border border-church-border animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-church-blue" /> As suas funções no louvor *
                </label>
                <span className="text-[10px] text-church-blue font-bold">
                  {authSelectedRoles.length} selecionada(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Selecione as funções que exerce (pode marcar mais do que uma):
              </p>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {AVAILABLE_ROLES.map((role) => {
                  const isSelected = authSelectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleAuthRole(role)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-church-blue text-white border-church-blue shadow-sm shadow-blue-600/30'
                          : 'bg-church-card text-slate-400 border-church-border hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão Oficial Google */}
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
            {authMode === 'register' ? 'Criar conta com o Google' : 'Continuar com a Conta Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-church-border"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ou com e-mail</span>
            <div className="flex-1 h-px bg-church-border"></div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
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
                placeholder="o-seu-email@exemplo.com"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-church-blue" /> Palavra-passe *
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
              {authMode === 'login' ? 'Entrar no Sistema' : 'Registar Voluntário'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // ==========================================
  // APLICAÇÃO LOGADA (RESPONSIVA)
  // ==========================================
  return (
    <div className="min-h-screen bg-church-dark text-church-silver flex flex-col items-center antialiased selection:bg-church-blue selection:text-white">
      
      {/* BANNER FLUTUANTE DE NOTIFICAÇÃO */}
      {mobileNotice && (
        <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border border-church-blue/50 p-3.5 rounded-2xl shadow-2xl shadow-black/80 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-church-blue text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/40">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-black text-white truncate">{mobileNotice.title}</h4>
              <span className="text-[10px] text-church-blue font-bold">Agora</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
              {mobileNotice.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNotice(null)}
            className="text-slate-500 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="w-full max-w-7xl min-h-screen flex flex-col px-4 sm:px-8 lg:px-12 pt-12 sm:pt-6 pb-24">
        
        {/* Cabeçalho */}
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
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onRefresh={fetchData}
            />
          )}

          {/* ABA 2: ESCALAS COM SEPARAÇÃO DE FUTURAS E PASSADAS */}
          {activeTab === 'schedules' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Escalas e Ensaios <Calendar className="w-5 h-5 text-church-blue flex-shrink-0" />
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Acompanhe a formação da equipa, repertório e datas programadas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setIsScheduleModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" /> Nova Escala
                </button>
              </div>

              {/* Seletor entre Próximas e Histórico */}
              <div className="flex items-center gap-1.5 bg-church-card p-1.5 rounded-2xl border border-church-border w-fit">
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('upcoming')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    scheduleSubTab === 'upcoming'
                      ? 'bg-church-blue text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Próximas Escalas</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    scheduleSubTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {upcomingSchedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleSubTab('past')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    scheduleSubTab === 'past'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Encerradas / Histórico</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    scheduleSubTab === 'past' ? 'bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {pastSchedules.length}
                  </span>
                </button>
              </div>

              {filteredSchedules.length === 0 ? (
                <div className="bg-church-card border border-church-border rounded-3xl p-12 text-center text-slate-400 space-y-2">
                  {scheduleSubTab === 'upcoming' ? (
                    <>
                      <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">Nenhuma escala futura agendada.</p>
                      <p className="text-xs text-slate-500">Clique em "+ Nova Escala" para criar o próximo culto ou ensaio.</p>
                    </>
                  ) : (
                    <>
                      <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">Nenhuma escala encerrada no histórico.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredSchedules.map((item) => {
                    const eventDate = new Date(item.event_date);
                    const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(eventDate);
                    const formattedTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(eventDate);
                    
                    const scheduleSongs = item.schedule_songs || [];
                    const scheduleMembers = item.schedule_members || [];
                    const isPast = scheduleSubTab === 'past';

                    return (
                      <div 
                        key={item.id} 
                        className={`bg-church-card border p-5 rounded-3xl space-y-4 transition-all flex flex-col justify-between shadow-sm ${
                          isPast 
                            ? 'border-church-border/60 opacity-85 hover:opacity-100 hover:border-slate-700' 
                            : 'border-church-border hover:border-church-blue/50'
                        }`}
                      >
                        <div className="space-y-3">
                          
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isPast
                                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                    : item.type === 'rehearsal' 
                                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                                      : 'bg-church-blue/10 text-church-blue border border-church-blue/20'
                                }`}>
                                  {isPast ? 'Encerrada' : item.type === 'rehearsal' ? 'Ensaio' : 'Culto Oficial'}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-church-blue" /> {formattedTime}
                                </span>
                              </div>
                              <h3 className="text-base font-extrabold text-white leading-tight">{item.title}</h3>
                              <span className="text-xs text-slate-400 capitalize block mt-0.5">{formattedDate}</span>
                            </div>

                            {isCurrentUserAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSchedule(item)}
                                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-church-blue text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Editar escala"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(item.id)}
                                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-church-red text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Eliminar escala"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-xs text-slate-400 bg-church-dark p-2.5 rounded-xl border border-church-border">
                              {item.notes}
                            </p>
                          )}

                          {/* Músicas Selecionadas */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-church-blue uppercase flex items-center gap-1.5">
                              <Music2 className="w-3.5 h-3.5" /> Repertório ({scheduleSongs.length} músicas):
                            </span>

                            {scheduleSongs.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-1">
                                Nenhuma música selecionada.
                              </p>
                            ) : (
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {scheduleSongs.map((ss, idx) => {
                                  const songData = ss.song || songs.find(x => x.id === ss.song_id);
                                  const keyToShow = ss.song_key || ss.custom_key || songData?.default_key || 'C';

                                  return (
                                    <div 
                                      key={idx} 
                                      className="p-2 rounded-xl bg-church-dark border border-church-border flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[10px] font-bold text-slate-500">{idx + 1}.</span>
                                        <div className="min-w-0">
                                          <h4 className="text-xs font-bold text-white truncate leading-tight">
                                            {songData?.title || 'Louvor'}
                                          </h4>
                                          <span className="text-[10px] text-slate-400 truncate block">
                                            {songData?.artist || ''}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-950/60 border border-church-blue/30 text-blue-400">
                                          Tom {keyToShow}
                                        </span>
                                        {songData?.chords_url && (
                                          <a 
                                            href={songData.chords_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1 rounded-lg bg-slate-900 hover:bg-church-blue text-slate-400 hover:text-white"
                                            title="Ver Cifra"
                                          >
                                            <FileText className="w-3 h-3" />
                                          </a>
                                        )}
                                        {songData?.youtube_url && (
                                          <a 
                                            href={songData.youtube_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1 rounded-lg bg-slate-900 hover:bg-church-red text-slate-400 hover:text-white"
                                            title="Ver Vídeo"
                                          >
                                            <Video className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Voluntários Escalados */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-church-blue" /> Voluntários ({scheduleMembers.length}):
                            </span>

                            {scheduleMembers.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-1">Nenhum voluntário escalado.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {scheduleMembers.map((sm, idx) => {
                                  const memberName = sm.profile?.full_name || profiles.find(p => p.id === sm.profile_id)?.full_name || 'Voluntário';
                                  return (
                                    <span 
                                      key={idx} 
                                      className="px-2.5 py-1 rounded-xl bg-church-dark border border-church-border text-[11px] font-semibold text-slate-200 flex items-center gap-1.5"
                                    >
                                      <span>{memberName}</span>
                                      <span className="text-[9px] text-church-blue font-bold">({sm.role})</span>
                                      {sm.status === 'confirmed' && <span title="Confirmado">✅</span>}
                                      {sm.status === 'declined' && <span title="Não poderá comparecer">❌</span>}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Botão de Google Agenda apenas nas futuras */}
                        {!isPast && (
                          <div className="pt-3 border-t border-church-border">
                            <a
                              href={generateGoogleCalendarUrl({
                                title: item.title,
                                eventDate: item.event_date,
                                notes: item.notes,
                                songs: item.schedule_songs || []
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-church-blue text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-church-border hover:border-church-blue"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              Adicionar ao Google Agenda (Alerta 2h)
                            </a>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: MÚSICAS */}
          {activeTab === 'songs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Repertório de Louvor <Music2 className="w-5 h-5 text-church-blue flex-shrink-0" />
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Músicas registadas, tons padrão, links de cifras e referências.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSong(null);
                    setIsSongModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" /> Nova Música
                </button>
              </div>

              {filteredSongs.length === 0 ? (
                <div className="bg-church-card border border-church-border rounded-3xl p-12 text-center text-slate-400">
                  <Music2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Nenhuma música encontrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {filteredSongs.map((song) => (
                    <div 
                      key={song.id} 
                      className="bg-church-card border border-church-border hover:border-church-blue/50 p-5 rounded-3xl space-y-3 transition-all flex flex-col justify-between shadow-sm min-w-0"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <h3 className="text-base font-bold text-white leading-tight break-words">
                              {song.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                              {song.artist}
                            </p>
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
                        </div>
                      </div>

                      <div className="pt-3 border-t border-church-border flex items-center justify-between">
                        {/* Links de Cifra e Vídeo */}
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

                        {/* Botões de Ação: Editar e Eliminar */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSong(song);
                              setIsSongModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-church-blue text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Editar música (cifra, tom, vídeo, bpm)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSong(song.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-church-red text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Remover música"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: VOLUNTÁRIOS */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    Equipa e Voluntários <Users className="w-5 h-5 text-church-blue flex-shrink-0" />
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Membros registados no ministério de louvor, funções e permissões.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-300 bg-church-card border border-church-border px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {profiles.length} voluntários
                </span>
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
                    const rawRoles = Array.isArray(member.roles) && member.roles.length > 0 
                      ? member.roles 
                      : [member.instrument_role || 'Voluntário'];
                    const memberRoles = sanitizeRoles(rawRoles);

                    return (
                      <div 
                        key={member.id} 
                        className={`bg-church-card border p-4 sm:p-5 rounded-3xl flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                          isMe ? 'border-church-blue/60 bg-blue-950/10' : 'border-church-border hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start gap-3">
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

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-extrabold text-white truncate leading-tight">
                                  {member.full_name}
                                </h3>
                                {isMe && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-church-blue text-white">
                                    Você
                                  </span>
                                )}
                                {isAdmin && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-church-red/20 text-church-red border border-church-red/30 flex items-center gap-0.5">
                                    <Shield className="w-2.5 h-2.5" /> Admin
                                  </span>
                                )}
                              </div>

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

                        {/* BOTÕES DE GESTÃO DO ADMIN */}
                        {isCurrentUserAdmin && (
                          <div className="pt-3 border-t border-church-border grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMemberRoles(member)}
                              className="py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-church-blue text-slate-200 hover:text-white border border-church-border hover:border-church-blue transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-church-blue flex-shrink-0" />
                              <span>Funções</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleAdmin(member.id, member.role)}
                              disabled={isMe}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isMe 
                                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800' 
                                  : isAdmin
                                    ? 'bg-church-red/20 hover:bg-church-red text-church-red hover:text-white border border-church-red/40'
                                    : 'bg-church-blue/20 hover:bg-church-blue text-church-blue hover:text-white border border-church-blue/40'
                              }`}
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Remover Admin</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Tornar Admin</span>
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

        {/* MODAL DE EDIÇÃO DE FUNÇÕES DO VOLUNTÁRIO */}
        {editingMemberRoles && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-church-card border border-church-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="px-5 py-4 border-b border-church-border flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-church-blue text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Gerir Funções</h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                      {editingMemberRoles.full_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMemberRoles(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                <p className="text-xs text-slate-300">
                  Marque ou desmarque os instrumentos e cargos deste voluntário:
                </p>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-church-dark border border-church-border max-h-60 overflow-y-auto">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = memberSelectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setMemberSelectedRoles((prev) =>
                            prev.includes(role)
                              ? prev.filter((r) => r !== role)
                              : [...prev, role]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-church-blue text-white border-church-blue shadow-sm shadow-blue-600/30'
                            : 'bg-church-card text-slate-400 border-church-border hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 pb-4 px-5 border-t border-church-border flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMemberRoles(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemberRoles}
                  disabled={isSavingMemberRoles}
                  className="px-5 py-2.5 bg-church-blue hover:bg-church-blue-hover disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingMemberRoles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  )}
                  Guardar Alterações
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal de Escala */}
        <NewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setEditingSchedule(null);
          }}
          profiles={profiles}
          songs={songs}
          scheduleToEdit={editingSchedule}
          onSave={handleSaveSchedule}
          onCreateSong={handleSaveSong}
          onEditSong={handleOpenEditSong}
        />

        {/* Modal de Música (Adicionar ou Editar) */}
        <NewSongModal
          isOpen={isSongModalOpen}
          onClose={() => {
            setIsSongModalOpen(false);
            setEditingSong(null);
          }}
          songToEdit={editingSong}
          onSave={handleSaveSong}
        />

        {/* Chat de Equipa */}
        <TeamChatWidget
          currentUser={currentUser}
          songsPool={songs}
        />

      </div>
    </div>
  );
}