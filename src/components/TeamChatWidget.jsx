import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Music2, 
  Calendar, 
  Sparkles, 
  Minimize2,
  Bell,
  Plus,
  Trash2,
  ListMusic
} from 'lucide-react';
import { chatService } from '../services/chatService';

export default function TeamChatWidget({ currentUser, songsPool = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estados para MÚLTIPLAS sugestões dinâmicas (sem limite)
  const [isSuggestingSongs, setIsSuggestingSongs] = useState(false);
  const [isSuggestingDates, setIsSuggestingDates] = useState(false);

  // Arrays de sugestões acumuladas antes do envio
  const [suggestedSongsList, setSuggestedSongsList] = useState([]);
  const [tempSongInput, setTempSongInput] = useState('');

  const [suggestedDatesList, setSuggestedDatesList] = useState([]);
  const [tempDateInput, setTempDateInput] = useState('');

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
    if (typeof window !== 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const senderName = newMsg.sender?.full_name?.split(' ')[0] || 'Alguém da equipe';
    let bodyText = newMsg.content;

    if (newMsg.type === 'suggestions_bundle') {
      const countSongs = newMsg.metadata?.songs?.length || 0;
      const countDates = newMsg.metadata?.dates?.length || 0;
      bodyText = `Sugestão: ${countSongs ? `${countSongs} música(s)` : ''} ${countDates ? `${countDates} data(s)` : ''}`;
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
      console.warn('Erro ao disparar notificação local:', e);
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

  // Adicionar música na lista de sugestões pendentes
  const handleAddSongToDraft = (songTitle) => {
    const val = (songTitle || tempSongInput).trim();
    if (!val) return;
    if (!suggestedSongsList.includes(val)) {
      setSuggestedSongsList((prev) => [...prev, val]);
    }
    setTempSongInput('');
  };

  const handleRemoveSongFromDraft = (indexToRemove) => {
    setSuggestedSongsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Adicionar data na lista de sugestões pendentes
  const handleAddDateToDraft = () => {
    if (!tempDateInput) return;
    if (!suggestedDatesList.includes(tempDateInput)) {
      setSuggestedDatesList((prev) => [...prev, tempDateInput]);
    }
    setTempDateInput('');
  };

  const handleRemoveDateFromDraft = (indexToRemove) => {
    setSuggestedDatesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Envio de mensagem com suporte a múltiplas sugestões sem limites
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasSongs = suggestedSongsList.length > 0;
    const hasDates = suggestedDatesList.length > 0;
    const hasText = inputText.trim().length > 0;

    if (!hasText && !hasSongs && !hasDates) return;
    if (!myId) return;

    try {
      setIsSending(true);

      let msgType = 'text';
      let metadata = {};

      if (hasSongs || hasDates) {
        msgType = 'suggestions_bundle';
        metadata = {
          songs: suggestedSongsList,
          dates: suggestedDatesList
        };
      }

      let contentToSend = inputText.trim();
      if (!contentToSend) {
        if (hasSongs && hasDates) {
          contentToSend = `Sugestão de repertório (${suggestedSongsList.length} músicas) e datas (${suggestedDatesList.length} opções):`;
        } else if (hasSongs) {
          contentToSend = `Sugeri ${suggestedSongsList.length} louvor(es) para o repertório:`;
        } else if (hasDates) {
          contentToSend = `Sugeri ${suggestedDatesList.length} data(s) para alinhamento:`;
        }
      }

      await chatService.sendMessage({
        senderId: myId,
        content: contentToSend,
        type: msgType,
        metadata
      });

      // Limpar todos os estados
      setInputText('');
      setSuggestedSongsList([]);
      setSuggestedDatesList([]);
      setTempSongInput('');
      setTempDateInput('');
      setIsSuggestingSongs(false);
      setIsSuggestingDates(false);
    } catch {
      alert('Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  const hasPendingSuggestions = suggestedSongsList.length > 0 || suggestedDatesList.length > 0;

  return (
    <>
      {/* Botão Flutuante (FAB) */}
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
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-[410px] h-[85vh] sm:h-[560px] max-h-screen bg-church-card border border-church-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
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

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-church-card">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sparkles className="w-8 h-8 mb-2 text-church-blue/50" />
                <p className="text-xs">Nenhuma mensagem ainda.</p>
                <p className="text-[11px] text-slate-600 mt-1">Sugira louvores ou mande uma mensagem para os voluntários!</p>
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

                const bundleSongs = msg.metadata?.songs || [];
                const bundleDates = msg.metadata?.dates || [];

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

                    <div className={`max-w-[82%] rounded-2xl p-2.5 sm:p-3 text-xs shadow-md ${
                      isMe 
                        ? 'bg-church-blue text-white rounded-br-xs shadow-blue-900/30' 
                        : 'bg-church-dark border border-church-border text-slate-100 rounded-bl-xs'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
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

                      {/* Card de Múltiplos Louvores Sugeridos */}
                      {bundleSongs.length > 0 && (
                        <div className={`mb-2 p-2.5 rounded-xl space-y-1.5 ${
                          isMe ? 'bg-black/20 text-white' : 'bg-slate-900 border border-church-border text-slate-200'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold pb-1 border-b border-white/10">
                            <span className="flex items-center gap-1.5">
                              <ListMusic className="w-3.5 h-3.5" /> Louvores Sugeridos
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 font-mono">
                              {bundleSongs.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {bundleSongs.map((songName, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] leading-snug">
                                <span className="opacity-60 text-[10px] font-bold">{idx + 1}.</span>
                                <span className="font-semibold break-words flex-1">{songName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card de Múltiplas Datas Sugeridas */}
                      {bundleDates.length > 0 && (
                        <div className={`mb-2 p-2 rounded-xl space-y-1.5 ${
                          isMe ? 'bg-black/20 text-white' : 'bg-slate-900 border border-church-border text-slate-200'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold pb-1 border-b border-white/10">
                            <Calendar className="w-3.5 h-3.5" /> Datas Propostas ({bundleDates.length})
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {bundleDates.map((dt, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold">
                                {dt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conteúdo do Texto */}
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

          {/* PAINEL DE SUGESTÕES PENDENTES (CHIPS ACUMULADOS ANTES DO ENVIO) */}
          {hasPendingSuggestions && (
            <div className="px-3 py-2 bg-church-dark border-t border-church-border space-y-2 flex-shrink-0 max-h-36 overflow-y-auto">
              {suggestedSongsList.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-church-blue uppercase flex items-center gap-1">
                    <Music2 className="w-3 h-3" /> Músicas adicionadas ({suggestedSongsList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suggestedSongsList.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-church-card border border-church-border text-[11px] text-slate-200">
                        <span className="truncate max-w-[150px]">{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSongFromDraft(idx)}
                          className="hover:text-church-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {suggestedDatesList.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Datas adicionadas ({suggestedDatesList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suggestedDatesList.map((d, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-church-card border border-church-border text-[11px] text-slate-200">
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDateFromDraft(idx)}
                          className="hover:text-church-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BARRA DE ATALHOS / SELETORES */}
          <div className="px-3 py-1.5 bg-church-dark border-t border-church-border flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Adicionar:</span>
            <button
              type="button"
              onClick={() => {
                setIsSuggestingSongs(!isSuggestingSongs);
                setIsSuggestingDates(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                isSuggestingSongs
                  ? 'bg-church-blue text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-church-border'
              }`}
            >
              <Music2 className="w-3 h-3" /> + Música
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSuggestingDates(!isSuggestingDates);
                setIsSuggestingSongs(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                isSuggestingDates
                  ? 'bg-church-blue text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-church-border'
              }`}
            >
              <Calendar className="w-3 h-3" /> + Data
            </button>
          </div>

          {/* INPUT PARA INSERIR MÚSICAS SEM LIMITE */}
          {isSuggestingSongs && (
            <div className="px-3 py-2 bg-church-card border-t border-church-border flex items-center gap-1.5 animate-in fade-in flex-shrink-0">
              <input
                type="text"
                list="chat-songs-pool"
                placeholder="Nome da música (aperte Enter ou +)..."
                value={tempSongInput}
                onChange={(e) => setTempSongInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSongToDraft();
                  }
                }}
                className="flex-1 bg-church-dark border border-church-border rounded-xl px-3 py-1.5 text-base sm:text-xs text-white focus:outline-none focus:border-church-blue"
              />
              <datalist id="chat-songs-pool">
                {songsPool.map((s) => (
                  <option key={s.id} value={`${s.title} (${s.default_key || 'C'}) - ${s.artist}`} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => handleAddSongToDraft()}
                className="p-1.5 bg-church-blue hover:bg-church-blue-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                title="Adicionar à lista de sugestão"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* INPUT PARA INSERIR DATAS SEM LIMITE */}
          {isSuggestingDates && (
            <div className="px-3 py-2 bg-church-card border-t border-church-border flex items-center gap-1.5 animate-in fade-in flex-shrink-0">
              <input
                type="date"
                value={tempDateInput}
                onChange={(e) => setTempDateInput(e.target.value)}
                className="flex-1 bg-church-dark border border-church-border rounded-xl px-3 py-1.5 text-base sm:text-xs text-white focus:outline-none focus:border-church-blue"
                style={{ colorScheme: 'dark' }}
              />
              <button
                type="button"
                onClick={handleAddDateToDraft}
                className="p-1.5 bg-church-blue hover:bg-church-blue-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                title="Adicionar à lista de datas"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FORMULÁRIO DE ENVIO */}
          <form onSubmit={handleSendMessage} className="p-3 bg-church-dark border-t border-church-border flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={hasPendingSuggestions ? "Adicione um recado para a equipe..." : "Digite uma mensagem..."}
              className="flex-1 bg-church-card border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-church-blue"
            />
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !hasPendingSuggestions)}
              className="w-9 h-9 rounded-xl bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-md shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}