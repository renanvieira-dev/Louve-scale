import React, { useState, useEffect } from 'react';
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
  ListMusic
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

const QUICK_TIMES = ['09:00', '10:00', '18:00', '19:00', '19:30', '20:00'];

export default function NewScheduleModal({ 
  isOpen = false, 
  onClose, 
  profiles = [], 
  songs = [],
  scheduleToEdit = null,
  onSave 
}) {
  const [title, setTitle] = useState('Culto de Celebração');
  const [type, setType] = useState('service');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  // Voluntários Escalados
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tempProfileId, setTempProfileId] = useState('');
  const [tempRole, setTempRole] = useState('Backing Vocal');

  // Músicas Selecionadas para a Escala
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [tempSongId, setTempSongId] = useState('');
  const [tempSongKey, setTempSongKey] = useState('');

  // Se houver scheduleToEdit, preenche os campos automaticamente
  useEffect(() => {
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

      // Membros
      if (scheduleToEdit.schedule_members) {
        setSelectedMembers(
          scheduleToEdit.schedule_members.map((m) => ({
            profile_id: m.profile_id,
            full_name: m.profile?.full_name || profiles.find(p => p.id === m.profile_id)?.full_name || 'Voluntário',
            role_in_schedule: m.role || 'Voluntário'
          }))
        );
      }

      // Músicas
      if (scheduleToEdit.schedule_songs) {
        setSelectedSongs(
          scheduleToEdit.schedule_songs.map((s) => ({
            song_id: s.song_id,
            title: s.song?.title || songs.find(x => x.id === s.song_id)?.title || 'Louvor',
            artist: s.song?.artist || songs.find(x => x.id === s.song_id)?.artist || '',
            custom_key: s.custom_key || s.song?.default_key || 'C'
          }))
        );
      }
    } else {
      // Criação limpa
      setTitle('Culto de Celebração');
      setType('service');
      setDate('');
      setTime('19:00');
      setNotes('');
      setSelectedMembers([]);
      setSelectedSongs([]);
    }
  }, [scheduleToEdit, isOpen, profiles, songs]);

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

  // Adicionar Voluntário
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

  // Adicionar Música ao Repertório da Escala
  const handleAddSong = () => {
    if (!tempSongId) {
      alert('Selecione uma música do repertório.');
      return;
    }

    const song = songs.find((s) => s.id === tempSongId);
    if (!song) return;

    setSelectedSongs((prev) => [
      ...prev,
      {
        song_id: song.id,
        title: song.title,
        artist: song.artist,
        custom_key: tempSongKey || song.default_key || 'C'
      }
    ]);

    setTempSongId('');
    setTempSongKey('');
  };

  const handleRemoveSong = (idx) => {
    setSelectedSongs((prev) => prev.filter((_, i) => i !== idx));
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
        custom_key: s.custom_key,
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

          {/* REPERTÓRIO DE LOUVORES DA ESCALA */}
          <div className="pt-3 border-t border-church-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-church-blue" /> Músicas da Escala
              </label>
              <span className="text-[11px] text-slate-400 font-semibold">
                {selectedSongs.length} música(s) no repertório
              </span>
            </div>

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
                  onClick={handleAddSong}
                  className="flex-1 py-2 px-3 bg-church-blue hover:bg-church-blue-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-blue-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Louvor
                </button>
              </div>
            </div>

            {selectedSongs.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                        {song.custom_key}
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
                      title="Remover da escala"
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