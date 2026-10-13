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
  async createSchedule({ title, type, event_date, notes, members = [] }) {
    // 1. Criar o registo principal da escala
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .insert([
        {
          title: title.trim(),
          type: type || 'service',
          event_date,
          notes: notes?.trim() || null
        }
      ])
      .select()
      .single();

    if (scheduleError) {
      console.error('Erro ao inserir em schedules:', scheduleError);
      throw new Error(`Erro na escala: ${scheduleError.message}`);
    }

    // 2. Se houver voluntários escalados, inserir em schedule_members
    if (members && members.length > 0 && scheduleData?.id) {
      const payload = members.map((m) => ({
        schedule_id: scheduleData.id,
        profile_id: m.profile_id,
        role: m.role || 'Voluntário',
        status: m.status || 'pending'
      }));

      const { error: membersError } = await supabase
        .from('schedule_members')
        .insert(payload);

      if (membersError) {
        console.error('Erro detalhado em schedule_members:', membersError);
        throw new Error(`Erro ao vincular voluntários: ${membersError.message}`);
      }
    }

    return scheduleData;
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