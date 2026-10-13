import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import SongsView from './components/SongsView';
import SchedulesView from './components/SchedulesView';
import MembersView from './components/MembersView';
import AuthModal from './components/AuthModal';
import { songsService } from './services/songsService';
import { schedulesService } from './services/schedulesService';
import { authService } from './services/authService';
import TeamChatWidget from './components/TeamChatWidget';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Abas: 'dashboard', 'schedules', 'songs', 'members'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Escuta contínua de sessão e sincronização
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = authService.onAuthStateChange(async (userSession) => {
      if (!isMounted) return;

      if (userSession?.user) {
        const pendingRolesStr = localStorage.getItem('pending_roles');
        if (pendingRolesStr) {
          try {
            const parsedRoles = JSON.parse(pendingRolesStr);
            await authService.updateRoles(userSession.user.id, parsedRoles);
            if (userSession.profile) {
              userSession.profile.roles = parsedRoles;
            }
          } catch (e) {
            console.error('Erro ao sincronizar funções pendentes:', e);
          }
          localStorage.removeItem('pending_roles');
        }
      }

      setCurrentUser(userSession);
      setIsAuthChecking(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Carregar dados das coleções
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [songsData, schedulesData, profilesData] = await Promise.all([
        songsService.getSongs(),
        schedulesService.getSchedules(),
        authService.getAllProfiles()
      ]);
      setSongs(songsData || []);
      setSchedules(schedulesData || []);
      setProfiles(profilesData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  // Upload de Foto de Perfil
  const handleAvatarUpload = async (file) => {
    if (!currentUser?.user?.id) return;
    const newUrl = await authService.uploadAvatar(currentUser.user.id, file);

    setCurrentUser((prev) => ({
      ...prev,
      profile: {
        ...(prev?.profile || {}),
        avatar_url: newUrl
      }
    }));

    setProfiles((prev) =>
      prev.map((p) => (p.id === currentUser.user.id ? { ...p, avatar_url: newUrl } : p))
    );
  };

  // Músicas: Cadastrar, Editar e Excluir
  const handleAddSong = async (newSongData) => {
    try {
      const savedSong = await songsService.addSong(newSongData);
      setSongs((prev) => [savedSong, ...prev]);
    } catch {
      alert('Erro ao guardar música.');
    }
  };

  const handleUpdateSong = async (songId, updatedData) => {
    try {
      const updated = await songsService.updateSong(songId, updatedData);
      setSongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));
    } catch {
      alert('Erro ao atualizar música.');
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      await songsService.deleteSong(songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setSchedules((prev) =>
        prev.map((sched) => ({
          ...sched,
          schedule_songs: (sched.schedule_songs || []).filter(
            (item) => item.song_id !== songId && item.songs?.id !== songId
          ),
        }))
      );
    } catch {
      alert('Erro ao excluir música.');
    }
  };

  // Escalas: Criar e Excluir
  const handleAddSchedule = async (schedulePayload) => {
    try {
      await schedulesService.createSchedule(schedulePayload);
      const updated = await schedulesService.getSchedules();
      setSchedules(updated);
    } catch (err) {
      console.error('Erro detalhado:', err);
      alert(err?.message || 'Erro ao criar escala.');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await schedulesService.deleteSchedule(scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch {
      alert('Erro ao eliminar escala.');
    }
  };

  const handleStatusChange = async (memberId, status) => {
    try {
      await schedulesService.updateMemberStatus(memberId, status);
      setSchedules((prev) =>
        prev.map((sched) => ({
          ...sched,
          schedule_members: (sched.schedule_members || []).map((m) =>
            m.id === memberId ? { ...m, status } : m
          ),
        }))
      );
    } catch {
      alert('Erro ao atualizar presença.');
    }
  };

  const handleAddSongToSchedule = async (scheduleId, payload, orderIndex) => {
    try {
      let songIdToLink = payload.songId;
      if (payload.type === 'new') {
        const savedNewSong = await songsService.addSong(payload.newSong);
        songIdToLink = savedNewSong.id;
        setSongs((prev) => [savedNewSong, ...prev]);
      }

      const newEntry = await schedulesService.addSongToSchedule(
        scheduleId,
        songIdToLink,
        payload.songKey,
        orderIndex
      );

      setSchedules((prev) =>
        prev.map((sched) => {
          if (sched.id === scheduleId) {
            return {
              ...sched,
              schedule_songs: [...(sched.schedule_songs || []), newEntry],
            };
          }
          return sched;
        })
      );
    } catch {
      alert('Erro ao vincular música à escala.');
    }
  };

  const handleRemoveSongFromSchedule = async (scheduleId, scheduleSongId) => {
    try {
      await schedulesService.removeSongFromSchedule(scheduleSongId);
      setSchedules((prev) =>
        prev.map((sched) => {
          if (sched.id === scheduleId) {
            return {
              ...sched,
              schedule_songs: (sched.schedule_songs || []).filter(
                (s) => s.id !== scheduleSongId
              ),
            };
          }
          return sched;
        })
      );
    } catch {
      alert('Erro ao remover música da escala.');
    }
  };

  // Voluntários: Atualização de papéis
  const handleProfileUpdated = (userId, updatedFields) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, ...updatedFields } : p))
    );
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0b0d0c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const isAdmin = currentUser?.profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0b0d0c] text-zinc-100 flex flex-col items-center antialiased selection:bg-[#a3e635] selection:text-black">
      <div className="w-full max-w-7xl min-h-screen flex flex-col px-4 sm:px-8 lg:px-12 py-4">
        
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onAvatarUpload={handleAvatarUpload}
        />

        <main className="flex-1 mt-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              songs={songs}
              schedules={schedules}
              profiles={profiles}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'schedules' && (
            isLoading ? (
              <div className="p-16 text-center bg-[#131614] border border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 text-sm font-medium">A carregar escalas...</p>
              </div>
            ) : (
              <SchedulesView
                schedules={schedules}
                songs={songs}
                profiles={profiles}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onStatusChange={handleStatusChange}
                onAddSongToSchedule={handleAddSongToSchedule}
                onRemoveSongFromSchedule={handleRemoveSongFromSchedule}
                isAdmin={isAdmin}
              />
            )
          )}

          {activeTab === 'songs' && (
            <SongsView 
              songs={songs} 
              onAddSong={handleAddSong}
              onUpdateSong={handleUpdateSong}
              onDeleteSong={handleDeleteSong}
              searchQuery={searchQuery}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              profiles={profiles}
              currentUserId={currentUser?.user?.id}
              isAdmin={isAdmin}
              onProfileUpdated={handleProfileUpdated}
            />
          )}
        </main>

      </div>
      
      {/* Chat Flutuante da Equipe */}
        <TeamChatWidget 
          currentUser={currentUser} 
          songsPool={songs} 
        />

    </div>
  );
}