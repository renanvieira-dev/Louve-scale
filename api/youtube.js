export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query q ausente' });
  }

  // Limpa termos como (feat...), [Ao Vivo], etc., para focar na busca exata
  const cleanQ = q
    .replace(/\s*[\(\[](feat\.\vert{}ao vivo\vert{}live\vert{}acústico\vert{}acustico).*?[\)\]]/gi, '')
    .trim();

  const searchQuery = `${cleanQ} oficial`.trim();

  // 1. Tentar via InnerTube API nativa do YouTube
  try {
    const ytRes = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240101.01.00',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/'
      },
      body: JSON.stringify({
        context: {
          client: { clientName: 'WEB', clientVersion: '2.20240101.01.00', hl: 'pt-BR', gl: 'BR' }
        },
        query: searchQuery
      })
    });

    if (ytRes.ok) {
      const data = await ytRes.json();
      const stringified = JSON.stringify(data);
      const match = stringified.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return res.status(200).json({
          videoId: match[1],
          url: `https://www.youtube.com/watch?v=${match[1]}`
        });
      }
    }
  } catch (err) {
    console.warn('InnerTube falhou:', err);
  }

  // 2. Fallback de contingência
  return res.status(200).json({
    videoId: null,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
  });
}