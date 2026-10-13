import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import NewScheduleModal from './components/NewScheduleModal';
import TeamChatWidget from './components/TeamChatWidget';
import { supabase } from './services/supabase';
import { schedulesService } from './services/schedulesService';
import { Calendar, Plus, Music2, Users, Search } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Dados principais
  const [schedules, setSchedules] = useState([]);
  const [songs, setSongs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de controle de Modais (declarados explicitamente para evitar ReferenceError)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Verificar sessão do usuário
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setCurrentUser({ user: session.user, profile: profile || {} });
      }
      setLoading(false);
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

  // Carregar dados da aplicação
  const fetchData = async () => {
    try {
      // 1. Buscar perfis
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (profilesData) setProfiles(profilesData);

      // 2. Buscar músicas
      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true });
      if (songsData) setSongs(songsData);

      // 3. Buscar escalas
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

  // Salvar nova escala
  const handleSaveSchedule = async (schedulePayload) => {
    try {
      await schedulesService.createSchedule(schedulePayload);
      await fetchData();
      setIsScheduleModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar escala:', err);
      alert('Erro ao salvar a escala. Verifique as informações.');
    }
  };

  // Upload de avatar
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-church-dark flex items-center justify-center text-slate-400">
        Carregando LouveScale...
      </div>
    );
  }

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
          {activeTab === 'dashboard' && (
            <DashboardOverview
              songs={songs}
              schedules={schedules}
              profiles={profiles}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

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

          {activeTab === 'songs' && (
            <div className="bg-church-card border border-church-border rounded-3xl p-8 text-center text-slate-400">
              <Music2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Repertório de Louvor ({songs.length} cadastradas)</p>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-church-card border border-church-border rounded-3xl p-8 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Equipe e Voluntários ({profiles.length} voluntários)</p>
            </div>
          )}
        </main>

        {/* Modal de Nova Escala */}
        <NewScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          profiles={profiles}
          onSave={handleSaveSchedule}
        />

        {/* Chat Flutuante da Equipe (Auto-contido) */}
        <TeamChatWidget
          currentUser={currentUser}
          songsPool={songs}
        />

      </div>
    </div>
  );
}