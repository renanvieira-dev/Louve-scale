import React, { useState } from 'react';
import { 
  X, 
  Music2, 
  Check, 
  Link as LinkIcon, 
  Tag, 
  Search, 
  Loader2, 
  Video, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

const KEY_MAP = {
  'DO': 'C', 'DÓ': 'C',
  'RE': 'D', 'RÉ': 'D',
  'MI': 'E',
  'FA': 'F', 'FÁ': 'F',
  'SOL': 'G',
  'LA': 'A', 'LÁ': 'A',
  'SI': 'B'
};

const DEFAULT_TONES_MAP = {
  'digno de tudo': 'D',
  'te exaltamos': 'D',
  'e ele': 'E',
  'é ele': 'E',
  'tu es + e ele': 'E',
  'tu és + é ele': 'E',
  'bondade de deus': 'G',
  'todavia me alegrarei': 'C',
  'ousado amor': 'Gb',
  'oh quao lindo': 'D',
  'oh quão lindo': 'D',
  'a bencao': 'Bb',
  'a bênção': 'Bb',
  'me atraiu': 'Em',
  'a casa e sua': 'A',
  'a casa é sua': 'A',
  'ruja o leao': 'C#m',
  'ruja o leão': 'C#m',
  'liberta-me de mim': 'G'
};

export default function NewSongModal({ isOpen, onClose, onSave }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isResolvingVideo, setIsResolvingVideo] = useState(false);

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('G');
  const [bpm, setBpm] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  if (!isOpen) return null;

  const normalizeDetectedKey = (rawKey) => {
    if (!rawKey) return 'G';
    let clean = rawKey.replace(/tom:?/gi, '').replace(/[()]/g, '').trim().toUpperCase();

    for (const [latin, cifrada] of Object.entries(KEY_MAP)) {
      if (clean.startsWith(latin)) {
        clean = clean.replace(latin, cifrada);
        break;
      }
    }

    const matched = COMMON_KEYS.find(k => k.toUpperCase() === clean);
    if (matched) return matched;

    const regex = clean.match(/^[A-G][#B]?(M)?/i);
    if (regex) {
      const matchKey = regex[0].toUpperCase();
      const fallback = COMMON_KEYS.find(k => k.toUpperCase() === matchKey);
      if (fallback) return fallback;
    }

    return 'G';
  };

  // 1. Busca faixas e versões exatas na biblioteca do iTunes
  const handleSearchVersions = async (e) => {
    e?.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      setSearchResults([]);

      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10&country=BR`
      );

      if (!response.ok) throw new Error('Falha ao buscar faixas');

      const data = await response.json();
      const tracks = data.results || [];

      if (tracks.length > 0) {
        const formatted = tracks.map((track) => {
          const trackTitle = track.trackName;
          const artistName = track.artistName;
          const albumName = track.collectionName || '';
          const highResArtwork = track.artworkUrl100
            ? track.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg')
            : '';

          const cleanArtist = artistName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

          const cleanSong = trackTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

          const checkNormalized = trackTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let estimatedKey = 'G';
          for (const [pattern, keyVal] of Object.entries(DEFAULT_TONES_MAP)) {
            if (checkNormalized.includes(pattern)) {
              estimatedKey = keyVal;
              break;
            }
          }

          return {
            id: track.trackId,
            title: trackTitle,
            artist: artistName,
            album: albumName,
            thumbnail: highResArtwork,
            chordsUrl: `https://www.cifraclub.com.br/${cleanArtist}/${cleanSong}/`,
            suggestedKey: estimatedKey
          };
        });

        setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Erro na busca de faixas:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Ao selecionar uma versão da música:
  const handleSelectVersion = async (item) => {
    setTitle(item.title);
    setArtist(item.artist);
    setSearchResults([]);

    // 1. Iniciar resolução paralela de Vídeo e Cifra/Tom
    setIsResolvingVideo(true);

    const queryText = `${item.title} ${item.artist}`.trim();

    // Busca Cifra e Tom reais
    try {
      const chordsRes = await fetch(`/api/chords?title=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(item.artist)}`);
      if (chordsRes.ok) {
        const chordsData = await chordsRes.json();
        if (chordsData.url) setChordsUrl(chordsData.url);
        if (chordsData.key) setDefaultKey(normalizeDetectedKey(chordsData.key));
      }
    } catch (err) {
      console.warn('Erro ao obter cifra/tom:', err);
      setChordsUrl(`https://www.cifraclub.com.br/?q=${encodeURIComponent(queryText)}`);
    }

    // Busca Vídeo no YouTube com player direto
    try {
      const ytRes = await fetch(`/api/youtube?q=${encodeURIComponent(queryText + ' oficial')}`);
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (ytData && ytData.url) {
          setYoutubeUrl(ytData.url);
        }
      }
    } catch (err) {
      console.warn('Erro ao resolver vídeo:', err);
      setYoutubeUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(queryText + ' oficial')}`);
    } finally {
      setIsResolvingVideo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('Preencha o título e o artista do louvor.');
      return;
    }

    onSave({
      title: title.trim(),
      artist: artist.trim(),
      default_key: defaultKey,
      bpm: bpm ? parseInt(bpm, 10) : null,
      chords_url: chordsUrl.trim() || null,
      youtube_url: youtubeUrl.trim() || null
    });

    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setTitle('');
    setArtist('');
    setDefaultKey('G');
    setBpm('');
    setChordsUrl('');
    setYoutubeUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-church-card border border-church-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-church-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl bg-church-blue text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30 flex-shrink-0">
              <Music2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base truncate">Adicionar Nova Música</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Barra de Pesquisa */}
          <div className="bg-church-dark p-3.5 rounded-2xl border border-church-border space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-church-blue" /> Buscar Música e Versões Oficiais
            </label>
            <p className="text-[11px] text-slate-400">
              Digite o nome do louvor (ex: <i>Digno de Tudo Emaús</i>, <i>É Ele Drops</i>, <i>Bondade de Deus</i>):
            </p>
            
            <form onSubmit={handleSearchVersions} className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do louvor..."
                className="flex-1 bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
              />
              <button
                type="submit"
                disabled={isSearching || !searchTerm.trim()}
                className="px-4 py-2 bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-md shadow-blue-600/20"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Buscar
              </button>
            </form>

            {/* Lista de Resultados */}
            {searchResults.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Selecione a versão exata:
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {searchResults.map((ver) => (
                    <div
                      key={ver.id}
                      onClick={() => handleSelectVersion(ver)}
                      className="p-2.5 rounded-xl bg-church-card hover:bg-church-card-hover border border-church-border hover:border-church-blue/60 flex items-center gap-3 cursor-pointer transition-all group"
                    >
                      {ver.thumbnail ? (
                        <img 
                          src={ver.thumbnail} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl flex-shrink-0 bg-slate-900 border border-church-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-church-blue truncate">
                          {ver.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                          {ver.artist}
                        </p>
                        {ver.album && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {ver.album}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-extrabold text-church-blue bg-blue-950/60 border border-church-blue/30 px-2.5 py-1.5 rounded-xl flex-shrink-0">
                        Selecionar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !isSearching && (
              <p className="text-[11px] text-slate-500 italic py-1">
                Nenhuma música encontrada com esse termo.
              </p>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Título do Louvor *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Digno de Tudo + Te Exaltamos"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Artista / Versão Escolhida *</label>
              <input
                required
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ex: Emaús Music"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Tom Padrão</span>
                  <span className="text-[10px] font-bold text-church-blue">Tom {defaultKey}</span>
                </label>
                <select
                  value={defaultKey}
                  onChange={(e) => setDefaultKey(e.target.value)}
                  className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue font-bold"
                >
                  {COMMON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      Tom {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">BPM (Tempo)</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Ex: 68, 120"
                  className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
                />
              </div>
            </div>

            {/* Link da Cifra Club */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-church-blue" /> Link da Cifra (Cifra Club)
                </label>
                {chordsUrl && (
                  <a 
                    href={chordsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    Testar cifra <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={chordsUrl}
                onChange={(e) => setChordsUrl(e.target.value)}
                placeholder="https://www.cifraclub.com.br/artista/musica/"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            {/* Link Direto do Vídeo do YouTube */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-church-red" /> Vídeo Direto no YouTube
                </label>
                <div className="flex items-center gap-2">
                  {isResolvingVideo && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Vinculando player direto...
                    </span>
                  )}
                  {!isResolvingVideo && youtubeUrl && youtubeUrl.includes('/watch?v=') && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Player Vinculado
                    </span>
                  )}
                  {youtubeUrl && (
                    <a 
                      href={youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      Abrir vídeo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            {/* Botões */}
            <div className="pt-3 border-t border-church-border flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-church-blue hover:bg-church-blue-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Salvar Música
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}