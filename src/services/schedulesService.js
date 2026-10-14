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

  // Inserção segura na tabela schedule_songs preenchendo a coluna obrigatória song_key
  async _insertScheduleSongs(scheduleId, songs) {
    if (!songs || songs.length === 0) return;

    const payload = songs.map((s) => {
      const resolvedKey = s.song_key || s.custom_key || s.song?.default_key || 'C';
      return {
        schedule_id: scheduleId,
        song_id: s.song_id,
        song_key: resolvedKey
      };
    });

    const { error } = await supabase.from('schedule_songs').insert(payload);
    if (error) {
      console.error('Erro ao salvar músicas da escala:', error);
      throw error;
    }
  },

  // Criar nova escala
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

    // Inserir músicas escaladas
    if (songs.length > 0) {
      await this._insertScheduleSongs(schedule.id, songs);
    }

    return schedule;
  },

  // Atualizar escala existente
  async updateSchedule(scheduleId, { title, type, event_date, notes, members = [], songs = [] }) {
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .update({ title, type, event_date, notes })
      .eq('id', scheduleId)
      .select()
      .single();

    if (schedError) throw schedError;

    // Atualizar voluntários: deleta os anteriores e reinsere a lista atual
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

    // Atualizar músicas: deleta as anteriores e reinsere a lista atual
    await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
    if (songs.length > 0) {
      await this._insertScheduleSongs(scheduleId, songs);
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