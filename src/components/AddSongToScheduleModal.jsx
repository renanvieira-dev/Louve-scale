import React, { useState } from 'react';
import { X, Sparkles, Search, Loader2, Music2, Check, Library, PlusCircle } from 'lucide-react';

export default function AddSongToScheduleModal({ isOpen, onClose, songsPool = [], onConfirm }) {
  const [tab, setTab] = useState('pool'); // 'pool' = repertório existente | 'new' = buscar nova
  
  // Estado para seleção do repertório existente
  const [filterText, setFilterText] = useState('');
  const [selectedPoolSong, setSelectedPoolSong] = useState(null);
  const [customKey, setCustomKey] = useState('G');

  // Estado para busca de nova música (igual ao NewSongModal)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newSongData, setNewSongData] = useState(null);

  if (!isOpen) return null;

  // Busca na API pública do iTunes Search
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
      console.error('Erro ao buscar música:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track) => {
    const title = track.trackName;
    const artist = track.artistName;
    const ytQuery = encodeURIComponent(`${title} ${artist}`);
    const ccQuery = encodeURIComponent(`${title} ${artist}`);

    setNewSongData({
      title,
      artist,
      default_key: 'G',
      bpm: 72,
      tag: 'Adoração',
      youtube_url: `https://www.youtube.com/results?search_query=${ytQuery}`,
      chords_url: `https://www.cifraclub.com.br/?q=${ccQuery}`,
    });
    setCustomKey('G');
  };

  const handleFinish = (e) => {
    e.preventDefault();

    if (tab === 'pool') {
      if (!selectedPoolSong) return;
      onConfirm({
        type: 'existing',
        songId: selectedPoolSong.id,
        songKey: customKey || selectedPoolSong.default_key,
      });
    } else {
      if (!newSongData) return;
      onConfirm({
        type: 'new',
        newSong: newSongData,
        songKey: customKey || newSongData.default_key,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setTab('pool');
    setSelectedPoolSong(null);
    setNewSongData(null);
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  const filteredPool = songsPool.filter((s) =>
    s.title.toLowerCase().includes(filterText.toLowerCase()) ||
    s.artist.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <h3 className="font-bold text-white text-base">Adicionar Música à Escala</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas Alternadoras: Do Repertório ou Nova Música */}
        <div className="flex border-b border-zinc-800/80 bg-[#0b0d0c]/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('pool')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'pool'
                ? 'bg-[#a3e635] text-black shadow-md shadow-[#a3e635]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Library className="w-4 h-4" />
            Do Repertório ({songsPool.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('new')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'new'
                ? 'bg-[#a3e635] text-black shadow-md shadow-[#a3e635]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Buscar / Cadastrar Nova
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {tab === 'pool' ? (
            /* ABA 1: Escolher do Repertório já existente */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filtrar músicas do repertório..."
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredPool.length > 0 ? (
                  filteredPool.map((song) => {
                    const isSelected = selectedPoolSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => {
                          setSelectedPoolSong(song);
                          setCustomKey(song.default_key);
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#181d1a] border-[#a3e635]'
                            : 'bg-[#0b0d0c] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">{song.title}</h4>
                          <p className="text-[11px] text-zinc-400">{song.artist} • Tom Base: {song.default_key}</p>
                        </div>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">Nenhuma música encontrada no repertório.</p>
                )}
              </div>
            </div>
          ) : (
            /* ABA 2: Buscar Nova Música Automaticamente */
            <div className="space-y-4">
              <form onSubmit={handleAutoSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome da música ou artista..."
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-[#a3e635] text-black font-bold text-xs rounded-xl hover:bg-[#b5f448] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </button>
              </form>

              {/* Lista de resultados retornados */}
              {searchResults.length > 0 && !newSongData && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {searchResults.map((track) => (
                    <div
                      key={track.trackId}
                      onClick={() => handleSelectTrack(track)}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-[#0b0d0c] hover:bg-[#181d1a] border border-zinc-800 hover:border-[#a3e635]/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {track.artworkUrl60 ? (
                          <img src={track.artworkUrl60} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-850 flex items-center justify-center text-zinc-500">
                            <Music2 className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-[#a3e635]">{track.trackName}</h4>
                          <p className="text-[11px] text-zinc-400">{track.artistName}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-black bg-[#a3e635] px-2.5 py-1 rounded-lg">
                        Selecionar
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dados da nova música selecionada */}
              {newSongData && (
                <div className="p-3.5 bg-[#0b0d0c] border border-[#a3e635]/40 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-[#a3e635] font-bold uppercase tracking-wider">Nova Música Selecionada</span>
                      <h4 className="text-sm font-bold text-white">{newSongData.title}</h4>
                      <p className="text-xs text-zinc-400">{newSongData.artist}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewSongData(null)}
                      className="text-xs text-zinc-500 hover:text-white"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuração do Tom nesta Escala */}
          {(selectedPoolSong || newSongData) && (
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 bg-[#0b0d0c] p-3 rounded-2xl border border-zinc-800">
              <div>
                <label className="text-xs font-bold text-white block">Tom neste culto:</label>
                <span className="text-[10px] text-zinc-400">
                  (Padrão original: {selectedPoolSong?.default_key || newSongData?.default_key})
                </span>
              </div>
              <select
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-[#a3e635] font-black rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              >
                {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Am', 'Em', 'Dm'].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="px-6 py-4 border-t border-zinc-800/80 flex items-center justify-end gap-2 bg-[#131614]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={tab === 'pool' ? !selectedPoolSong : !newSongData}
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#a3e635] text-black hover:bg-[#b5f448] transition-colors shadow-md shadow-[#a3e635]/20 cursor-pointer disabled:opacity-40"
          >
            Adicionar à Escala
          </button>
        </div>

      </div>
    </div>
  );
}