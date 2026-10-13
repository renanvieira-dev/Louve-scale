import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import NewScheduleModal from './components/NewScheduleModal';
import NewSongModal from './components/NewSongModal';
import TeamChatWidget from './components/TeamChatWidget';
import { supabase } from './services/supabase';
import { schedulesService } from './services/schedulesService';
import { Calendar, Plus, Music2, Users, ExternalLink, Trash2, Video, FileText } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Dados principais
  const [schedules, setSchedules] = useState([]);
  const [songs, setSongs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);

  // Sessão do usuário
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

  // Buscar dados
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

  // Salvar escala
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

  // Salvar música
  const handleSaveSong = async (songPayload) => {
    try {
      const { error } = await supabase
        .from('songs')
        .insert([songPayload]);

      if (error) throw error;
      await fetchData();
      setIsSongModalOpen(false);
    } catch (err) {
      console.error('Erro ao cadastrar música:', err);
      alert('Erro ao adicionar a música.');
    }
  };

  // Excluir música
  const handleDeleteSong = async (songId) => {
    if (!confirm('Tem certeza que deseja excluir esta música do repertório?')) return;
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err) {
      console.error('Erro ao excluir música:', err);
      alert('Erro ao excluir música.');
    }
  };

  // Upload avatar
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

  // Filtragem de Músicas pela busca
  const filteredSongs = songs.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.artist?.toLowerCase().includes(q) ||
      s.default_key?.toLowerCase().includes(q)
    );
  });

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

          {/* Aba de Músicas com Botão + Lista Completa */}
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

                        {/* Detalhes / BPM / Tags */}
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

                      {/* Links e Ações */}
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

          {activeTab === 'members' && (
            <div className="bg-church-card border border-church-border rounded-3xl p-8 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Equipe e Voluntários ({profiles.length} voluntários)</p>
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