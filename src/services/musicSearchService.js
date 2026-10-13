function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export const musicSearchService = {
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

  async fetchCifraClubKey(artist, title) {
    const artistSlug = slugify(artist);
    const songSlug = slugify(title);
    const targetUrl = `https://www.cifraclub.com.br/${artistSlug}/${songSlug}/`;

    try {
      // Tentar via proxy corsproxy.io (mais rápido e sem cache antigo)
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const html = await response.text();
        
        // Cifra Club armazena o tom em <span id="cifra_tom"><a>Tom</a></span> ou no seletor data-key
        const tomMatch = 
          html.match(/id="cifra_tom"[^>]*>[\s\S]*?<a[^>]*>([A-G][b#]?[m]?)/i) ||
          html.match(/data-key="([A-G][b#]?[m]?)"/i) ||
          html.match(/<b>tom:<\/b>\s*<a[^>]*>([A-G][b#]?[m]?)/i);

        if (tomMatch && tomMatch[1]) {
          return {
            key: tomMatch[1].trim(),
            chordsUrl: targetUrl
          };
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar Cifra Club via proxy 1:', err);
    }

    // Fallback: Tentar via allorigins
    try {
      const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(allOriginsUrl);
      const data = await res.json();
      if (data && data.contents) {
        const html = data.contents;
        const tomMatch = 
          html.match(/id="cifra_tom"[^>]*>[\s\S]*?<a[^>]*>([A-G][b#]?[m]?)/i) ||
          html.match(/data-key="([A-G][b#]?[m]?)"/i);

        if (tomMatch && tomMatch[1]) {
          return {
            key: tomMatch[1].trim(),
            chordsUrl: targetUrl
          };
        }
      }
    } catch (err) {
      console.warn('Erro no fallback allorigins:', err);
    }

    // Se não encontrou tom exato, retorna URL de busca direta
    return {
      key: null,
      chordsUrl: `https://www.cifraclub.com.br/?q=${encodeURIComponent(`${title}${artist}`)}`
    };
  }
};