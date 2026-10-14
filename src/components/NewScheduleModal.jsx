import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Check, 
  Trash2, 
  CalendarDays, 
  Music2, 
  FileText, 
  Video,
  Search,
  Loader2,
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const SCHEDULE_ROLES = [
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

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

const DEFAULT_TONES_MAP = {
  'digno de tudo': 'D',
  'te exaltamos': 'D',
  'e ele': 'E',
  'é ele': 'E',
  'tu es + e ele': 'E',
  'tu és + é ele': 'E',
  'bondade de deus': 'G',
  'todavia me alegrarei': 'C',
  'ousado amor': 'Gb',
  'oh quao lindo': 'D',
  'oh quão lindo': 'D',
  'a bencao': 'Bb',
  'a bênção': 'Bb',
  'me atraiu': 'Em',
  'a casa e sua': 'A',
  'a casa é sua': 'A',
  'ruja o leao': 'C#m',
  'ruja o leão': 'C#m',
  'liberta-me de mim': 'G'
};

const QUICK_TIMES = ['09:00', '10:00', '18:00', '19:00', '19:30', '20:00'];

export default function NewScheduleModal({ 
  isOpen = false, 
  onClose, 
  profiles = [], 
  songs = [],
  scheduleToEdit = null,
  onSave,
  onCreateSong
}) {
  const [title, setTitle] = useState('Culto de Celebração');
  const [type, setType] = useState('service');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  // Voluntários da Escala
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tempProfileId, setTempProfileId] = useState('');
  const [tempRole, setTempRole] = useState('Backing Vocal');

  // Músicas Selecionadas
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [tempSongId, setTempSongId] = useState('');
  const [tempSongKey, setTempSongKey] = useState('');

  // Painel de Cadastro Rápido de Música
  const [showQuickAddSong, setShowQuickAddSong] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickIsSearching, setQuickIsSearching] = useState(false);
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickArtist, setQuickArtist] = useState('');
  const [quickKey, setQuickKey] = useState('G');
  const [quickChords, setQuickChords] = useState('');
  const [quickYoutube, setQuickYoutube] = useState('');
  const [quickBpm, setQuickBpm] = useState('');
  const [isSavingQuickSong, setIsSavingQuickSong] = useState(false);
  const [songAddedFeedback, setSongAddedFeedback] = useState('');

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (scheduleToEdit) {
        setTitle(scheduleToEdit.title || 'Culto de Celebração');
        setType(scheduleToEdit.type || 'service');
        setNotes(scheduleToEdit.notes || '');

        if (scheduleToEdit.event_date) {
          const d = new Date(scheduleToEdit.event_date);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setDate(`${yyyy}-${mm}-${dd}`);

          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setTime(`${hh}:${min}`);
        }

        if (scheduleToEdit.schedule_members) {
          setSelectedMembers(
            scheduleToEdit.schedule_members.map((m) => ({
              profile_id: m.profile_id,
              full_name: m.profile?.full_name || profiles.find(p => p.id === m.profile_id)?.full_name || 'Voluntário',
              role_in_schedule: m.role || 'Voluntário'
            }))
          );
        }

        if (scheduleToEdit.schedule_songs) {
          setSelectedSongs(
            scheduleToEdit.schedule_songs.map((s) => ({
              song_id: s.song_id,
              title: s.song?.title || songs.find(x => x.id === s.song_id)?.title || 'Louvor',
              artist: s.song?.artist || songs.find(x => x.id === s.song_id)?.artist || '',
              custom_key: s.song_key || s.custom_key || s.song?.default_key || 'C',
              song_key: s.song_key || s.custom_key || s.song?.default_key || 'C'
            }))
          );
        }
      } else {
        setTitle('Culto de Celebração');
        setType('service');
        setDate('');
        setTime('19:00');
        setNotes('');
        setSelectedMembers([]);
        setSelectedSongs([]);
      }
      setShowQuickAddSong(false);
      setSongAddedFeedback('');
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, scheduleToEdit]);

  if (!isOpen) return null;

  const handleSetQuickDate = (targetDayOfWeek) => {
    const today = new Date();
    const result = new Date();
    const currentDay = today.getDay();

    let daysUntil = (targetDayOfWeek - currentDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;

    result.setDate(today.getDate() + daysUntil);
    setDate(result.toISOString().split('T')[0]);
  };

  const handleAddMember = () => {
    if (!tempProfileId) {
      alert('Selecione um voluntário.');
      return;
    }

    const profile = profiles.find((p) => p.id === tempProfileId);
    if (!profile) return;

    setSelectedMembers((prev) => [
      ...prev,
      {
        profile_id: profile.id,
        full_name: profile.full_name,
        role_in_schedule: tempRole
      }
    ]);

    setTempProfileId('');
  };

  const handleRemoveMember = (idx) => {
    setSelectedMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddExistingSong = () => {
    if (!tempSongId) {
      alert('Selecione uma música do repertório.');
      return;
    }

    const song = songs.find((s) => s.id === tempSongId);
    if (!song) return;

    const chosenKey = tempSongKey || song.default_key || 'C';

    setSelectedSongs((prev) => [
      ...prev,
      {
        song_id: song.id,
        title: song.title,
        artist: song.artist,
        custom_key: chosenKey,
        song_key: chosenKey
      }
    ]);

    setTempSongId('');
    setTempSongKey('');
  };

  const handleRemoveSong = (idx) => {
    setSelectedSongs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuickSearchTrack = async (e) => {
    e?.preventDefault();
    if (!quickSearchTerm.trim()) return;

    try {
      setQuickIsSearching(true);
      setQuickSearchResults([]);
      setSongAddedFeedback('');

      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(quickSearchTerm.trim())}&entity=song&limit=6&country=BR`
      );

      if (response.ok) {
        const data = await response.json();
        const tracks = data.results || [];
        const formatted = tracks.map((track) => {
          const trackTitle = track.trackName;
          const artistName = track.artistName;

          const cleanArtist = artistName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

          const cleanSong = trackTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

          let estimatedKey = 'G';
          const normTitle = trackTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          for (const [pattern, keyVal] of Object.entries(DEFAULT_TONES_MAP)) {
            if (normTitle.includes(pattern)) {
              estimatedKey = keyVal;
              break;
            }
          }

          return {
            title: trackTitle,
            artist: artistName,
            thumbnail: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb.jpg', '200x200bb.jpg') : '',
            chordsUrl: `https://www.cifraclub.com.br/${cleanArtist}/${cleanSong}/`,
            key: estimatedKey
          };
        });
        setQuickSearchResults(formatted);
      }
    } catch (err) {
      console.error('Erro na busca rápida:', err);
    } finally {
      setQuickIsSearching(false);
    }
  };

  // Ao selecionar a versão rápida, resolve o link exato do YouTube via API
  const handleSelectQuickTrack = async (track) => {
    setQuickTitle(track.title);
    setQuickArtist(track.artist);
    setQuickChords(track.chordsUrl);
    setQuickKey(track.key || 'G');
    setQuickSearchResults([]);

    const query = `${track.title} ${track.artist} oficial`.trim();
    setQuickYoutube(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);

    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.url && data.url.includes('/watch?v=')) {
          setQuickYoutube(data.url);
        }
      }
    } catch (err) {
      console.warn('Erro ao resolver player direto na escala:', err);
    }
  };

  // Salva e anexa a música mantendo o formulário ativo para a próxima
  const handleSaveAndAttachSong = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickArtist.trim()) {
      alert('Preencha o título e o artista da nova música.');
      return;
    }

    if (!onCreateSong) {
      alert('Função de criação de música indisponível.');
      return;
    }

    try {
      setIsSavingQuickSong(true);
      const newSong = await onCreateSong({
        title: quickTitle.trim(),
        artist: quickArtist.trim(),
        default_key: quickKey,
        bpm: quickBpm ? parseInt(quickBpm, 10) : null,
        chords_url: quickChords.trim() || null,
        youtube_url: quickYoutube.trim() || null
      });

      if (newSong && newSong.id) {
        const resolvedKey = newSong.default_key || quickKey || 'C';
        setSelectedSongs((prev) => [
          ...prev,
          {
            song_id: newSong.id,
            title: newSong.title,
            artist: newSong.artist,
            custom_key: resolvedKey,
            song_key: resolvedKey
          }
        ]);
        setSongAddedFeedback(`"${newSong.title}" adicionada com sucesso!`);
      }

      setQuickTitle('');
      setQuickArtist('');
      setQuickChords('');
      setQuickYoutube('');
      setQuickBpm('');
      setQuickSearchTerm('');
      setQuickSearchResults([]);
    } catch (err) {
      console.error('Erro ao adicionar música na escala:', err);
    } finally {
      setIsSavingQuickSong(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !date) {
      alert('Preencha o título e a data da escala.');
      return;
    }

    const eventDateTime = new Date(`${date}T${time || '00:00'}:00`).toISOString();

    const payload = {
      title: title.trim(),
      type,
      event_date: eventDateTime,
      notes: notes.trim(),
      members: selectedMembers.map((m) => ({
        profile_id: m.profile_id,
        role: m.role_in_schedule,
        status: 'pending'
      })),
      songs: selectedSongs.map((s, index) => ({
        song_id: s.song_id,
        song_key: s.song_key || s.custom_key || 'C',
        order_index: index + 1
      }))
    };

    onSave(payload, scheduleToEdit?.id || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-church-card border border-church-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-church-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl bg-church-blue text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30 flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base truncate">
              {scheduleToEdit ? 'Editar Escala' : 'Nova Escala / Agendamento'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Tipo de Evento */}
          <div className="grid grid-cols-2 gap-2 bg-church-dark p-1.5 rounded-2xl border border-church-border">
            <button
              type="button"
              onClick={() => {
                setType('service');
                if (title === 'Ensaio Geral da Equipe') setTitle('Culto de Celebração');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'service'
                  ? 'bg-church-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Culto Oficial
            </button>
            <button
              type="button"
              onClick={() => {
                setType('rehearsal');
                if (title === 'Culto de Celebração') setTitle('Ensaio Geral da Equipe');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'rehearsal'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ensaio
            </button>
          </div>

          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Título da Escala *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Culto de Celebração, Ensaio Geral..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-church-blue" /> Data *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(4)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-church-border text-[10px] font-semibold text-slate-400 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Quinta
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(6)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-church-border text-[10px] font-semibold text-slate-400 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Sábado
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-church-border text-[10px] font-semibold text-slate-400 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Domingo
                </button>
              </div>
            </div>

            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-full box-border bg-church-dark border border-church-border rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Horário */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-church-blue" /> Horário
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full">
              {QUICK_TIMES.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTime(qt)}
                  className={`py-2 rounded-xl text-[11px] font-bold text-center transition-all ${
                    time === qt
                      ? 'bg-church-blue text-white shadow-sm'
                      : 'bg-church-dark border border-church-border text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {qt}
                </button>
              ))}
            </div>

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full max-w-full box-border bg-church-dark border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-church-blue"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Observações / Orientações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Passagem de som às 17h40. Vestimenta: tons escuros."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* MÚSICAS DA ESCALA */}
          <div className="pt-3 border-t border-church-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-church-blue" /> Músicas da Escala
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowQuickAddSong(!showQuickAddSong);
                  setSongAddedFeedback('');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  showQuickAddSong
                    ? 'bg-church-dark text-slate-300 border border-church-border'
                    : 'bg-church-blue/15 hover:bg-church-blue text-church-blue hover:text-white border border-church-blue/30'
                }`}
              >
                {showQuickAddSong ? (
                  <>Voltar ao Repertório</>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Cadastrar Nova Música
                  </>
                )}
              </button>
            </div>

            {songAddedFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {songAddedFeedback}
                </span>
                <span className="text-[10px] text-emerald-300/80">Pode buscar a próxima abaixo</span>
              </div>
            )}

            {/* Painel 1: Cadastro Direto */}
            {showQuickAddSong ? (
              <div className="bg-church-dark p-3.5 rounded-2xl border border-church-blue/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-church-blue" /> Cadastrar & Inserir na Escala
                  </span>
                  <span className="text-[10px] text-slate-400">Puxa cifra, vídeo e tom</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickSearchTerm}
                    onChange={(e) => setQuickSearchTerm(e.target.value)}
                    placeholder="Digite o próximo louvor..."
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <button
                    type="button"
                    onClick={handleQuickSearchTrack}
                    disabled={quickIsSearching || !quickSearchTerm.trim()}
                    className="px-3 py-1.5 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    {quickIsSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    Buscar
                  </button>
                </div>

                {quickSearchResults.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {quickSearchResults.map((track, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectQuickTrack(track)}
                        className="p-2 rounded-xl bg-church-card hover:bg-slate-800 border border-church-border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {track.thumbnail && (
                            <img src={track.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-bold text-white block truncate">{track.title}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{track.artist}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-church-blue bg-blue-950/60 px-2 py-0.5 rounded-lg border border-church-blue/30 flex-shrink-0">
                          Preencher
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Título *"
                    className="bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <input
                    type="text"
                    value={quickArtist}
                    onChange={(e) => setQuickArtist(e.target.value)}
                    placeholder="Artista / Versão *"
                    className="bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={quickKey}
                    onChange={(e) => setQuickKey(e.target.value)}
                    className="bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-blue font-bold"
                  >
                    {COMMON_KEYS.map((k) => (
                      <option key={k} value={k}>Tom {k}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={quickBpm}
                    onChange={(e) => setQuickBpm(e.target.value)}
                    placeholder="BPM (opcional)"
                    className="bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={quickChords}
                    onChange={(e) => setQuickChords(e.target.value)}
                    placeholder="Link Cifra Club..."
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <input
                    type="url"
                    value={quickYoutube}
                    onChange={(e) => setQuickYoutube(e.target.value)}
                    placeholder="Link YouTube..."
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndAttachSong}
                  disabled={isSavingQuickSong || !quickTitle.trim() || !quickArtist.trim()}
                  className="w-full py-2 bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  {isSavingQuickSong ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  Salvar e Inserir na Escala
                </button>
              </div>
            ) : (
              /* Painel 2: Repertório Existente */
              <div className="grid grid-cols-1 gap-2 bg-church-dark p-3 rounded-2xl border border-church-border">
                <select
                  value={tempSongId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    setTempSongId(sId);
                    const found = songs.find(x => x.id === sId);
                    if (found) setTempSongKey(found.default_key || 'C');
                  }}
                  className="w-full box-border bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
                >
                  <option value="">Selecione a música do repertório...</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} - {s.artist} (Tom {s.default_key || 'C'})
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={tempSongKey}
                    onChange={(e) => setTempSongKey(e.target.value)}
                    className="w-28 box-border bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue font-bold"
                  >
                    <option value="">Tom...</option>
                    {COMMON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        Tom {k}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddExistingSong}
                    className="flex-1 py-2 px-3 bg-church-blue hover:bg-church-blue-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-blue-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Louvor
                  </button>
                </div>
              </div>
            )}

            {/* Músicas já adicionadas */}
            {selectedSongs.length > 0 && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {selectedSongs.map((song, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-church-dark border border-church-border flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-bold text-white block truncate">{song.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{song.artist}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-black bg-blue-950/60 border border-church-blue/30 text-blue-400 flex-shrink-0">
                        {song.song_key || song.custom_key}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSong(idx)}
                      className="text-slate-500 hover:text-church-red p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VOLUNTÁRIOS ESCALADOS */}
          <div className="pt-3 border-t border-church-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-church-blue" /> Voluntários Escalados
              </label>
              <span className="text-[11px] text-slate-400 font-semibold">
                {selectedMembers.length} escalado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 bg-church-dark p-3 rounded-2xl border border-church-border">
              <select
                value={tempProfileId}
                onChange={(e) => setTempProfileId(e.target.value)}
                className="w-full box-border bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
              >
                <option value="">Selecione o voluntário...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({Array.isArray(p.roles) ? p.roles.join(', ') : (p.instrument_role || 'Voluntário')})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="flex-1 min-w-0 box-border bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
                >
                  {SCHEDULE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddMember}
                  className="py-2 px-3 bg-slate-900 hover:bg-church-blue text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-church-border hover:border-church-blue flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-church-dark border border-church-border flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{member.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-950/60 border border-church-blue/30 text-blue-400 truncate flex-shrink-0">
                        {member.role_in_schedule}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-slate-500 hover:text-church-red p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="pt-3 border-t border-church-border flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-church-blue hover:bg-church-blue-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {scheduleToEdit ? 'Atualizar Escala' : 'Salvar Escala'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}