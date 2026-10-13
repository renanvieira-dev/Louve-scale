import React, { useState } from 'react';
import { X, Music2, Check, Link, Tag, Sparkles, Loader2, Search } from 'lucide-react';

const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'
];

// Dicionário de conversão de notas latinas e normalização
const KEY_MAP = {
  'DO': 'C', 'DÓ': 'C',
  'RE': 'D', 'RÉ': 'D',
  'MI': 'E',
  'FA': 'F', 'FÁ': 'F',
  'SOL': 'G',
  'LA': 'A', 'LÁ': 'A',
  'SI': 'B'
};

export default function NewSongModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('G');
  const [bpm, setBpm] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tags, setTags] = useState('');

  const [isFetchingAuto, setIsFetchingAuto] = useState(false);

  if (!isOpen) return null;

  // Função auxiliar para sanitizar e casar o tom com a lista permitida
  const normalizeDetectedKey = (rawKey) => {
    if (!rawKey) return 'G';
    
    // Remove palavras como "Tom:", parênteses e espaços
    let clean = rawKey.replace(/tom:?/gi, '').trim().toUpperCase();
    
    // Converte notas em português se existirem (ex: SOL -> G)
    for (const [latin, cifrada] of Object.entries(KEY_MAP)) {
      if (clean.startsWith(latin)) {
        clean = clean.replace(latin, cifrada);
        break;
      }
    }

    // Busca correspondência exata nos tons suportados
    const matched = COMMON_KEYS.find(k => k.toUpperCase() === clean);
    if (matched) return matched;

    // Tenta encontrar a nota raiz (primeira letra maiúscula + sustenido/bemol/menor)
    const regexMatch = clean.match(/^[A-G][#B]?(M)?/i);
    if (regexMatch) {
      const fallback = COMMON_KEYS.find(k => k.toUpperCase() === regexMatch[0].toUpperCase());
      if (fallback) return fallback;
    }

    return 'G';
  };

  // Busca e preenchimento automático de YouTube, Cifra e Tom
  const handleAutoFetchSong = async () => {
    if (!title.trim()) {
      alert('Digita pelo menos o título do louvor para buscar.');
      return;
    }

    try {
      setIsFetchingAuto(true);
      const query = `${title.trim()} ${artist.trim()}`.trim();

      // 1. Gera link direto e pesquisa segura para o Cifra Club
      const slugTitle = title.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const slugArtist = artist.trim() ? artist.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : '';
      
      const generatedChords = slugArtist 
        ? `https://www.cifraclub.com.br/${slugArtist}/${slugTitle}/`
        : `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`;

      setChordsUrl(generatedChords);

      // 2. Busca automática do vídeo no YouTube via endpoint público oEmbed / invidious ou geração de busca direta
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' louvor oficial')}`;
      
      // Tentativa de buscar vídeo direto via API pública de pesquisa sem necessidade de chave privada
      try {
        const response = await fetch(`https://invidious.io.lol/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0 && results[0].videoId) {
            setYoutubeUrl(`https://www.youtube.com/watch?v=${results[0].videoId}`);
            if (!artist.trim() && results[0].author) {
              setArtist(results[0].author.replace(' - Topic', '').replace(' Oficial', ''));
            }
          } else {
            setYoutubeUrl(youtubeSearchUrl);
          }
        } else {
          setYoutubeUrl(youtubeSearchUrl);
        }
      } catch {
        setYoutubeUrl(youtubeSearchUrl);
      }

      // 3. Detecção e normalização do Tom (estimado pelo tom padrão comum de louvores cristãos)
      // Se tiver padrão no nome ou tom sugerido:
      const commonGospelDefaults = {
        'bondade de deus': 'G',
        'todavia me alegrarei': 'C',
        'vitorioso és': 'D',
        'a bênção': 'Bb',
        'me atraiu': 'Em',
        'acasaesua': 'A',
        'ousado amor': 'Gb'
      };

      const lowerTitle = title.toLowerCase();
      let detected = 'G';
      for (const [keySong, keyVal] of Object.entries(commonGospelDefaults)) {
        if (lowerTitle.includes(keySong)) {
          detected = keyVal;
          break;
        }
      }

      setDefaultKey(normalizeDetectedKey(detected));

    } catch (err) {
      console.error('Erro no autopreenchimento:', err);
    } finally {
      setIsFetchingAuto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('Preenche pelo menos o título e o artista/ministério do louvor.');
      return;
    }

    onSave({
      title: title.trim(),
      artist: artist.trim(),
      default_key: defaultKey,
      bpm: bpm ? parseInt(bpm, 10) : null,
      chords_url: chordsUrl.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()) : []
    });

    setTitle('');
    setArtist('');
    setDefaultKey('G');
    setBpm('');
    setChordsUrl('');
    setYoutubeUrl('');
    setTags('');
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Título e Botão de Busca Mágica */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Título do Louvor *</label>
              <button
                type="button"
                onClick={handleAutoFetchSong}
                disabled={isFetchingAuto || !title.trim()}
                className="text-[11px] font-bold text-church-blue hover:text-blue-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                {isFetchingAuto ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando dados...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> Puxar Cifra & YouTube
                  </>
                )}
              </button>
            </div>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bondade de Deus, Todavia Me Alegrarei..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Artista */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Artista / Ministério *</label>
            <input
              required
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Ex: Isaías Saad, Morada, Diante do Trono..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Tom e BPM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tom Padrão</label>
              <select
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-church-blue"
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
                placeholder="Ex: 72, 120"
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>
          </div>

          {/* Link Cifra */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-church-blue" /> Link da Cifra (Cifra Club ou PDF)
            </label>
            <input
              type="url"
              value={chordsUrl}
              onChange={(e) => setChordsUrl(e.target.value)}
              placeholder="https://www.cifraclub.com.br/..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Link YouTube */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-church-red" /> Link do YouTube (Vídeo de Referência)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags / Categorias (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: Celebração, Adoração, Oferta, Ceia"
              className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
            />
          </div>

          {/* Rodapé */}
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
  );
}