// Utilitário para integração com Google Calendar e Notificações do Sistema

export function generateGoogleCalendarUrl({ title, eventDate, notes, songs = [] }) {
  const startDate = new Date(eventDate);
  // Duração estimada: 2 horas
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatTime = (d) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const datesParam = formatTime(startDate) + '/' + formatTime(endDate);

  const songsList = songs.length > 0
    ? '\n\nRepertório:\n' + songs
        .map(
          (s, i) =>
            (i + 1) + '. ' + (s.songs?.title || s.title) + ' (Tom: ' + (s.song_key || s.default_key || 'C') + ')'
        )
        .join('\n')
    : '';

  const detailsText = (notes ? notes + '\n' : '') + songsList + '\n\nAgendado via LouveScale. Lembrete: 2 horas antes.';

  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent(title) +
    '&dates=' +
    datesParam +
    '&details=' +
    encodeURIComponent(detailsText) +
    '&reminders=120';

  return url;
}

// Solicitar permissão de notificação nativa do dispositivo
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('Este dispositivo ou navegador não suporta notificações de sistema.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Agendar lembrete no celular para 2 horas antes do evento
export function scheduleLocalReminder(schedule) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const eventTime = new Date(schedule.event_date).getTime();
  const twoHoursBefore = eventTime - 2 * 60 * 60 * 1000;
  const timeUntilNotification = twoHoursBefore - Date.now();

  const formattedTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(schedule.event_date));

  if (timeUntilNotification > 0) {
    setTimeout(() => {
      new Notification('LouveScale: ' + schedule.title, {
        body: 'Faltam 2 horas para o seu compromisso! Início às ' + formattedTime + '.',
        icon: '/favicon.svg',
        badge: '/favicon.svg'
      });
    }, timeUntilNotification);
  }
}