import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Music2, 
  Calendar, 
  Sparkles, 
  Minimize2,
  Bell
} from 'lucide-react';
import { chatService } from '../services/chatService';

export default function TeamChatWidget({ currentUser, songsPool = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [suggestionType, setSuggestionType] = useState(null);
  const [selectedSong, setSelectedSong] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');

  const messagesEndRef = useRef(null);
  const myId = currentUser?.user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const requestNotifyPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showPushNotification = (newMsg) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const senderName = newMsg.sender?.full_name?.split(' ')[0] || 'Alguém da equipe';
    let bodyText = newMsg.content;

    if (newMsg.type === 'song_suggestion') {
      bodyText = `🎵 Sugeriu a música: ${newMsg.metadata?.songTitle || ''}`;
    } else if (newMsg.type === 'date_suggestion') {
      bodyText = `📅 Sugeriu uma data: ${newMsg.metadata?.date || ''}`;
    }

    try {
      const notification = new Notification(`LouveScale • ${senderName}`, {
        body: bodyText,
        icon: newMsg.sender?.avatar_url || '/logo.svg',
        badge: '/logo.svg',
        vibrate: [200, 100, 200],
        tag: 'louvescale-chat'
      });

      notification.onclick = () => {
        window.focus();
        setIsOpen(true);
        notification.close();
      };
    } catch (e) {
      console.warn('Erro na notificação:', e);
    }
  };

  useEffect(() => {
    let channel;

    const initChat = async () => {
      const initial = await chatService.getMessages();
      setMessages(initial);
      setTimeout(scrollToBottom, 100);

      channel = chatService.subscribeToMessages((newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_id !== myId) {
          if (!isOpen || document.hidden) {
            setUnreadCount((c) => c + 1);
            showPushNotification(newMsg);
          }
        }

        setTimeout(scrollToBottom, 100);
      });
    };

    if (myId) {
      initChat();
      requestNotifyPermission();
    }

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [myId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !suggestionType) return;
    if (!myId) return;

    try {
      setIsSending(true);
      let payload = {
        senderId: myId,
        content: inputText.trim(),
        type: 'text',
        metadata: {}
      };

      if (suggestionType === 'song' && selectedSong) {
        payload.type = 'song_suggestion';
        payload.metadata = { songTitle: selectedSong };
        if (!payload.content) payload.content = `Sugeri a música: ${selectedSong}`;
      } else if (suggestionType === 'date' && suggestedDate) {
        payload.type = 'date_suggestion';
        payload.metadata = { date: suggestedDate };
        if (!payload.content) payload.content = `Sugeri um culto/ensaio para a data: ${suggestedDate}`;
      }

      await chatService.sendMessage(payload);

      setInputText('');
      setSuggestionType(null);
      setSelectedSong('');
      setSuggestedDate('');
    } catch {
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante (Azul e Vermelho MI Church) */}
      {!isOpen && (
        <button
          onClick={() => {
            requestNotifyPermission();
            setIsOpen(true);
          }}
          className="fixed bottom-5 right-5 z-40 bg-church-blue hover:bg-church-blue-hover text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-blue-900/40 border-2 border-slate-900 transition-transform active:scale-95 cursor-pointer group"
          title="Abrir Chat da Equipe"
        >
          <MessageCircle className="w-6 h-6 stroke-[2.5]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-church-red text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-church-dark animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Janela de Mensagens */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-96 h-[85vh] sm:h-[530px] max-h-screen bg-church-card border border-church-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Cabeçalho */}
          <div className="px-4 py-3 bg-church-dark border-b border-church-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-church-blue text-white flex items-center justify-center font-bold">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Chat da Equipe</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-church-blue animate-pulse"></span> Em tempo real
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotifyPermission}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-church-blue transition-colors cursor-pointer"
                  title="Ativar notificações no celular"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-church-card">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sparkles className="w-8 h-8 mb-2 text-church-blue/50" />
                <p className="text-xs">Nenhuma mensagem ainda.</p>
                <p className="text-[11px] text-slate-600 mt-1">Dê um olá ou sugira um louvor para a escala!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === myId;
                const senderName = isMe ? 'Você' : (msg.sender?.full_name || 'Voluntário');
                const avatar = isMe 
                  ? currentUser?.profile?.avatar_url || currentUser?.user?.user_metadata?.avatar_url
                  : msg.sender?.avatar_url;

                const timeStr = new Intl.DateTimeFormat('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(msg.created_at));

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 mb-0.5">
                      {avatar ? (
                        <img 
                          src={avatar} 
                          alt={senderName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={`max-w-[78%] rounded-2xl p-2.5 sm:p-3 text-xs shadow-md ${
                      isMe 
                        ? 'bg-church-blue text-white rounded-br-xs shadow-blue-900/30' 
                        : 'bg-church-dark border border-church-border text-slate-100 rounded-bl-xs'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[11px] font-extrabold truncate ${
                          isMe ? 'text-white/90' : 'text-church-blue'
                        }`}>
                          {senderName}
                        </span>
                        {!isMe && msg.sender?.role === 'admin' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-church-red/20 text-church-red font-bold">
                            Admin
                          </span>
                        )}
                      </div>

                      {msg.type === 'song_suggestion' && (
                        <div className={`mb-1.5 p-2 rounded-xl flex items-center gap-2 ${
                          isMe ? 'bg-black/20 text-white' : 'bg-slate-900 border border-church-border text-slate-200'
                        }`}>
                          <Music2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-bold text-[11px] truncate">
                            {msg.metadata?.songTitle || 'Sugestão de Música'}
                          </span>
                        </div>
                      )}

                      {msg.type === 'date_suggestion' && (
                        <div className={`mb-1.5 p-2 rounded-xl flex items-center gap-2 ${
                          isMe ? 'bg-black/20 text-white' : 'bg-slate-900 border border-church-border text-slate-200'
                        }`}>
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-bold text-[11px]">
                            {msg.metadata?.date}
                          </span>
                        </div>
                      )}

                      <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                      <span className={`block text-[9px] mt-1 text-right font-medium ${
                        isMe ? 'text-white/70' : 'text-slate-500'
                      }`}>
                        {timeStr}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Atalhos */}
          <div className="px-3 py-1.5 bg-church-dark border-t border-church-border flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Sugerir:</span>
            <button
              type="button"
              onClick={() => setSuggestionType(suggestionType === 'song' ? null : 'song')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                suggestionType === 'song'
                  ? 'bg-church-blue text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-church-border'
              }`}
            >
              <Music2 className="w-3 h-3" /> Música
            </button>
            <button
              type="button"
              onClick={() => setSuggestionType(suggestionType === 'date' ? null : 'date')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                suggestionType === 'date'
                  ? 'bg-church-blue text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-church-border'
              }`}
            >
              <Calendar className="w-3 h-3" /> Data / Escala
            </button>
          </div>

          {/* Sugestão de Louvor */}
          {suggestionType === 'song' && (
            <div className="px-3 py-2 bg-church-card border-t border-church-border flex items-center gap-2 animate-in fade-in flex-shrink-0">
              <input
                type="text"
                list="chat-songs-list"
                placeholder="Nome do louvor sugerido..."
                value={selectedSong}
                onChange={(e) => setSelectedSong(e.target.value)}
                className="flex-1 bg-church-dark border border-church-border rounded-xl px-3 py-1.5 text-base sm:text-xs text-white focus:outline-none focus:border-church-blue"
              />
              <datalist id="chat-songs-list">
                {songsPool.map((s) => (
                  <option key={s.id} value={`${s.title} - ${s.artist}`} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => { setSuggestionType(null); setSelectedSong(''); }}
                className="text-slate-500 hover:text-church-red cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sugestão de Data */}
          {suggestionType === 'date' && (
            <div className="px-3 py-2 bg-church-card border-t border-church-border flex items-center gap-2 animate-in fade-in flex-shrink-0">
              <input
                type="date"
                value={suggestedDate}
                onChange={(e) => setSuggestedDate(e.target.value)}
                className="flex-1 bg-church-dark border border-church-border rounded-xl px-3 py-1.5 text-base sm:text-xs text-white focus:outline-none focus:border-church-blue"
                style={{ colorScheme: 'dark' }}
              />
              <button
                type="button"
                onClick={() => { setSuggestionType(null); setSuggestedDate(''); }}
                className="text-slate-500 hover:text-church-red cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Formulário de Envio */}
          <form onSubmit={handleSendMessage} className="p-3 bg-church-dark border-t border-church-border flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-church-card border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-church-blue"
            />
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !suggestionType)}
              className="w-9 h-9 rounded-xl bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}