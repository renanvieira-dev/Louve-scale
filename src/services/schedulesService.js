import { supabase } from './supabase';

export const schedulesService = {
  // Buscar escalas com dados vinculados sem quebrar por coluna ausente
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
          *,
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

  // Criar escala com inserção segura de músicas
  async createSchedule({ title, type, event_date, notes, members = [], songs = [] }) {
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .insert([{ title, type, event_date, notes }])
      .select()
      .single();

    if (schedError) throw schedError;

    // Inserir voluntários escalados
    if (members.length > 0) {
      const membersPayload = members.map((m) => ({
        schedule_id: schedule.id,
        profile_id: m.profile_id,
        role: m.role,
        status: m.status || 'pending'
      }));
      await supabase.from('schedule_members').insert(membersPayload);
    }

    // Inserir músicas escaladas (com fallback se custom_key/order_index não existirem)
    if (songs.length > 0) {
      await this._insertScheduleSongs(schedule.id, songs);
    }

    return schedule;
  },

  // Atualizar escala existente com inserção segura de músicas
  async updateSchedule(scheduleId, { title, type, event_date, notes, members = [], songs = [] }) {
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .update({ title, type, event_date, notes })
      .eq('id', scheduleId)
      .select()
      .single();

    if (schedError) throw schedError;

    // Atualizar voluntários
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

    // Atualizar músicas
    await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
    if (songs.length > 0) {
      await this._insertScheduleSongs(scheduleId, songs);
    }

    return schedule;
  },

  // Função auxiliar de inserção blindada contra erro 42703
  async _insertScheduleSongs(scheduleId, songs) {
    const fullPayload = songs.map((s, idx) => ({
      schedule_id: scheduleId,
      song_id: s.song_id,
      custom_key: s.custom_key || null,
      order_index: s.order_index || idx + 1
    }));

    const { error } = await supabase.from('schedule_songs').insert(fullPayload);

    // Se a tabela ainda não tiver custom_key ou order_index, reenvia apenas os campos padrão
    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      const minimalPayload = songs.map((s) => ({
        schedule_id: scheduleId,
        song_id: s.song_id
      }));
      const { error: retryError } = await supabase.from('schedule_songs').insert(minimalPayload);
      if (retryError) throw retryError;
    } else if (error) {
      throw error;
    }
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