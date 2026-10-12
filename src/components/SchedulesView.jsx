import React, { useState } from 'react';
import ScheduleCard from './ScheduleCard';
import NewScheduleModal from './NewScheduleModal';
import { Plus } from 'lucide-react';

export default function SchedulesView({ 
  schedules = [], 
  songs = [], 
  profiles = [],
  onAddSchedule, 
  onStatusChange, 
  onAddSongToSchedule, 
  onRemoveSongFromSchedule, 
  onDeleteSchedule,
  isAdmin = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const filteredSchedules = schedules.filter((s) => {
    if (filterType === 'service') return s.type === 'service' || !s.type;
    if (filterType === 'rehearsal') return s.type === 'rehearsal';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Escalas de Culto & Ensaios</h2>
          <p className="text-xs text-zinc-400">
            {isAdmin ? 'Gerencie voluntários e repertórios de cultos e ensaios.' : 'Consulte a escala e o repertório das ministrações.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#a3e635] hover:bg-[#b5f448] text-black px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Escala / Ensaio
          </button>
        )}
      </div>

      {/* Filtros: Todos / Cultos / Ensaios */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-zinc-100 text-black'
              : 'bg-[#131614] border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({schedules.length})
        </button>
        <button
          onClick={() => setFilterType('service')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'service'
              ? 'bg-[#a3e635] text-black'
              : 'bg-[#131614] border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Cultos ({schedules.filter(s => s.type !== 'rehearsal').length})
        </button>
        <button
          onClick={() => setFilterType('rehearsal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterType === 'rehearsal'
              ? 'bg-amber-400 text-black'
              : 'bg-[#131614] border border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Ensaios ({schedules.filter(s => s.type === 'rehearsal').length})
        </button>
      </div>

      {/* Lista de Escalas */}
      {filteredSchedules.length > 0 ? (
        <div className="space-y-4">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              songsPool={songs}
              onStatusChange={onStatusChange}
              onAddSongToSchedule={onAddSongToSchedule}
              onRemoveSongFromSchedule={onRemoveSongFromSchedule}
              onDeleteSchedule={onDeleteSchedule}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#131614] border border-zinc-800/80 rounded-3xl">
          <p className="text-zinc-400 text-sm font-medium">Nenhum evento encontrado para este filtro.</p>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs text-[#a3e635] font-semibold hover:underline cursor-pointer"
            >
              Clique aqui para criar uma escala
            </button>
          )}
        </div>
      )}

      {isAdmin && (
        <NewScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={onAddSchedule}
          songsPool={songs}
          profiles={profiles}
        />
      )}
    </div>
  );
}