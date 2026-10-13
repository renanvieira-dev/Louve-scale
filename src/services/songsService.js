import { supabase } from './supabase';

export const songsService = {
  async getSongs() {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('Erro ao buscar músicas:', error);
      throw error;
    }
    return data || [];
  },

  async addSong(songData) {
    const { data, error } = await supabase
      .from('songs')
      .insert([songData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar música:', error);
      throw error;
    }
    return data;
  },

  // Nova função para excluir música
  async deleteSong(songId) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);

    if (error) {
      console.error('Erro ao excluir música:', error);
      throw error;
    }
  }
};