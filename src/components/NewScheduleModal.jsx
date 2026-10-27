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
  Search, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  Tag,
  Pencil
} from 'lucide-react';

const SCHEDULE_ROLES = [
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

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

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

  // Voluntários da Escala (múltiplas funções)
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tempProfileId, setTempProfileId] = useState('');
  const [tempRoles, setTempRoles] = useState(['Ministro(a) de Louvor']);

  // Músicas Selecionadas
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [tempSongId, setTempSongId] = useState('');
  const [tempSongKey, setTempSongKey] = useState('');

  // Edição inline de música adicionada na escala
  const [editingSongIndex, setEditingSongIndex] = useState(null);
  const [editingKeyVal, setEditingKeyVal] = useState('C');

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
      setTempProfileId('');
      setTempRoles(['Ministro(a) de Louvor']);
      setEditingSongIndex(null);
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
    const yyyy = result.getFullYear();
    const mm = String(result.getMonth() + 1).padStart(2, '0');
    const dd = String(result.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const toggleTempRole = (role) => {
    setTempRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleAddMember = () => {
    if (!tempProfileId) {
      alert('Selecione um voluntário.');
      return;
    }

    if (tempRoles.length === 0) {
      alert('Selecione ao menos uma função para o voluntário.');
      return;
    }

    const profile = profiles.find((p) => p.id === tempProfileId);
    if (!profile) return;

    const combinedRoles = tempRoles.join(' + ');

    setSelectedMembers((prev) => [
      ...prev,
      {
        profile_id: profile.id,
        full_name: profile.full_name,
        role_in_schedule: combinedRoles
      }
    ]);

    setTempProfileId('');
    setTempRoles(['Ministro(a) de Louvor']);
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
    if (editingSongIndex === idx) setEditingSongIndex(null);
  };

  // Abrir edição do tom da música já adicionada
  const handleStartEditSong = (idx) => {
    const s = selectedSongs[idx];
    setEditingSongIndex(idx);
    setEditingKeyVal(s.song_key || s.custom_key || 'C');
  };

  // Salvar novo tom da música na escala
  const handleSaveEditedSongKey = (idx) => {
    setSelectedSongs((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, song_key: editingKeyVal, custom_key: editingKeyVal }
          : item
      )
    );
    setEditingSongIndex(null);
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
        const formatted = tracks.map((track) => ({
          title: track.trackName,
          artist: track.artistName,
          thumbnail: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb.jpg', '200x200bb.jpg') : '',
          key: 'G'
        }));
        setQuickSearchResults(formatted);
      }
    } catch (err) {
      console.error('Erro na busca rápida:', err);
    } finally {
      setQuickIsSearching(false);
    }
  };

  const handleSelectQuickTrack = async (track) => {
    setQuickTitle(track.title);
    setQuickArtist(track.artist);
    setQuickKey(track.key || 'G');
    setQuickSearchResults([]);

    try {
      const chordsRes = await fetch(`/api/chords?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      if (chordsRes.ok) {
        const chordsData = await chordsRes.json();
        if (chordsData.url) setQuickChords(chordsData.url);
        if (chordsData.key) setQuickKey(chordsData.key);
      }
    } catch (_) {}

    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.url) setQuickYoutube(data.url);
      }
    } catch (_) {}
  };

  const handleSaveAndAttachSong = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickArtist.trim()) {
      alert('Preencha o título e o artista da nova música.');
      return;
    }

    if (!onCreateSong) return;

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

        {/* Formulário com Scroll Stylizado */}
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

          {/* Título da Escala */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Título da Escala *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Culto de Celebração, Ensaio..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 sm:h-10 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Data com Botões Rápidos */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-church-blue" /> Data *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(4)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-church-border text-[11px] font-semibold text-slate-300 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Quinta
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(6)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-church-border text-[11px] font-semibold text-slate-300 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Sábado
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-church-border text-[11px] font-semibold text-slate-300 hover:text-church-blue hover:border-church-blue transition-colors cursor-pointer"
                >
                  Domingo
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 sm:h-10 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue cursor-pointer"
                style={{
                  colorScheme: 'dark',
                  WebkitAppearance: 'none'
                }}
              />
              {!date && (
                <div className="absolute left-3.5 pointer-events-none flex items-center gap-2 text-slate-500 text-xs">
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                  <span>Toque para selecionar a data</span>
                </div>
              )}
            </div>
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
                  className={`h-9 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    time === qt
                      ? 'bg-church-blue text-white shadow-sm'
                      : 'bg-church-dark border border-church-border text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {qt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Personalizado:</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-10 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-church-blue"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Observações / Orientações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Passagem de som às 17h40. Vestimenta: tons escuros."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 sm:h-10 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
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
                {showQuickAddSong ? 'Voltar ao Repertório' : '+ Cadastrar Nova Música'}
              </button>
            </div>

            {songAddedFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {songAddedFeedback}
                </span>
                <span className="text-[10px] text-emerald-300/80">Pode buscar a próxima</span>
              </div>
            )}

            {/* Painel de Cadastro Rápido */}
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
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <button
                    type="button"
                    onClick={handleQuickSearchTrack}
                    disabled={quickIsSearching || !quickSearchTerm.trim()}
                    className="px-3.5 h-10 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    {quickIsSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
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
                    className="bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <input
                    type="text"
                    value={quickArtist}
                    onChange={(e) => setQuickArtist(e.target.value)}
                    placeholder="Artista / Versão *"
                    className="bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={quickKey}
                    onChange={(e) => setQuickKey(e.target.value)}
                    className="bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white focus:outline-none focus:border-church-blue font-bold"
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
                    className="bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={quickChords}
                    onChange={(e) => setQuickChords(e.target.value)}
                    placeholder="Link Cifra Club..."
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                  <input
                    type="url"
                    value={quickYoutube}
                    onChange={(e) => setQuickYoutube(e.target.value)}
                    placeholder="Link YouTube..."
                    className="flex-1 bg-church-card border border-church-border rounded-xl px-3 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndAttachSong}
                  disabled={isSavingQuickSong || !quickTitle.trim() || !quickArtist.trim()}
                  className="w-full h-11 bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  {isSavingQuickSong ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  Salvar e Inserir na Escala
                </button>
              </div>
            ) : (
              <div className="space-y-2 bg-church-dark p-3 rounded-2xl border border-church-border">
                <select
                  value={tempSongId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    setTempSongId(sId);
                    const found = songs.find(x => x.id === sId);
                    if (found) setTempSongKey(found.default_key || 'C');
                  }}
                  className="w-full box-border bg-church-card border border-church-border rounded-xl px-3 h-11 sm:h-10 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
                >
                  <option value="">Selecione a música do repertório...</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} - {s.artist} (Tom {s.default_key || 'C'})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={tempSongKey}
                    onChange={(e) => setTempSongKey(e.target.value)}
                    className="w-32 box-border bg-church-card border border-church-border rounded-xl px-3 h-11 sm:h-10 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue font-bold flex-shrink-0"
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
                    className="flex-1 h-11 sm:h-10 px-4 bg-church-blue hover:bg-church-blue-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-600/20 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" /> Adicionar Louvor
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE MÚSICAS DA ESCALA COM EDIÇÃO */}
            {selectedSongs.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedSongs.map((song, idx) => {
                  const isEditingThis = editingSongIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl bg-church-dark border transition-all ${
                        isEditingThis
                          ? 'border-church-blue/80 shadow-md shadow-blue-600/10'
                          : 'border-church-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-bold text-slate-500 w-4">{idx + 1}.</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-white truncate leading-tight">
                              {song.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {song.artist}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-blue-950/80 border border-church-blue/40 text-blue-400">
                            {song.song_key || song.custom_key || 'C'}
                          </span>

                          {/* Botão de Editar Louvor na Escala */}
                          <button
                            type="button"
                            onClick={() => isEditingThis ? setEditingSongIndex(null) : handleStartEditSong(idx)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isEditingThis
                                ? 'bg-church-blue text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Editar tom desta música na escala"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir da Escala */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSong(idx)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-church-red text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Remover louvor da escala"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Painel Aberto de Edição de Tom */}
                      {isEditingThis && (
                        <div className="mt-2.5 pt-2.5 border-t border-church-border flex items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                              Alterar Tom:
                            </span>
                            <select
                              value={editingKeyVal}
                              onChange={(e) => setEditingKeyVal(e.target.value)}
                              className="bg-church-card border border-church-border rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-church-blue"
                            >
                              {COMMON_KEYS.map((k) => (
                                <option key={k} value={k}>
                                  Tom {k}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingSongIndex(null)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditedSongKey(idx)}
                              className="px-3 py-1 bg-church-blue hover:bg-church-blue-hover text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" /> Salvar
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
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

            <div className="space-y-3 bg-church-dark p-3 rounded-2xl border border-church-border">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">1. Selecione o Voluntário:</label>
                <select
                  value={tempProfileId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setTempProfileId(pId);
                    const found = profiles.find((p) => p.id === pId);
                    if (found && Array.isArray(found.roles) && found.roles.length > 0) {
                      setTempRoles([found.roles[0]]);
                    }
                  }}
                  className="w-full box-border bg-church-card border border-church-border rounded-xl px-3 h-11 sm:h-10 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
                >
                  <option value="">Selecione o voluntário...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({Array.isArray(p.roles) ? p.roles.join(', ') : (p.instrument_role || 'Voluntário')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-church-blue" /> 2. Funções nesta Escala (marque quantas exercer):
                  </label>
                  <span className="text-[10px] text-church-blue font-bold">
                    {tempRoles.length} marcada(s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-church-card rounded-xl border border-church-border max-h-36 overflow-y-auto">
                  {SCHEDULE_ROLES.map((r) => {
                    const isSelected = tempRoles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleTempRole(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-church-blue text-white border-church-blue shadow-sm shadow-blue-600/30'
                            : 'bg-church-dark text-slate-400 border-church-border hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={!tempProfileId}
                className="w-full h-11 sm:h-10 px-4 bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" /> Adicionar Voluntário com as Funções Acima
              </button>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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

          {/* Rodapé com Botões */}
          <div className="pt-3 border-t border-church-border flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
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