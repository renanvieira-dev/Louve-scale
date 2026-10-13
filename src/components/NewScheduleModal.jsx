import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Plus, Check, Trash2, Sparkles } from 'lucide-react';

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

export default function NewScheduleModal({ 
  isOpen, 
  onClose, 
  profiles = [], 
  onSave 
}) {
  const [title, setTitle] = useState('Culto de Celebração');
  const [type, setType] = useState('service'); // 'service' ou 'rehearsal'
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [notes, setNotes] = useState('');

  // Membros escalados: [{ profile_id, full_name, role_in_schedule }]
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Estado temporário para adicionar membro à lista
  const [tempProfileId, setTempProfileId] = useState('');
  const [tempRole, setTempRole] = useState('Backing Vocal');

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (!tempProfileId) {
      alert('Selecione um voluntário.');
      return;
    }

    const profile = profiles.find((p) => p.id === tempProfileId);
    if (!profile) return;

    // Adiciona à lista de escalados
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

    // Monta o timestamp completo ISO
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

    // Resetar
    setTitle('Culto de Celebração');
    setType('service');
    setDate('');
    setTime('19:00');
    setNotes('');
    setSelectedMembers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Nova Escala / Agendamento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Tipo de Evento (Culto ou Ensaio) */}
          <div className="grid grid-cols-2 gap-2 bg-[#0b0d0c] p-1 rounded-2xl border border-zinc-800">
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

          {/* Título do Evento */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Título da Escala *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Culto da Família, Ensaio de Sábado..."
              className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#a3e635]" /> Data *
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#a3e635]" /> Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Observações / Orientações</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Passagem de som às 18h30. Vestimenta: tons escuros."
              className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Escalação de Voluntários */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#a3e635]" /> Escalar Voluntários
              </label>
              <span className="text-[11px] text-zinc-400">
                {selectedMembers.length} escalado(s)
              </span>
            </div>

            {/* Selecionar Membro e Função (com destaque para Backing Vocal) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#0b0d0c] p-3 rounded-2xl border border-zinc-800">
              <div className="sm:col-span-6">
                <select
                  value={tempProfileId}
                  onChange={(e) => setTempProfileId(e.target.value)}
                  className="w-full bg-[#131614] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="">Selecione o voluntário...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({Array.isArray(p.roles) ? p.roles.join(', ') : (p.instrument_role || 'Voluntário')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <select
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full bg-[#131614] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                >
                  {SCHEDULE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full h-full py-2 bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-zinc-800 hover:border-[#a3e635]"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>

            {/* Lista dos Voluntários já adicionados na escala */}
            {selectedMembers.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#0b0d0c] border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{member.full_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        member.role_in_schedule.includes('Backing Vocal')
                          ? 'bg-[#a3e635]/15 border border-[#a3e635]/30 text-[#a3e635]'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}>
                        {member.role_in_schedule}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Remover da escala"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com Ações */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2">
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