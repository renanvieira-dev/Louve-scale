import React, { useState } from 'react';
import { X, Sparkles, Search, Loader2, Music2, Check, PenLine } from 'lucide-react';

export default function NewSongModal({ isOpen, onClose, onSave }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    default_key: 'G',
    bpm: 72,
    tag: 'Adoração',
    chords_url: '',
    youtube_url: '',
  });

  if (!isOpen) return null;

  // Pesquisa automática usando a API pública do iTunes Search
  const handleAutoSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const query = encodeURIComponent(searchTerm.trim());
      const response = await fetch(
        `https://itunes.apple.com/search?term=${query}&entity=song&limit=6`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Erro ao procurar música:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Quando o utilizador clica numa música encontrada
  const handleSelectSong = (track) => {
    const title = track.trackName;
    const artist = track.artistName;

    // Gera o link de pesquisa automática no YouTube e no Cifra Club
    const ytQuery = encodeURIComponent(`${title} ${artist}`);
    const ccQuery = encodeURIComponent(`${title} ${artist}`);

    setFormData({
      title: title,
      artist: artist,
      default_key: 'G',
      bpm: 72,
      tag: 'Adoração',
      youtube_url: `https://www.youtube.com/results?search_query=${ytQuery}`,
      chords_url: `https://www.cifraclub.com.br/?q=${ccQuery}`,
    });

    // Avança para o ecrã de confirmação/revisão dos dados
    setIsManualMode(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.artist.trim()) return;

    onSave({
      ...formData,
      bpm: Number(formData.bpm) || 120,
    });

    // Reset ao estado do modal
    setIsManualMode(false);
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <h3 className="font-bold text-white text-base">
              {isManualMode ? 'Confirmar Detalhes da Música' : 'Procurar Música Automaticamente'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsManualMode(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!isManualMode ? (
            <>
              {/* Barra de Pesquisa Automática */}
              <form onSubmit={handleAutoSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escreva o nome da música ou artista..."
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]/40 transition-all"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2.5 bg-[#a3e635] hover:bg-[#b5f448] text-black font-bold text-xs rounded-2xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Procurar'}
                </button>
              </form>

              {/* Resultados Encontrados */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    Selecione uma opção para preenchimento automático:
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {searchResults.map((track) => (
                      <div
                        key={track.trackId}
                        onClick={() => handleSelectSong(track)}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-[#0b0d0c] hover:bg-[#181d1a] border border-zinc-800/80 hover:border-[#a3e635]/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {track.artworkUrl60 ? (
                            <img
                              src={track.artworkUrl60}
                              alt={track.trackName}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-850 flex items-center justify-center text-zinc-500">
                              <Music2 className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-[#a3e635] transition-colors leading-tight">
                              {track.trackName}
                            </h4>
                            <p className="text-xs text-zinc-400">{track.artistName}</p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-black bg-[#a3e635] px-3 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Escolher
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de transição para Adicionar Manualmente */}
              <div className="pt-2 text-center border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#a3e635] transition-colors cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Não encontrou? Adicionar detalhes manualmente
                </button>
              </div>
            </>
          ) : (
            /* Formulário com Dados Preenchidos Prontos para Guardar */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Título da Música *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Artista / Ministério *</label>
                  <input
                    required
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Tom Base</label>
                  <select
                    value={formData.default_key}
                    onChange={(e) => setFormData({ ...formData, default_key: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  >
                    {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">BPM</label>
                  <input
                    type="number"
                    value={formData.bpm}
                    onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Momento / Categoria</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  >
                    <option value="Adoração">Adoração</option>
                    <option value="Celebração / Júbilo">Celebração / Júbilo</option>
                    <option value="Abertura">Abertura</option>
                    <option value="Comunhão">Comunhão</option>
                    <option value="Ofertório">Ofertório</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Link do YouTube / Áudio</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300">Link da Cifra</label>
                  <input
                    type="url"
                    value={formData.chords_url}
                    onChange={(e) => setFormData({ ...formData, chords_url: e.target.value })}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Voltar à pesquisa
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#a3e635] text-black hover:bg-[#b5f448] transition-colors shadow-md shadow-[#a3e635]/20 cursor-pointer"
                  >
                    Guardar Música
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}