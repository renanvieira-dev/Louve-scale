import { supabase } from './supabase';

export const schedulesService = {
  // Buscar escalas com voluntários e músicas associadas
  async getSchedules() {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        schedule_members (
          id,
          profile_id,
          role,
          status,
          profile:profiles ( id, full_name, avatar_url, instrument_role, roles )
        ),
        schedule_songs (
          id,
          song_id,
          custom_key,
          order_index,
          song:songs ( id, title, artist, default_key, chords_url, youtube_url )
        )
      `)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar escalas:', error);
      throw error;
    }
    return data || [];
  },

  // Criar nova escala
  async createSchedule({ title, type, event_date, notes, members = [], songs = [] }) {
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .insert([{ title, type, event_date, notes }])
      .select()
      .single();

    if (schedError) throw schedError;

    // Inserir membros escalados
    if (members.length > 0) {
      const membersPayload = members.map((m) => ({
        schedule_id: schedule.id,
        profile_id: m.profile_id,
        role: m.role,
        status: m.status || 'pending'
      }));
      await supabase.from('schedule_members').insert(membersPayload);
    }

    // Inserir músicas escaladas
    if (songs.length > 0) {
      const songsPayload = songs.map((s, idx) => ({
        schedule_id: schedule.id,
        song_id: s.song_id,
        custom_key: s.custom_key,
        order_index: s.order_index || idx + 1
      }));
      await supabase.from('schedule_songs').insert(songsPayload);
    }

    return schedule;
  },

  // Atualizar escala existente (RESOLVE O ERRO updateSchedule is not a function)
  async updateSchedule(scheduleId, { title, type, event_date, notes, members = [], songs = [] }) {
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .update({ title, type, event_date, notes })
      .eq('id', scheduleId)
      .select()
      .single();

    if (schedError) throw schedError;

    // Atualiza membros: remove os antigos e insere a nova lista
    await supabase.from('schedule_members').delete().eq('schedule_id', scheduleId);
    if (members.length > 0) {
      const membersPayload = members.map((m) => ({
        schedule_id: scheduleId,
        profile_id: m.profile_id,
        role: m.role,
        status: m.status || 'pending'
      }));
      await supabase.from('schedule_members').insert(membersPayload);
    }

    // Atualiza músicas: remove as antigas e insere a nova lista
    await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
    if (songs.length > 0) {
      const songsPayload = songs.map((s, idx) => ({
        schedule_id: scheduleId,
        song_id: s.song_id,
        custom_key: s.custom_key,
        order_index: s.order_index || idx + 1
      }));
      await supabase.from('schedule_songs').insert(songsPayload);
    }

    return schedule;
  },

  // Excluir escala
  async deleteSchedule(scheduleId) {
    await supabase.from('schedule_members').delete().eq('schedule_id', scheduleId);
    await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) throw error;
    return true;
  }
};