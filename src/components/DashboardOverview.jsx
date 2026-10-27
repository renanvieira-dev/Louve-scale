import React, { useState } from 'react';
import { 
  Calendar, 
  Music2, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  Check, 
  X,
  CalendarDays
} from 'lucide-react';
import { schedulesService } from '../services/schedulesService';

export default function DashboardOverview({ 
  songs = [], 
  schedules = [], 
  profiles = [], 
  currentUser = null,
  onNavigate,
  onRefresh
}) {
  const [respondingId, setRespondingId] = useState(null);

  const currentUserId = currentUser?.user?.id;

  // Data de referência: Início do dia de hoje (00:00:00)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Filtrar e ordenar escalas FUTURAS da igreja em ordem cronológica crescente
  const upcomingSchedules = schedules
    .filter((s) => new Date(s.event_date) >= startOfToday)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  // A próxima escala cronológica real da igreja
  const nextUpcomingEvent = upcomingSchedules.length > 0 ? upcomingSchedules[0] : null;

  // 2. Escalas futuras onde o usuário logado está escalado
  const myUpcomingSchedules = upcomingSchedules.filter((s) =>
    s.schedule_members?.some((m) => m.profile_id === currentUserId)
  );

  // Convites com confirmação pendente para o usuário logado
  const pendingInvites = myUpcomingSchedules.filter((s) => {
    const memberRecord = s.schedule_members?.find((m) => m.profile_id === currentUserId);
    return !memberRecord?.status || memberRecord?.status === 'pending';
  });

  // Escalas já respondidas (Confirmadas ou Recusadas)
  const answeredSchedules = myUpcomingSchedules.filter((s) => {
    const memberRecord = s.schedule_members?.find((m) => m.profile_id === currentUserId);
    return memberRecord?.status === 'confirmed' || memberRecord?.status === 'declined';
  });

  // Responder convite de presença
  const handleResponse = async (scheduleId, status) => {
    if (!currentUserId) return;
    try {
      setRespondingId(`${scheduleId}-${status}`);
      await schedulesService.respondSchedule(scheduleId, currentUserId, status);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Erro ao responder escala:', err);
      alert('Não foi possível registrar a sua resposta.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. SEÇÃO DE CONVITES PENDENTES (DESTAQUE NO TOPO) */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Você tem {pendingInvites.length} nova(s) convocação(ões) para confirmar:
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingInvites.map((schedule) => {
              const myRoleRecord = schedule.schedule_members?.find((m) => m.profile_id === currentUserId);
              const eventDate = new Date(schedule.event_date);
              const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(eventDate);
              const formattedTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(eventDate);

              const isAccepting = respondingId === `${schedule.id}-confirmed`;
              const isDeclining = respondingId === `${schedule.id}-declined`;

              return (
                <div 
                  key={schedule.id}
                  className="bg-gradient-to-br from-blue-950/40 via-church-card to-church-card border-2 border-church-blue/60 p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Confirmação Pendente
                      </span>
                      <h4 className="text-lg font-black text-white mt-1.5 leading-tight">
                        {schedule.title}
                      </h4>
                      <p className="text-xs text-slate-300 capitalize mt-0.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-church-blue" />
                        {formattedDate} às {formattedTime}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 block font-semibold">Sua Função:</span>
                      <span className="text-xs font-black text-church-blue bg-blue-950/80 border border-church-blue/40 px-2.5 py-1 rounded-xl block mt-0.5">
                        {myRoleRecord?.role || 'Voluntário'}
                      </span>
                    </div>
                  </div>

                  {schedule.notes && (
                    <p className="text-xs text-slate-400 bg-church-dark/80 p-2.5 rounded-xl border border-church-border leading-relaxed">
                      {schedule.notes}
                    </p>
                  )}

                  {/* Botões de Ação */}
                  <div className="pt-2 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={!!respondingId}
                      onClick={() => handleResponse(schedule.id, 'confirmed')}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAccepting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      Aceitar Escala
                    </button>

                    <button
                      type="button"
                      disabled={!!respondingId}
                      onClick={() => handleResponse(schedule.id, 'declined')}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-church-red disabled:opacity-50 text-slate-300 hover:text-white border border-church-border hover:border-church-red font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isDeclining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 stroke-[3]" />
                      )}
                      Não Posso Ir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MINHAS PRÓXIMAS PARTICIPAÇÕES CONFIRMADAS / RECUSADAS */}
      {answeredSchedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Minha Participação nas Próximas Escalas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {answeredSchedules.map((schedule) => {
              const myRoleRecord = schedule.schedule_members?.find((m) => m.profile_id === currentUserId);
              const isConfirmed = myRoleRecord?.status === 'confirmed';
              const eventDate = new Date(schedule.event_date);
              const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(eventDate);
              const formattedTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(eventDate);

              return (
                <div
                  key={schedule.id}
                  className="p-4 rounded-2xl bg-church-card border border-church-border flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate">{schedule.title}</h4>
                    <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                      {formattedDate} às {formattedTime} • Função: <strong className="text-slate-200">{myRoleRecord?.role}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isConfirmed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-black flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Recusado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleResponse(schedule.id, isConfirmed ? 'declined' : 'confirmed')}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-[10px] cursor-pointer"
                      title="Alterar resposta"
                    >
                      Alterar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. RESUMO GERAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div 
          onClick={() => onNavigate && onNavigate('schedules')}
          className="bg-church-card border border-church-border hover:border-church-blue/50 p-5 rounded-3xl transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400">Próximas Escalas</span>
            <h3 className="text-2xl font-black text-white mt-1 group-hover:text-church-blue transition-colors">
              {upcomingSchedules.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-950/60 border border-church-blue/30 text-church-blue flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('songs')}
          className="bg-church-card border border-church-border hover:border-church-blue/50 p-5 rounded-3xl transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400">Músicas no Repertório</span>
            <h3 className="text-2xl font-black text-white mt-1 group-hover:text-church-blue transition-colors">
              {songs.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-950/60 border border-church-blue/30 text-church-blue flex items-center justify-center">
            <Music2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('members')}
          className="bg-church-card border border-church-border hover:border-church-blue/50 p-5 rounded-3xl transition-all cursor-pointer group shadow-sm flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-400">Voluntários no Louvor</span>
            <h3 className="text-2xl font-black text-white mt-1 group-hover:text-church-blue transition-colors">
              {profiles.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-950/60 border border-church-blue/30 text-church-blue flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. PRÓXIMA ESCALA REAL DA IGREJA (ORDEM CRONOLÓGICA FUTURA) */}
      <div className="bg-church-card border border-church-border rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Próxima Escala da Igreja <Calendar className="w-4 h-4 text-church-blue" />
            </h3>
            <p className="text-xs text-slate-400">Visão geral do próximo evento agendado.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('schedules')}
            className="text-xs text-church-blue hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nextUpcomingEvent ? (
          (() => {
            const eventDate = new Date(nextUpcomingEvent.event_date);
            const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(eventDate);
            const formattedTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(eventDate);

            return (
              <div className="p-4 rounded-2xl bg-church-dark border border-church-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{nextUpcomingEvent.title}</h4>
                    <span className="text-xs text-slate-400 capitalize block mt-0.5">
                      {formattedDate} às {formattedTime}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl self-start sm:self-auto ${
                    nextUpcomingEvent.type === 'rehearsal'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : 'bg-church-blue/10 text-church-blue border border-church-blue/20'
                  }`}>
                    {nextUpcomingEvent.type === 'rehearsal' ? 'Ensaio' : 'Culto Oficial'}
                  </span>
                </div>

                {nextUpcomingEvent.schedule_members && nextUpcomingEvent.schedule_members.length > 0 && (
                  <div className="pt-2 border-t border-church-border">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Equipe Escalada:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {nextUpcomingEvent.schedule_members.map((m, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-church-card border border-church-border text-[11px] text-slate-200"
                        >
                          {m.profile?.full_name || 'Voluntário'} <strong className="text-church-blue">({m.role})</strong>
                          {m.status === 'confirmed' && ' ✅'}
                          {m.status === 'declined' && ' ❌'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-5 rounded-2xl bg-church-dark border border-church-border text-center space-y-1">
            <p className="text-xs text-slate-300 font-semibold">
              Nenhuma escala futura agendada para os próximos dias.
            </p>
            <p className="text-[11px] text-slate-500">
              Todas as escalas anteriores foram movidas para o Histórico.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}