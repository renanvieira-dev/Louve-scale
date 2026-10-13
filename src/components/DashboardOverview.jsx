import React from 'react';
import { 
  Music2, 
  Calendar, 
  Users, 
  Cake, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

export default function DashboardOverview({ 
  songs = [], 
  schedules = [], 
  profiles = [], 
  onNavigate,
  isAdmin = false,
  onOpenTeamManagement
}) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0 a 11
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(currentDate);

  // Filtrar aniversariantes do mês atual
  const birthdayMembers = profiles.filter((member) => {
    if (!member.birth_date) return false;
    const parts = member.birth_date.split('-'); // YYYY-MM-DD
    if (parts.length < 3) return false;
    const birthMonth = parseInt(parts[1], 10) - 1;
    return birthMonth === currentMonth;
  }).map((member) => {
    const parts = member.birth_date.split('-');
    const day = parseInt(parts[2], 10);
    const isToday = day === currentDate.getDate();
    return {
      ...member,
      day,
      isToday
    };
  }).sort((a, b) => a.day - b.day);

  // Encontrar o próximo evento futuro (culto ou ensaio)
  const nextSchedule = schedules
    .filter(s => new Date(s.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))[0] || schedules[0];

  let nextFormattedDate = '';
  let nextFormattedTime = '';
  if (nextSchedule) {
    const d = new Date(nextSchedule.event_date);
    nextFormattedDate = new Intl.DateTimeFormat('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    }).format(d);
    nextFormattedTime = new Intl.DateTimeFormat('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(d);
  }

  const isNextRehearsal = nextSchedule?.type === 'rehearsal';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Mensagem de Boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Painel Geral <Sparkles className="w-5 h-5 text-[#a3e635]" />
          </h2>
          <p className="text-xs text-zinc-400">
            Visão consolidada da equipe de louvor, repertório e escalas de culto e ensaio.
          </p>
        </div>
      </div>

      {/* Cartões de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Métrica 1: Repertório */}
        <div 
          onClick={() => onNavigate('songs')}
          className="bg-[#131614] border border-zinc-800/80 hover:border-[#a3e635]/60 p-5 rounded-3xl cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total no Repertório</span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900 group-hover:bg-[#a3e635] flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                <Music2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{songs.length}</span>
              <span className="text-[11px] font-bold text-[#a3e635] group-hover:underline flex items-center gap-1">
                Ver repertório <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Métrica 2: Escalas e Ensaios */}
        <div 
          onClick={() => onNavigate('schedules')}
          className="bg-[#131614] border border-zinc-800/80 hover:border-[#a3e635]/60 p-5 rounded-3xl cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Escalas Cadastradas</span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900 group-hover:bg-[#a3e635] flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{schedules.length}</span>
              <span className="text-[11px] font-bold text-[#a3e635] group-hover:underline flex items-center gap-1">
                Ver escalas <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Métrica 3: Voluntários + Botão de Gerenciamento para Admin */}
        <div className="bg-[#131614] border border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Voluntários na Equipe</span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400">
                <Users className="w-4 h-4 text-[#a3e635]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{profiles.length || 1}</span>
              <span className="text-[11px] text-zinc-500">Membros ativos</span>
            </div>
          </div>

          {isAdmin && onOpenTeamManagement && (
            <button
              onClick={onOpenTeamManagement}
              className="mt-3 w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800 hover:border-[#a3e635]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Gerenciar Acessos
            </button>
          )}
        </div>

      </div>

      {/* Grade Principal: Próximo Culto/Ensaio e Aniversariantes do Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximo Culto / Ensaio */}
        <div className="bg-[#131614] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isNextRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {isNextRehearsal ? 'Próximo Ensaio' : 'Próximo Culto'}
                </h3>
              </div>
              {nextSchedule && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                  isNextRehearsal
                    ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                    : 'bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635]'
                }`}>
                  {nextFormattedDate}
                </span>
              )}
            </div>

            {nextSchedule ? (
              <div className="p-4 rounded-2xl bg-[#0b0d0c] border border-zinc-800/80 space-y-3">
                <div>
                  <h4 className="text-base font-extrabold text-white">{nextSchedule.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${isNextRehearsal ? 'text-amber-400' : 'text-[#a3e635]'}`} /> 
                      {nextFormattedTime}
                    </span>
                    {nextSchedule.notes && (
                      <span className="text-xs text-zinc-500">• {nextSchedule.notes}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span>Repertório: <strong className="text-white">{nextSchedule.schedule_songs?.length || 0} músicas</strong></span>
                  <span>Equipe: <strong className="text-white">{nextSchedule.schedule_members?.length || 0} escalados</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-6">Nenhum evento agendado no momento.</p>
            )}
          </div>

          <button
            onClick={() => onNavigate('schedules')}
            className="mt-4 w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-[#a3e635] text-zinc-300 hover:text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Acessar todas as escalas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aniversariantes do Mês */}
        <div className="bg-[#131614] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-[#a3e635]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Aniversariantes de {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </h3>
              </div>
              <span className="text-xs font-bold text-[#a3e635] bg-[#a3e635]/10 px-2.5 py-1 rounded-xl border border-[#a3e635]/20">
                {birthdayMembers.length} {birthdayMembers.length === 1 ? 'aniversariante' : 'aniversariantes'}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {birthdayMembers.length > 0 ? (
                birthdayMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      member.isToday
                        ? 'bg-[#182315] border-[#a3e635] shadow-sm shadow-[#a3e635]/20'
                        : 'bg-[#0b0d0c] border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        member.isToday 
                          ? 'bg-[#a3e635] text-black animate-pulse'
                          : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      }`}>
                        Dia {member.day}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white leading-tight">{member.full_name}</h4>
                          {member.isToday && (
                            <span className="text-[10px] font-extrabold bg-[#a3e635] text-black px-1.5 py-0.2 rounded-md">
                              Hoje! 🎉
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#a3e635] font-medium">
                          {Array.isArray(member.roles) ? member.roles.join(', ') : (member.instrument_role || 'Membro')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Cake className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Nenhum aniversariante cadastrado para este mês.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">As datas de nascimento cadastradas aparecerão aqui.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}