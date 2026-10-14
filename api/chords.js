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

  // 1. Limpeza profunda de títulos e artistas
  const cleanTitle = title
    .replace(/\s*[\(\[](feat\.\vert{}ao vivo\vert{}live\vert{}acústico\vert{}acustico\vert{}clipe oficial\vert{}playback\vert{}vídeo oficial\vert{}video oficial).*?[\)\]]/gi, '')
    .trim();

  const cleanArtist = (artist || '')
    .split(/[,&/]|feat\./i)[0]
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .trim();

  // Dicionário de contingência para louvores conhecidos
  const KNOWN_WORSHIP_KEYS = {
    'seja o centro': 'E',
    'te louvarei': 'Bb',
    'perto quero estar': 'Bb',
    'ser mudado': 'A',
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

  const parseValidKey = (raw) => {
    if (!raw) return null;
    const cleaned = raw.replace(/tom:?/gi, '').replace(/[()]/g, '').trim();
    const match = cleaned.match(/^([A-G][#b]?m?)/i);
    if (!match) return null;
    const base = match[1].charAt(0).toUpperCase();
    const rest = match[1].slice(1);
    return `${base}${rest}`;
  };

  const normalizedTitle = cleanTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let detectedKey = KNOWN_WORSHIP_KEYS[normalizedTitle] || null;
  let chordUrl = null;

  try {
    // 2. Busca interna no Cifra Club com nome limpo
    const searchQueries = [
      `${cleanTitle} ${cleanArtist}`,
      cleanTitle
    ];

    for (const q of searchQueries) {
      if (chordUrl) break;
      try {
        const ccRes = await fetch(
          `https://www.cifraclub.com.br/api/autocomplete/?q=${encodeURIComponent(q.trim())}`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
        );

        if (ccRes.ok) {
          const data = await ccRes.json();
          const songItem = (data?.results || []).find((r) => r.type === 'song' || r.type === 'm');
          if (songItem?.url) {
            chordUrl = songItem.url.startsWith('http')
              ? songItem.url
              : `https://www.cifraclub.com.br${songItem.url}`;
          }
        }
      } catch (_) {}
    }

    // 3. Fallback de busca na web se o autocomplete falhar
    if (!chordUrl) {
      const searchRes = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${cleanTitle}${cleanArtist} cifra`)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );

      if (searchRes.ok) {
        const html = await searchRes.text();
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
    }

    // 4. Extração do tom na página da cifra
    if (chordUrl) {
      try {
        const pageRes = await fetch(chordUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
      url: chordUrl || `https://www.cifraclub.com.br/?q=${encodeURIComponent(`${cleanTitle}${cleanArtist}`)}`,
      key: detectedKey || 'E',
      found: Boolean(chordUrl)
    });

  } catch (error) {
    console.error('Erro em api/chords:', error);
    return res.status(200).json({
      url: `https://www.cifraclub.com.br/?q=${encodeURIComponent(`${cleanTitle}${cleanArtist}`)}`,
      key: detectedKey || 'E',
      found: false
    });
  }
}