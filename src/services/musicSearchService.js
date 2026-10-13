// Serviço para pesquisar músicas e tentar extrair tom do Cifra Club

// Normalizar texto para URL do Cifra Club (ex: "Antonio Cirilo" -> "antonio-cirilo")
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 -]/g, '')     // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-');
}

export const musicSearchService = {
  // 1. Pesquisa no iTunes para pegar Título e Artista limpos
  async searchTracks(query) {
    if (!query) return [];
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6&country=BR`);
      const data = await res.json();
      return (data.results || []).map((track) => ({
        title: track.trackName,
        artist: track.artistName,
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100
      }));
    } catch (err) {
      console.error('Erro ao buscar faixas:', err);
      return [];
    }
  },

  // 2. Tentar buscar o Tom real direto do Cifra Club
  async fetchCifraClubKey(artist, title) {
    try {
      const artistSlug = slugify(artist);
      const songSlug = slugify(title);
      const targetUrl = `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`;

      // Usando allorigins como proxy CORS público para ler o HTML da cifra
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data && data.contents) {
        const html = data.contents;
        
        // O Cifra Club armazena o tom dentro de <span id="cifra_tom"><a>Tom</a></span> ou data-key
        // Regex para capturar o tom da cifra:
        const tomMatch = html.match(/id="cifra_tom"[^>]*>[\s\S]*?<a[^>]*>([A-G][b#]?[m]?)/i) 
          || html.match(/data-key="([A-G][b#]?[m]?)"/i)
          || html.match(/<b>tom:<\/b>\s*<a[^>]*>([A-G][b#]?[m]?)/i);

        if (tomMatch && tomMatch[1]) {
          return {
            key: tomMatch[1].trim(),
            chordsUrl: targetUrl
          };
        }
      }
    } catch (err) {
      console.warn('Não foi possível extrair o tom automaticamente do Cifra Club:', err);
    }

    // Se não encontrou o slug direto, retorna fallback com a busca tradicional
    return {
      key: null,
      chordsUrl: `https://www.cifraclub.com.br/?q=${encodeURIComponent(`${title}${artist}`)}`
    };
  }
};