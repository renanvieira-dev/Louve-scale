// api/chords.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, artist } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  const cleanTitle = title.trim();
  const cleanArtist = (artist || '').trim();
  const query = `${cleanTitle} ${cleanArtist} cifra`.trim();

  try {
    // 1. Tentar buscar direto na API de busca interna do Cifra Club
    const ccSearchUrl = `https://www.cifraclub.com.br/api/autocomplete/?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`;
    const ccRes = await fetch(ccSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (ccRes.ok) {
      const data = await ccRes.json();
      // Procura primeiro resultado do tipo música
      const songResult = (data?.results || []).find(r => r.type === 'song' || r.type === 'm');

      if (songResult && songResult.url) {
        const fullUrl = `https://www.cifraclub.com.br${songResult.url}`;
        
        // Pega a página para ler o tom oficial
        const pageRes = await fetch(fullUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        let detectedKey = 'C';
        if (pageRes.ok) {
          const html = await pageRes.text();
          // Procura a tag de tom do Cifra Club: id="cifra_tom" ou "Tom: <b>X</b>"
          const keyMatch = html.match(/id="cifra_tom"[^>]*>([^<]+)<\/a>/i) ||
                           html.match(/tom:?\s*<[^>]+>([A-G][#b]?[m]?)/i) ||
                           html.match(/"key":\s*"([A-G][#b]?[m]?)"/i);
          if (keyMatch && keyMatch[1]) {
            detectedKey = keyMatch[1].trim();
          }
        }

        return res.status(200).json({
          url: fullUrl,
          key: detectedKey,
          source: 'cifraclub'
        });
      }
    }

    // 2. Fallback: DuckDuckGo / Bing para encontrar o link exato da cifra sem 404
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (searchRes.ok) {
      const html = await searchRes.text();
      // Pega o primeiro link de cifra (Cifra Club, Cifras.com.br, etc.)
      const linkMatch = html.match(/href="([^"]*(?:cifraclub\.com\.br|cifras\.com\.br|vagalume\.com\.br\/[^"]*cifra)[^"]*)"/i);

      if (linkMatch && linkMatch[1]) {
        let actualUrl = linkMatch[1];
        // Decodifica redirecionamento DuckDuckGo se necessário
        if (actualUrl.includes('uddg=')) {
          const params = new URL(actualUrl, 'https://html.duckduckgo.com');
          actualUrl = decodeURIComponent(params.searchParams.get('uddg'));
        }

        // Tenta ler o tom direto dessa página
        let detectedKey = 'C';
        try {
          const chordPageRes = await fetch(actualUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          if (chordPageRes.ok) {
            const pageHtml = await chordPageRes.text();
            const keyMatch = pageHtml.match(/id="cifra_tom"[^>]*>([^<]+)<\/a>/i) ||
                             pageHtml.match(/Tom:\s*<b>([A-G][#b]?[m]?)/i) ||
                             pageHtml.match(/Tom:\s*([A-G][#b]?[m]?)/i);
            if (keyMatch && keyMatch[1]) {
              detectedKey = keyMatch[1].trim();
            }
          }
        } catch {
          // Mantém tom padrão se a leitura falhar
        }

        return res.status(200).json({
          url: actualUrl,
          key: detectedKey,
          source: 'web'
        });
      }
    }

    // 3. Fallback genérico se nada for encontrado na busca
    return res.status(200).json({
      url: `https://www.cifraclub.com.br/?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`,
      key: 'C',
      source: 'search_fallback'
    });

  } catch (err) {
    console.error('Erro ao resolver cifra e tom:', err);
    return res.status(200).json({
      url: `https://www.cifraclub.com.br/?q=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}`,
      key: 'C',
      source: 'fallback'
    });
  }
}