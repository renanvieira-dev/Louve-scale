export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, artist } = req.query;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  const cleanTitle = title.trim();
  const cleanArtist = (artist || '').trim();
  const query = `${cleanTitle} ${cleanArtist}`.trim();

  const parseValidKey = (raw) => {
    if (!raw) return null;
    const cleaned = raw.replace(/tom:?/gi, '').replace(/[()]/g, '').trim();
    const match = cleaned.match(/^([A-G][#b]?m?)/i);
    if (!match) return null;
    const base = match[1].charAt(0).toUpperCase();
    const rest = match[1].slice(1);
    return `${base}${rest}`;
  };

  try {
    let chordUrl = null;
    let detectedKey = null;

    // 1. Pesquisa web no DuckDuckGo para encontrar o link exato da cifra sem 404
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' cifra')}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (searchRes.ok) {
      const html = await searchRes.text();
      // Encontra o primeiro link válido de portal de cifras
      const match = html.match(/href="([^"]*(?:cifraclub\.com\.br\/[a-z0-9-]+\/[a-z0-9-]+|cifras\.com\.br\/cifra\/[a-z0-9-]+\/[a-z0-9-]+)[^"]*)"/i);
      
      if (match && match[1]) {
        let direct = match[1];
        if (direct.includes('uddg=')) {
          const parsed = new URL(direct, 'https://html.duckduckgo.com');
          direct = decodeURIComponent(parsed.searchParams.get('uddg'));
        }
        chordUrl = direct.split('?')[0];
      }
    }

    // 2. Se a busca web falhar, tenta autocomplete oficial do Cifra Club
    if (!chordUrl) {
      try {
        const ccRes = await fetch(`https://www.cifraclub.com.br/api/autocomplete/?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (ccRes.ok) {
          const ccData = await ccRes.json();
          const songItem = (ccData?.results || []).find(r => r.type === 'song' || r.type === 'm');
          if (songItem?.url) {
            chordUrl = songItem.url.startsWith('http') ? songItem.url : `https://www.cifraclub.com.br${songItem.url}`;
          }
        }
      } catch (_) {}
    }

    // 3. Lê o HTML da página encontrada para extrair o tom original
    if (chordUrl) {
      try {
        const pageRes = await fetch(chordUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9'
          }
        });

        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          const keyPatterns = [
            /id="cifra_tom"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i,
            /data-key="([A-G][#b]?m?)"/i,
            /"key":\s*"([A-G][#b]?m?)"/i,
            /"tom":\s*"([A-G][#b]?m?)"/i,
            /Tom:\s*<a[^>]*>([^<]+)<\/a>/i,
            /Tom:\s*<b>([^<]+)<\/b>/i,
            /class="cifra-tom"[^>]*>([^<]+)</i,
            /Tom:\s*([A-G][#b]?m?)/i
          ];

          for (const pattern of keyPatterns) {
            const m = pageHtml.match(pattern);
            if (m && m[1]) {
              const parsed = parseValidKey(m[1]);
              if (parsed) {
                detectedKey = parsed;
                break;
              }
            }
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({
      url: chordUrl || `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`,
      key: detectedKey || 'C',
      found: Boolean(chordUrl && detectedKey)
    });

  } catch (error) {
    console.error('Erro na rota /api/chords:', error);
    return res.status(200).json({
      url: `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`,
      key: 'C',
      found: false
    });
  }
}