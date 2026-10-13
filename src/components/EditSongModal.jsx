import React, { useState, useEffect } from 'react';
import { X, Play, Globe, Sparkles, Music2 } from 'lucide-react';

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 
  'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

export default function EditSongModal({ isOpen, onClose, song, onSave }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [tag, setTag] = useState('Adoração');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');

  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setDefaultKey(song.default_key || 'C');
      setBpm(song.bpm ? String(song.bpm) : '');
      setTag(song.tag || 'Adoração');
      setYoutubeUrl(song.youtube_url || '');
      setChordsUrl(song.chords_url || '');
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(song.id, {
      title: title.trim(),
      artist: artist.trim() || 'Ministério de Louvor',
      default_key: defaultKey.trim().toUpperCase(),
      bpm: bpm ? parseInt(bpm, 10) : null,
      tag,
      youtube_url: youtubeUrl.trim(),
      chords_url: chordsUrl.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131614] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs shadow-md shadow-[#a3e635]/20">
              <Music2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Editar Música</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
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
              <label className="text-xs font-semibold text-zinc-300">Tom Base</label>
              <input
                type="text"
                list="edit-keys-list"
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value.toUpperCase())}
                placeholder="Ex: G, D, Bm..."
                className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-[#a3e635] uppercase focus:outline-none focus:border-[#a3e635]"
              />
              <datalist id="edit-keys-list">
                {COMMON_KEYS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">BPM (Andamento)</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="Ex: 72"
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
              placeholder="https://youtube.com/watch?v=..."
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
              placeholder="https://www.cifraclub.com.br/..."
              value={chordsUrl}
              onChange={(e) => setChordsUrl(e.target.value)}
              className="w-full bg-[#0b0d0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#a3e635] hover:bg-[#b5f448] text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}