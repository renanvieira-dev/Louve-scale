import React, { useState } from 'react';
import { X, Music2, Search, Loader2, Sparkles, Play, Globe, Check } from "lucide-react"
import { musicSearchService } from '../services/musicSearchService';

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 
  'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

export default function NewSongModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState('search'); // 'search' ou 'details'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('C');
  const [bpm, setBpm] = useState('72');
  const [tag, setTag] = useState('Adoração');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');

  if (!isOpen) return null;

  // Busca rápida (iTunes)
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await musicSearchService.searchTracks(searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  // Ao selecionar uma música do resultado: tenta buscar tom e URL no Cifra Club
  const handleSelectTrack = async (track) => {
    setTitle(track.title);
    setArtist(track.artist);
    setYoutubeUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.title}${track.artist}`)}`);
    
    setStep('details');
    setIsLoadingKey(true);

    try {
      const cifraData = await musicSearchService.fetchCifraClubKey(track.artist, track.title);
      
      if (cifraData.key) {
        setDefaultKey(cifraData.key);
      } else {
        // Se não identificou com precisão, mantém um tom padrão neutro (ex: C ou D)
        setDefaultKey('C');
      }

      setChordsUrl(cifraData.chordsUrl);
    } catch {
      setChordsUrl(`https://www.cifraclub.com.br/?q=${encodeURIComponent(`${track.title}${track.artist}`)}`);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const handleManualCreate = () => {
    setTitle('');
    setArtist('');
    setDefaultKey('C');
    setBpm('72');
    setTag('Adoração');
    setYoutubeUrl('');
    setChordsUrl('');
    setStep('details');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      artist: artist.trim() || 'Ministério de Louvor',
      default_key: defaultKey.trim().toUpperCase(),
      bpm: bpm ? parseInt(bpm, 10) : null,
      tag,
      youtube_url: youtubeUrl.trim(),
      chords_url: chordsUrl.trim()
    });

    handleClose();
  };

  const handleClose = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <h3 className="font-bold text-white text-base">
              {step === 'search' ? 'Adicionar Música ao Repertório' : 'Confirmar Detalhes da Música'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {step === 'search' ? (
            <>
              {/* Barra de Pesquisa */}
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ex: Diante de Ti, Bondade de Deus, Todavia Me Alegrarei..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl pl-10 pr-24 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#a3e635]"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#a3e635] hover:bg-[#b5f448] text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                  </button>
                </div>
              </form>

              {/* Resultados */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {searchResults.map((track, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectTrack(track)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#0b0d0c] border border-zinc-800/80 hover:border-[#a3e635]/60 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt={track.title} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                          <Music2 className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#a3e635] transition-colors leading-tight">
                          {track.title}
                        </h4>
                        <span className="text-[11px] text-zinc-400">{track.artist}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#a3e635] opacity-0 group-hover:opacity-100 transition-opacity">
                      Selecionar →
                    </span>
                  </div>
                ))}

                {searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    Digite o nome da música acima ou cadastre manualmente.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-center">
                <button
                  type="button"
                  onClick={handleManualCreate}
                  className="text-xs text-zinc-400 hover:text-[#a3e635] transition-colors cursor-pointer"
                >
                  Não encontrou? Cadastrar manualmente sem busca
                </button>
              </div>
            </>
          ) : (
            /* Formulário de Confirmação */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Título da Música *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Artista / Ministério *</label>
                <input
                  required
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Tom Base</label>
                    {isLoadingKey && (
                      <span className="text-[10px] text-[#a3e635] flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Buscando tom...
                      </span>
                    )}
                  </div>
                  
                  {/* Seletor dinâmico com suporte a digitação livre ou seleção da lista */}
                  <div className="relative">
                    <input
                      type="text"
                      list="keys-list"
                      value={defaultKey}
                      onChange={(e) => setDefaultKey(e.target.value.toUpperCase())}
                      placeholder="Ex: G, D, Bm..."
                      className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-[#a3e635] uppercase focus:outline-none focus:border-[#a3e635]"
                    />
                    <datalist id="keys-list">
                      {COMMON_KEYS.map((k) => (
                        <option key={k} value={k} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">BPM (Andamento)</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Momento / Categoria</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="Adoração">Adoração</option>
                  <option value="Celebração / Júbilo">Celebração / Júbilo</option>
                  <option value="Abertura">Abertura</option>
                  <option value="Comunhão">Comunhão</option>
                  <option value="Ofertório / Dízimos">Ofertório / Dízimos</option>
                  <option value="Encerramento">Encerramento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Link do YouTube / Áudio
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#a3e635]" /> Link da Cifra (Cifra Club)
                </label>
                <input
                  type="url"
                  value={chordsUrl}
                  onChange={(e) => setChordsUrl(e.target.value)}
                  className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              {/* Ações */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Voltar à pesquisa
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#a3e635] hover:bg-[#b5f448] text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer"
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