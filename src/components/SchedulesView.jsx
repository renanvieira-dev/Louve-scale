import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Music2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  CalendarPlus,
  Bell
} from 'lucide-react';
import NewScheduleModal from './NewScheduleModal';
import AddSongToScheduleModal from './AddSongToScheduleModal';
import { 
  generateGoogleCalendarUrl, 
  requestNotificationPermission, 
  scheduleLocalReminder 
} from '../utils/calendarUtils';

export default function SchedulesView({
  schedules = [],
  songs = [],
  profiles = [],
  onAddSchedule,
  onDeleteSchedule,
  onStatusChange,
  onAddSongToSchedule,
  onRemoveSongFromSchedule,
  isAdmin = false
}) {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedScheduleForSong, setSelectedScheduleForSong] = useState(null);

  const handleNotificationClick = async (schedule) => {
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleLocalReminder(schedule);
      alert('Lembrete ativado! O celular irá notificá-lo 2 horas antes do evento.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Escalas e Ensaios <Calendar className="w-5 h-5 text-[#a3e635]" />
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe a formação da equipe, repertório e sincronize com a sua agenda.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#a3e635] hover:bg-[#b5f448] text-black px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Escala
          </button>
        )}
      </div>

      {/* Lista de Escalas */}
      {schedules.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schedules.map((schedule) => {
            const eventDate = new Date(schedule.event_date);
            const formattedDate = new Intl.DateTimeFormat('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short'
            }).format(eventDate);
            const formattedTime = new Intl.DateTimeFormat('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(eventDate);
            const isRehearsal = schedule.type === 'rehearsal';

            return (
              <div
                key={schedule.id}
                className="bg-[#131614] border border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        isRehearsal
                          ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                          : 'bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635]'
                      }`}
                    >
                      {isRehearsal ? 'Ensaio' : 'Culto Oficial'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {formattedDate} às {formattedTime}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir a escala "${schedule.title}"?`)) {
                              onDeleteSchedule(schedule.id);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Excluir Escala"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-tight">
                    {schedule.title}
                  </h3>

                  {schedule.notes && (
                    <p className="text-xs text-zinc-400 mt-1 italic">
                      {schedule.notes}
                    </p>
                  )}

                  {/* Músicas Vinculadas */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-[#a3e635]" /> Repertório ({schedule.schedule_songs?.length || 0})
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => setSelectedScheduleForSong(schedule.id)}
                          className="text-[11px] text-[#a3e635] hover:underline font-bold cursor-pointer"
                        >
                          + Adicionar Música
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {(schedule.schedule_songs || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#0b0d0c] border border-zinc-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white font-bold truncate">
                              {item.songs?.title || 'Música'}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate">
                              {item.songs?.artist}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-black text-[#a3e635]">
                              {item.song_key || item.songs?.default_key}
                            </span>

                            {isAdmin && (
                              <button
                                onClick={() => onRemoveSongFromSchedule(schedule.id, item.id)}
                                className="text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Voluntários Escalados */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-[#a3e635]" /> Equipe Escalada ({schedule.schedule_members?.length || 0})
                    </span>

                    <div className="space-y-1.5">
                      {(schedule.schedule_members || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#0b0d0c] border border-zinc-800/60 text-xs"
                        >
                          <div>
                            <span className="text-white font-bold block">{m.profiles?.full_name || 'Membro'}</span>
                            <span className="text-[10px] text-[#a3e635]">{m.role}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {m.status === 'confirmed' && (
                              <span className="flex items-center gap-1 text-[10px] text-[#a3e635] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                              </span>
                            )}
                            {m.status === 'declined' && (
                              <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                                <XCircle className="w-3.5 h-3.5" /> Recusado
                              </span>
                            )}
                            {m.status === 'pending' && (
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                <HelpCircle className="w-3.5 h-3.5" /> Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Barra de Sincronização: Google Agenda e Notificação 2h */}
                <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <a
                    href={generateGoogleCalendarUrl({
                      title: schedule.title,
                      eventDate: schedule.event_date,
                      notes: schedule.notes,
                      songs: schedule.schedule_songs || []
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-800 hover:border-[#a3e635]"
                    title="Adicionar evento ao Google Agenda com lembrete de 2 horas"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Google Agenda (Alerta 2h)
                  </a>

                  <button
                    type="button"
                    onClick={() => handleNotificationClick(schedule)}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#a3e635] text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-800"
                    title="Ativar notificação nativa no celular 2 horas antes"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Lembrete Celular
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-[#131614] border border-zinc-800/80 rounded-3xl">
          <p className="text-zinc-400 text-sm font-medium">Nenhuma escala cadastrada no momento.</p>
        </div>
      )}

      {/* Modal de Criação de Escala */}
      {isAdmin && (
        <NewScheduleModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          profiles={profiles}
          onSave={onAddSchedule}
        />
      )}

      {/* Modal de Adicionar Música à Escala */}
      {selectedScheduleForSong && (
        <AddSongToScheduleModal
          isOpen={Boolean(selectedScheduleForSong)}
          onClose={() => setSelectedScheduleForSong(null)}
          songsPool={songs}
          onConfirm={(payload) => {
            const currentSched = schedules.find((s) => s.id === selectedScheduleForSong);
            const nextOrder = (currentSched?.schedule_songs?.length || 0) + 1;
            onAddSongToSchedule(selectedScheduleForSong, payload, nextOrder);
            setSelectedScheduleForSong(null);
          }}
        />
      )}
    </div>
  );
}