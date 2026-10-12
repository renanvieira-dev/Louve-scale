import React, { useState } from 'react';
import { X, CalendarDays, Plus, Trash2, Users } from 'lucide-react';

export default function NewScheduleModal({ isOpen, onClose, onSave, songsPool = [], profiles = [] }) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState('service'); // 'service' = Culto, 'rehearsal' = Ensaio

  // Voluntário selecionado
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [members, setMembers] = useState([]);

  // Repertório selecionado
  const [selectedSongs, setSelectedSongs] = useState([]);

  if (!isOpen) return null;

  const currentProfile = profiles.find(p => p.id === selectedProfileId);
  const currentAvailableRoles = currentProfile?.roles || (currentProfile?.instrument_role ? [currentProfile.instrument_role] : ['Vocal / Ministro(a)']);

  const handleProfileSelect = (pId) => {
    setSelectedProfileId(pId);
    const p = profiles.find(item => item.id === pId);
    if (p) {
      const rolesList = p.roles || [p.instrument_role || 'Vocal / Ministro(a)'];
      setSelectedRole(rolesList[0] || 'Vocal / Ministro(a)');
    }
  };

  const handleAddMember = () => {
    if (!currentProfile) return;
    
    if (members.some(m => m.user_name === currentProfile.full_name)) {
      alert('Este voluntário já está escalado.');
      return;
    }

    setMembers([...members, { 
      user_name: currentProfile.full_name, 
      role: selectedRole || currentAvailableRoles[0] 
    }]);

    setSelectedProfileId('');
    setSelectedRole('');
  };

  const handleRemoveMember = (idx) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleToggleSong = (song) => {
    const exists = selectedSongs.find(s => s.id === song.id);
    if (exists) {
      setSelectedSongs(selectedSongs.filter(s => s.id !== song.id));
    } else {
      setSelectedSongs([...selectedSongs, { ...song, custom_key: song.default_key }]);
    }
  };

  const handleKeyChange = (songId, newKey) => {
    setSelectedSongs(selectedSongs.map(s => s.id === songId ? { ...s, custom_key: newKey } : s));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    onSave({
      title,
      event_date: new Date(eventDate).toISOString(),
      notes,
      type,
      members,
      selectedSongs
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              type === 'rehearsal' ? 'bg-amber-400 text-black' : 'bg-[#a3e635] text-black'
            }`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">
              {type === 'rehearsal' ? 'Nova Escala de Ensaio' : 'Nova Escala de Culto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {/* Seletor Tipo: Culto vs Ensaio */}
          <div className="flex bg-[#0b0d0c] p-1.5 rounded-2xl border border-zinc-800 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setType('service');
                if (title.startsWith('Ensaio')) setTitle('Culto de Celebração');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'service'
                  ? 'bg-[#a3e635] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Culto / Celebração
            </button>
            <button
              type="button"
              onClick={() => {
                setType('rehearsal');
                if (title === '' || title === 'Culto de Celebração') setTitle('Ensaio Geral da Equipe');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'rehearsal'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ensaio da Equipe
            </button>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Título do Evento *</label>
              <input
                required
                type="text"
                placeholder={type === 'rehearsal' ? 'Ex: Ensaio de Quinta-feira' : 'Ex: Culto de Celebração'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Data e Horário *</label>
              <input
                required
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300">Observações (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Chegar com 15 minutos de antecedência para aquecimento."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              />
            </div>
          </div>

          {/* Escalar Membros com Funções Específicas */}
          <div className="space-y-3 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#a3e635] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 1. Escalar Voluntários Cadastrados
              </h4>
              <span className="text-[10px] text-zinc-400">Escolha a função dele para este dia</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProfileId}
                onChange={(e) => handleProfileSelect(e.target.value)}
                className="flex-1 bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
              >
                <option value="">Selecione um voluntário...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({Array.isArray(p.roles) ? p.roles.join(', ') : p.instrument_role})
                  </option>
                ))}
              </select>

              <select
                disabled={!selectedProfileId}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-[#a3e635] font-bold focus:outline-none focus:border-[#a3e635] disabled:opacity-40"
              >
                {currentAvailableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedProfileId}
                onClick={handleAddMember}
                className="px-4 py-2 bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                Escalar
              </button>
            </div>

            {/* Voluntários escalados */}
            <div className="flex flex-wrap gap-2 pt-1">
              {members.map((m, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0b0d0c] border border-zinc-800 text-xs text-white"
                >
                  <strong className="text-zinc-200">{m.user_name}</strong>
                  <span className="text-[#a3e635] text-[11px] font-bold">({m.role})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-zinc-500 hover:text-red-400 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Selecionar Repertório */}
          <div className="space-y-3 pt-3 border-t border-zinc-800/60">
            <h4 className="text-xs font-bold text-[#a3e635] uppercase tracking-wider">
              2. Repertório / Músicas ({selectedSongs.length} escolhidas)
            </h4>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {songsPool.map((song) => {
                const isSelected = selectedSongs.some(s => s.id === song.id);
                const currentSelected = selectedSongs.find(s => s.id === song.id);

                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#181d1a] border-[#a3e635]/60'
                        : 'bg-[#0b0d0c] border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleSong(song)}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-xs font-bold text-white">{song.title}</p>
                      <span className="text-[10px] text-zinc-400">{song.artist} • Tom: {song.default_key}</span>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">Tom:</span>
                        <input
                          type="text"
                          value={currentSelected?.custom_key || song.default_key}
                          onChange={(e) => handleKeyChange(song.id, e.target.value)}
                          className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-center text-[#a3e635] font-bold"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                type === 'rehearsal'
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-[#a3e635] text-black hover:bg-[#b5f448]'
              }`}
            >
              {type === 'rehearsal' ? 'Criar Escala de Ensaio' : 'Criar Escala de Culto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}