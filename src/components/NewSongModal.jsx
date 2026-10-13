import React, { useState } from 'react';
import { 
  X, 
  Music2, 
  Check, 
  Link as LinkIcon, 
  Tag, 
  Search, 
  Loader2, 
  Youtube, 
  ExternalLink,
  SlidersHorizontal
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

// Base gospel para fallback de tons conhecidos por versão/artista
const GOSPEL_VERSIONS_TONES = {
  'bondade de deus isaias saad': 'G',
  'bondade de deus bethel': 'Ab',
  'ousado amor isaias saad': 'Gb',
  'todavia me alegrarei leandro borges': 'C',
  'todavia me alegrarei samuel miranda': 'D',
  'a bênção gabriel guedes': 'Bb',
  'a bênção julia vitoria': 'B',
  'me atraiu gabriela rocha': 'Em',
  'ruja o leão casa worship': 'C#m',
  'a casa é sua casa worship': 'A',
  'lugar secreto gabriela rocha': 'A',
  'maranata avivah': 'G',
  'digno de tudo': 'D',
  'teu reino ministério amor e graça': 'E'
};

export default function NewSongModal({ isOpen, onClose, onSave }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Campos da Música Selecionada
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [defaultKey, setDefaultKey] = useState('G');
  const [bpm, setBpm] = useState('');
  const [chordsUrl, setChordsUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  // Normalização confiável de tom para nunca quebrar o <select>
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

  // Buscar Versões no YouTube via endpoint público
  const handleSearchVersions = async (e) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      setSearchResults([]);

      const query = `${searchTerm.trim()} louvor oficial`;

      // Busca na API de busca aberta do YouTube/Invidious
      const response = await fetch(
        `https://invidious.io.lol/api/v1/search?q=${encodeURIComponent(query)}&type=video`
      );

      if (response.ok) {
        const data = await response.json();
        const formatted = (data || []).slice(0, 5).map((item) => {
          // Limpeza do nome do artista/canal
          const channelName = (item.author || '')
            .replace(' - Topic', '')
            .replace(' Oficial', '')
            .replace(' VEVE', '')
            .trim();

          return {
            id: item.videoId,
            title: item.title,
            artist: channelName || 'Ministério de Louvor',
            thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${item.videoId}`
          };
        });
        setSearchResults(formatted);
      } else {
        throw new Error('Falha na requisição');
      }
    } catch {
      // Fallback gracioso com versões simuladas caso o proxy público oscile
      const queryClean = searchTerm.trim();
      setSearchResults([
        {
          id: 'fb-1',
          title: `${queryClean} (Versão Oficial / Clipe)`,
          artist: 'Versão Mais Tocada',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryClean + ' louvor')}`
        },
        {
          id: 'fb-2',
          title: `${queryClean} (Ao Vivo / Conferência)`,
          artist: 'Versão Ao Vivo',
          thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryClean + ' ao vivo')}`
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  // Ao clicar em uma versão sugerida:
  const handleSelectVersion = (version) => {
    // 1. Limpa o título (remove termos como "(Clipe Oficial)", "(Ao Vivo)", etc.)
    const cleanTitle = version.title
      .replace(/\(Vídeo Oficial.*?\)/gi, '')
      .replace(/\(Clipe Oficial.*?\)/gi, '')
      .replace(/\(Ao Vivo.*?\)/gi, '')
      .replace(/\[Vídeo Oficial.*?\]/gi, '')
      .replace(/\|.*$/g, '')
      .trim();

    setTitle(cleanTitle);
    setArtist(version.artist);
    setYoutubeUrl(version.url);

    // 2. Monta link da Cifra Club formatado
    const slugArtist = version.artist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slugTitle = cleanTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    setChordsUrl(`https://www.cifraclub.com.br/${slugArtist}/${slugTitle}/`);

    // 3. Tenta identificar o tom correspondente da versão
    const matchLookup = `${cleanTitle.toLowerCase()} ${version.artist.toLowerCase()}`;
    let detectedTone = 'G';

    for (const [keyPattern, keyVal] of Object.entries(GOSPEL_VERSIONS_TONES)) {
      if (matchLookup.includes(keyPattern)) {
        detectedTone = keyVal;
        break;
      }
    }

    // Se no título da versão tiver menção explícita de tom (ex: "Tom: E" ou "(Tom E)")
    const explicitToneMatch = version.title.match(/tom[:\s]+([A-G][#b]?m?)/i);
    if (explicitToneMatch && explicitToneMatch[1]) {
      detectedTone = explicitToneMatch[1];
    }

    setDefaultKey(normalizeDetectedKey(detectedTone));

    // Fecha lista de resultados para focar no formulário final
    setSearchResults([]);
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
      youtube_url: youtubeUrl.trim() || null,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()) : []
    });

    // Reset geral
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
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

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* BARRA DE BUSCA RÁPIDA DE VERSÕES */}
          <div className="bg-church-dark p-3.5 rounded-2xl border border-church-border space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-church-blue" /> Buscar Louvor e Versões
            </label>
            <p className="text-[11px] text-slate-400">
              Digite o nome do louvor para puxar as versões, o tom e links do YouTube e cifras:
            </p>
            
            <form onSubmit={handleSearchVersions} className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Bondade de Deus, Me Atraiu, Todavia..."
                className="flex-1 bg-church-card border border-church-border rounded-xl px-3 py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-church-blue"
              />
              <button
                type="submit"
                disabled={isSearching || !searchTerm.trim()}
                className="px-3.5 py-2 bg-church-blue hover:bg-church-blue-hover disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-md shadow-blue-600/20"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Buscar
              </button>
            </form>

            {/* SUGESTÕES DE VERSÕES ENCONTRADAS */}
            {searchResults.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Escolha uma das versões encontradas:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {searchResults.map((ver) => (
                    <div
                      key={ver.id}
                      onClick={() => handleSelectVersion(ver)}
                      className="p-2 rounded-xl bg-church-card hover:bg-church-card-hover border border-church-border hover:border-church-blue/60 flex items-center gap-3 cursor-pointer transition-all group"
                    >
                      <img 
                        src={ver.thumbnail} 
                        alt="" 
                        className="w-14 h-10 object-cover rounded-lg flex-shrink-0 bg-slate-900 border border-church-border"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-church-blue truncate">
                          {ver.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {ver.artist}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-church-blue bg-blue-950/60 border border-church-blue/30 px-2 py-1 rounded-lg flex-shrink-0">
                        Usar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !isSearching && (
              <p className="text-[11px] text-slate-500 italic">
                Nenhuma versão encontrada pela busca. Preencha os campos abaixo manualmente se desejar.
              </p>
            )}
          </div>

          {/* FORMULÁRIO FINAL DE CONFIRMAÇÃO / CADASTRO */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Título do Louvor *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bondade de Deus"
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
                placeholder="Ex: Isaías Saad"
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
                  placeholder="Ex: 72, 120"
                  className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-church-blue" /> Link da Cifra (Cifra Club ou PDF)
              </label>
              <input
                type="url"
                value={chordsUrl}
                onChange={(e) => setChordsUrl(e.target.value)}
                placeholder="https://www.cifraclub.com.br/..."
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-church-red" /> Link do YouTube (Vídeo de Referência)
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full box-border bg-church-dark border border-church-border rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-church-blue"
              />
            </div>

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

            {/* Rodapé com Botão de Confirmação */}
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