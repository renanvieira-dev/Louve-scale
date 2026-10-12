import { supabase } from './supabase';

export const schedulesService = {
  async getSchedules() {
    const { data: schedules, error: schedError } = await supabase
      .from('schedules')
      .select(`
        *,
        schedule_members (*),
        schedule_songs (
          id,
          song_key,
          order_index,
          songs (*)
        )
      `)
      .order('event_date', { ascending: true });

    if (schedError) {
      console.error('Erro ao buscar escalas:', schedError);
      throw schedError;
    }
    return schedules || [];
  },

  // Suporte a 'type' (service ou rehearsal)
  async createSchedule({ title, event_date, notes, type = 'service', members, selectedSongs }) {
    const { data: scheduleData, error: sError } = await supabase
      .from('schedules')
      .insert([{ title, event_date, notes, type }])
      .select()
      .single();

    if (sError) throw sError;
    const scheduleId = scheduleData.id;

    if (members && members.length > 0) {
      const membersToInsert = members.map((m) => ({
        schedule_id: scheduleId,
        user_name: m.user_name,
        role: m.role,
        status: 'pending'
      }));
      const { error: mError } = await supabase
        .from('schedule_members')
        .insert(membersToInsert);
      if (mError) throw mError;
    }

    if (selectedSongs && selectedSongs.length > 0) {
      const songsToInsert = selectedSongs.map((s, index) => ({
        schedule_id: scheduleId,
        song_id: s.id,
        song_key: s.custom_key || s.default_key,
        order_index: index + 1
      }));
      const { error: soError } = await supabase
        .from('schedule_songs')
        .insert(songsToInsert);
      if (soError) throw soError;
    }

    return scheduleId;
  },

  async deleteSchedule(scheduleId) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Erro ao excluir escala:', error);
      throw error;
    }
  },

  async addSongToSchedule(scheduleId, songId, songKey, orderIndex = 0) {
    const { data, error } = await supabase
      .from('schedule_songs')
      .insert([
        {
          schedule_id: scheduleId,
          song_id: songId,
          song_key: songKey,
          order_index: orderIndex
        }
      ])
      .select(`
        id,
        song_key,
        order_index,
        songs (*)
      `)
      .single();

    if (error) {
      console.error('Erro ao vincular música à escala:', error);
      throw error;
    }
    return data;
  },

  async removeSongFromSchedule(scheduleSongId) {
    const { error } = await supabase
      .from('schedule_songs')
      .delete()
      .eq('id', scheduleSongId);

    if (error) {
      console.error('Erro ao remover música da escala:', error);
      throw error;
    }
  },

  async updateMemberStatus(memberId, status) {
    const { error } = await supabase
      .from('schedule_members')
      .update({ status })
      .eq('id', memberId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
};