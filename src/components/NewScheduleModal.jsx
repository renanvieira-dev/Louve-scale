import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Plus, Check, Trash2, CalendarDays } from 'lucide-react';

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

const QUICK_TIMES = ['09:00', '10:00', '18:00', '19:00', '19:30', '20:00'];

export default function NewScheduleModal({ 
  isOpen, 
  onClose, 
  profiles = [], 
  onSave 
}) {
  const [title, setTitle] = useState('Culto de Celebração');
  const [type, setType] = useState('service');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tempProfileId, setTempProfileId] = useState('');
  const [tempRole, setTempRole] = useState('Backing Vocal');

  if (!isOpen) return null;

  // Atalhos práticos de data (Quinta = 4, Sábado = 6, Domingo = 0)
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

  const handleRemoveMember = (indexToRemove) => {
    setSelectedMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !date) {
      alert('Preencha o título e a data da escala.');
      return;
    }

    const eventDateTime = new Date(`${date}T${time || '00:00'}:00`).toISOString();

    onSave({
      title: title.trim(),
      type,
      event_date: eventDateTime,
      notes: notes.trim(),
      members: selectedMembers.map((m) => ({
        profile_id: m.profile_id,
        role: m.role_in_schedule,
        status: 'pending'
      }))
    });

    setTitle('Culto de Celebração');
    setType('service');
    setDate('');
    setTime('19:00');
    setNotes('');
    setSelectedMembers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs shadow-md shadow-[#a3e635]/20 flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base truncate">Nova Escala / Agendamento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com scroll vertical contido */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 flex-1">
          
          {/* Tipo de Evento */}
          <div className="grid grid-cols-2 gap-2 bg-[#0b0d0c] p-1.5 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('service');
                if (title === 'Ensaio Geral da Equipe') setTitle('Culto de Celebração');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'service'
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
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
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ensaio
            </button>
          </div>

          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Título da Escala *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Culto da Família, Ensaio de Louvor..."
              className="w-full box-border bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Data e Atalhos */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#a3e635]" /> Data *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(4)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635] transition-colors cursor-pointer"
                >
                  Quinta
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(6)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635] transition-colors cursor-pointer"
                >
                  Sábado
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635] transition-colors cursor-pointer"
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
              className="w-full max-w-full box-border bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635] appearance-none"
              style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
            />
          </div>

          {/* Horário com Seleção Rápida */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#a3e635]" /> Horário
            </label>

            {/* Chips em grid flexível para caber no iPhone SE sem transbordar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full">
              {QUICK_TIMES.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTime(qt)}
                  className={`py-2 rounded-xl text-[11px] font-bold text-center transition-all ${
                    time === qt
                      ? 'bg-[#a3e635] text-black shadow-sm'
                      : 'bg-[#0b0d0c] border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
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
              className="w-full max-w-full box-border bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#a3e635] appearance-none"
              style={{ colorScheme: 'dark', WebkitAppearance: 'none' }}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Observações / Orientações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Passagem de som às 18h30. Vestimenta: tons escuros."
              className="w-full box-border bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Escalação de Voluntários */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#a3e635]" /> Escalar Voluntários
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">
                {selectedMembers.length} escalado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 bg-[#0b0d0c] p-3 rounded-2xl border border-zinc-800">
              <select
                value={tempProfileId}
                onChange={(e) => setTempProfileId(e.target.value)}
                className="w-full box-border bg-[#131614] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
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
                  className="flex-1 min-w-0 box-border bg-[#131614] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
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
                  className="py-2 px-3 bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-zinc-800 hover:border-[#a3e635] flex-shrink-0"
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
                    className="p-2.5 rounded-xl bg-[#0b0d0c] border border-zinc-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{member.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[#a3e635]/15 border border-[#a3e635]/30 text-[#a3e635] truncate flex-shrink-0">
                        {member.role_in_schedule}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                      title="Remover da escala"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com Botões */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#a3e635] hover:bg-[#b5f448] text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Salvar Escala
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}