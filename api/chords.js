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

  // Função auxiliar para normalizar e validar tons musicais
  const parseValidKey = (raw) => {
    if (!raw) return null;
    const cleaned = raw.replace(/tom:?/gi, '').replace(/[()]/g, '').trim();
    const match = cleaned.match(/^([A-G][#b]?m?)/i);
    if (!match) return null;
    
    // Devolve formatado (ex: C, C#m, Eb, F#m)
    const base = match[1].charAt(0).toUpperCase();
    const rest = match[1].slice(1);
    return `${base}${rest}`;
  };

  try {
    let chordUrl = null;
    let detectedKey = null;

    // 1. Procurar a URL no autocomplete oficial do Cifra Club
    const ccSearchUrl = `https://www.cifraclub.com.br/api/autocomplete/?q=${encodeURIComponent(query)}`;
    const ccRes = await fetch(ccSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (ccRes.ok) {
      const data = await ccRes.json();
      const songResult = (data?.results || []).find((r) => r.type === 'song' || r.type === 'm');

      if (songResult && songResult.url) {
        chordUrl = songResult.url.startsWith('http')
          ? songResult.url
          : `https://www.cifraclub.com.br${songResult.url}`;
      }
    }

    // 2. Se a pesquisa interna não devolver, efetuar pesquisa direta
    if (!chordUrl) {
      const duckRes = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' cifra club')}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      if (duckRes.ok) {
        const duckHtml = await duckRes.text();
        const linkMatch = duckHtml.match(/href="([^"]*(?:cifraclub\.com\.br\/[a-z0-9-]+\/[a-z0-9-]+)[^"]*)"/i);
        if (linkMatch && linkMatch[1]) {
          let direct = linkMatch[1];
          if (direct.includes('uddg=')) {
            const parsed = new URL(direct, 'https://html.duckduckgo.com');
            direct = decodeURIComponent(parsed.searchParams.get('uddg'));
          }
          if (direct.includes('cifraclub.com.br/')) {
            chordUrl = direct.split('?')[0];
          }
        }
      }
    }

    // 3. Descarregar o HTML da cifra para extrair o tom exato
    if (chordUrl) {
      const pageRes = await fetch(chordUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        }
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        // Lista abrangente de seletores e padrões onde o Cifra Club armazena o tom
        const patterns = [
          /id="cifra_tom"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/i,
          /data-key="([A-G][#b]?m?)"/i,
          /"key":\s*"([A-G][#b]?m?)"/i,
          /"tom":\s*"([A-G][#b]?m?)"/i,
          /Tom:\s*<a[^>]*>([^<]+)<\/a>/i,
          /Tom:\s*<b>([^<]+)<\/b>/i,
          /class="cifra-tom"[^>]*>([^<]+)</i,
          /Tom:\s*([A-G][#b]?m?)/i
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const parsed = parseValidKey(match[1]);
            if (parsed) {
              detectedKey = parsed;
              break;
            }
          }
        }
      }
    }

    return res.status(200).json({
      url: chordUrl || `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`,
      key: detectedKey || 'A', // Em caso de falha de parsing, tom habitual de louvor contemporâneo
      found: Boolean(chordUrl && detectedKey)
    });

  } catch (error) {
    console.error('Erro ao resolver cifra e tom:', error);
    return res.status(200).json({
      url: `https://www.cifraclub.com.br/?q=${encodeURIComponent(query)}`,
      key: 'C',
      found: false
    });
  }
}