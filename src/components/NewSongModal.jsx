import React, { useState, useEffect } from 'react';
import { X, Music2, Search, Loader2, Check, Sparkles, ExternalLink, Pencil } from 'lucide-react';

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

export default function NewSongModal({
  isOpen = false,
  onClose,
  songToEdit = null,
  onSave
}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('G');
  const [bpm, setBpm] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (songToEdit) {
        setTitle(songToEdit.title || '');
        setArtist(songToEdit.artist || '');
        setDefaultKey(songToEdit.default_key || 'G');
        setBpm(songToEdit.bpm ? String(songToEdit.bpm) : '');
        setChordsUrl(songToEdit.chords_url || '');
        setYoutubeUrl(songToEdit.youtube_url || '');
      } else {
        setTitle('');
        setArtist('');
        setDefaultKey('G');
        setBpm('');
        setChordsUrl('');
        setYoutubeUrl('');
      }
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen, songToEdit]);

  if (!isOpen) return null;

  const handleSearchTrack = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      setSearchResults([]);
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm.trim())}&entity=song&limit=6&country=BR`
      );

      if (response.ok) {
        const data = await response.json();
        const formatted = (data.results || []).map((track) => ({
          title: track.trackName,
          artist: track.artistName,
          thumbnail: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb.jpg', '200x200bb.jpg') : '',
          key: 'G'
        }));
        setSearchResults(formatted);
      }
    } catch (err) {
      console.error('Erro na busca de músicas:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = async (track) => {
    setTitle(track.title);
    setArtist(track.artist);
    setDefaultKey(track.key || 'G');
    setSearchResults([]);

    try {
      const chordsRes = await fetch(`/api/chords?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      if (chordsRes.ok) {
        const chordsData = await chordsRes.json();
        if (chordsData.url) setChordsUrl(chordsData.url);
        if (chordsData.key) setDefaultKey(chordsData.key);
      }
    } catch (_) {}

    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(`${track.title}${track.artist}`)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.url) setYoutubeUrl(data.url);
      }
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('Preencha o título e o artista.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          title: title.trim(),
          artist: artist.trim(),
          default_key: defaultKey,
          bpm: bpm ? parseInt(bpm, 10) : null,
          chords_url: chordsUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null
        },
        songToEdit?.id || null
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-church-card border border-church-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-church-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl bg-church-blue text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30 flex-shrink-0">
              {songToEdit ? <Pencil className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            </div>
            <h3 className="font-bold text-white text-base truncate">
              {songToEdit ? 'Editar Música do Repertório' : 'Nova Música do Repertório'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Busca Automática */}
          <div className="bg-church-dark p-3.5 rounded-2xl border border-church-border space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-church-blue" /> Buscar Dados Automáticos
            </label>
            <p className="text-[11px] text-slate-400">
              Digite o nome para puxar cifra, tom e vídeo automaticamente:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Perto Quero Estar Davi Sacer..."
                className="flex-1 bg-church-card border border-church-border rounded-xl px-3.5 h-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
              />
              <button
                type="button"
                onClick={handleSearchTrack}
                disabled={isSearching || !searchTerm.trim()}
                className="px-4 h-10 bg-church-blue hover:bg-church-blue-hover text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Buscar
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-1">
                {searchResults.map((track, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectTrack(track)}
                    className="p-2 rounded-xl bg-church-card hover:bg-slate-800 border border-church-border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {track.thumbnail && (
                        <img src={track.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-bold text-white block truncate">{track.title}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{track.artist}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-church-blue bg-blue-950/60 px-2 py-0.5 rounded-lg border border-church-blue/30 flex-shrink-0">
                      Preencher
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Título do Louvor */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Título do Louvor *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Agnus Dei"
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Artista / Versão */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Artista / Versão *</label>
            <input
              required
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Thiago Henrique Ferreira & Sarah Lanza"
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Tom Padrão e BPM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Tom Padrão</label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/60 border border-church-blue/30 text-blue-400">
                  Tom {defaultKey}
                </span>
              </div>
              <select
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3 h-11 text-xs text-slate-100 font-bold focus:outline-none focus:border-church-blue"
              >
                {COMMON_KEYS.map((k) => (
                  <option key={k} value={k}>Tom {k}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">BPM (Tempo)</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="Ex: 120"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>
          </div>

          {/* Link da Cifra */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Link da Cifra (Cifra Club / outros)</label>
              {chordsUrl && (
                <a
                  href={chordsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-church-blue hover:underline font-bold flex items-center gap-1"
                >
                  Testar cifra <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={chordsUrl}
              onChange={(e) => setChordsUrl(e.target.value)}
              placeholder="https://www.cifraclub.com.br/..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Link do Vídeo */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Vídeo / Referência (YouTube)</label>
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-church-red hover:underline font-bold flex items-center gap-1"
                >
                  Abrir vídeo <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 h-11 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Rodapé com Botões */}
          <div className="pt-3 border-t border-church-border flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-church-blue hover:bg-church-blue-hover disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
              {songToEdit ? 'Salvar Alterações' : 'Cadastrar Música'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}