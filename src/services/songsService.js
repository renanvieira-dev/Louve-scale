import { supabase } from './supabase';

export const songsService = {
  // Obter todas as músicas ordenadas por data de criação
  async getSongs() {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao procurar músicas:', error);
      throw error;
    }
    return data;
  },

  // Adicionar uma nova música
  async addSong(song) {
    const { data, error } = await supabase
      .from('songs')
      .insert([
        {
          title: song.title,
          artist: song.artist,
          default_key: song.default_key,
          bpm: song.bpm,
          tag: song.tag,
          chords_url: song.chords_url || null,
          youtube_url: song.youtube_url || null,
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao adicionar música:', error);
      throw error;
    }
    return data[0];
  },

  // Remover uma música
  async deleteSong(id) {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao eliminar música:', error);
      throw error;
    }
  }
};