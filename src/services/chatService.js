import { supabase } from './supabase';

export const chatService = {
  // Buscar as últimas 50 mensagens
  async getMessages() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          full_name,
          avatar_url,
          roles,
          role
        )
      `)
      .order('created_at', { ascending: true })
      .limit(60);

    if (error) {
      console.error('Erro ao buscar mensagens do chat:', error);
      return [];
    }
    return data || [];
  },

  // Enviar mensagem (texto comum ou com sugestão)
  async sendMessage({ senderId, content, type = 'text', metadata = {} }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          sender_id: senderId,
          content: content.trim(),
          type,
          metadata
        }
      ])
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          full_name,
          avatar_url,
          roles,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
    return data;
  },

  // Escutar mensagens em tempo real via Realtime WebSocket
  subscribeToMessages(onNewMessage) {
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          // Busca os dados completos do remetente
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                full_name,
                avatar_url,
                roles,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNewMessage(data);
          }
        }
      )
      .subscribe();

    return channel;
  }
};