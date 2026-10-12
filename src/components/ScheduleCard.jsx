import React, { useState } from 'react';
import { Calendar, Clock, Music2, Users, Check, X, ChevronDown, ChevronUp, Play, Music, Plus, Trash2 } from 'lucide-react';
import AddSongToScheduleModal from './AddSongToScheduleModal';

export default function ScheduleCard({ 
  schedule, 
  songsPool = [], 
  onStatusChange, 
  onAddSongToSchedule, 
  onRemoveSongFromSchedule, 
  onDeleteSchedule,
  isAdmin = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isRehearsal = schedule.type === 'rehearsal';

  const dateObj = new Date(schedule.event_date);
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(dateObj);

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);

  const members = schedule.schedule_members || [];
  const songs = schedule.schedule_songs || [];
  const confirmedCount = members.filter(m => m.status === 'confirmed').length;

  const handleModalConfirm = async (payload) => {
    await onAddSongToSchedule(schedule.id, payload, songs.length + 1);
  };

  return (
    <div className={`bg-[#131614] border rounded-3xl p-5 sm:p-6 transition-all ${
      isRehearsal 
        ? 'border-amber-500/30 hover:border-amber-400/60' 
        : 'border-zinc-800/80 hover:border-[#a3e635]/50'
    }`}>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {/* Tag Tipo: Culto ou Ensaio */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-extrabold text-xs text-black ${
              isRehearsal ? 'bg-amber-400' : 'bg-[#a3e635]'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              {isRehearsal ? 'Ensaio • ' : 'Culto • '}{formattedDate}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs">
              <Clock className={`w-3.5 h-3.5 ${isRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`} />
              {formattedTime}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">{schedule.title}</h3>
          {schedule.notes && (
            <p className="text-xs text-zinc-400 mt-1">{schedule.notes}</p>
          )}
        </div>

        {/* Resumo de Presenças, Excluir e Expandir */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-xs font-bold ${isRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`}>
              {confirmedCount}/{members.length}
            </span>
            <span className="text-[11px] text-zinc-500 block">confirmados</span>
          </div>

          {isAdmin && onDeleteSchedule && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Tem a certeza que deseja eliminar "${schedule.title}"?`)) {
                  onDeleteSchedule(schedule.id);
                }
              }}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-red-500/20 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          
          {/* Repertório */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music2 className={`w-4 h-4 ${isRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`} />
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Músicas a Ensaiar / Tocar ({songs.length})
                </h4>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold text-black px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer ${
                    isRehearsal ? 'bg-amber-400 hover:bg-amber-300' : 'bg-[#a3e635] hover:bg-[#b5f448]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Adicionar Música
                </button>
              )}
            </div>

            <div className="space-y-2">
              {songs.length > 0 ? (
                songs.map((item, idx) => {
                  const song = item.songs;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#0b0d0c] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{song?.title || 'Música'}</p>
                          <span className="text-[10px] text-zinc-400">{song?.artist}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] text-[10px] font-bold">
                          Tom: {item.song_key}
                        </span>
                        {song?.chords_url && (
                          <a
                            href={song.chords_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
                            title="Ver Cifra"
                          >
                            <Music className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {song?.youtube_url && (
                          <a
                            href={song.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-900 text-[#a3e635] hover:text-white"
                            title="Ouvir Áudio"
                          >
                            <Play className="w-3.5 h-3.5 fill-[#a3e635]" />
                          </a>
                        )}
                        
                        {isAdmin && onRemoveSongFromSchedule && (
                          <button
                            type="button"
                            onClick={() => onRemoveSongFromSchedule(schedule.id, item.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-400 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 italic py-2">
                  {isAdmin ? 'Nenhuma música vinculada ainda. Clique em "+ Adicionar Música" acima.' : 'Nenhuma música definida ainda.'}
                </p>
              )}
            </div>
          </div>

          {/* Equipe Escalada */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${isRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`} />
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Equipe Escalada ({members.length})
              </h4>
            </div>

            <div className="space-y-2">
              {members.length > 0 ? (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#0b0d0c] border border-zinc-800/80"
                  >
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{m.user_name}</p>
                      <span className={`text-[10px] font-semibold ${isRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`}>
                        {m.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                        m.status === 'confirmed'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : m.status === 'declined'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-zinc-850 text-zinc-400 border border-zinc-800'
                      }`}>
                        {m.status === 'confirmed' ? 'Confirmado' : m.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </span>

                      <button
                        onClick={() => onStatusChange(m.id, 'confirmed')}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-green-500/20 text-zinc-400 hover:text-green-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Marcar como Confirmado"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onStatusChange(m.id, 'declined')}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        title="Marcar como Recusado"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic py-2">Nenhum voluntário escalado.</p>
              )}
            </div>
          </div>

        </div>
      )}

      <AddSongToScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        songsPool={songsPool}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}