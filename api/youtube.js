export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório.' });
  }

  const cleanQuery = q.trim();

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube status ${response.status}`);
    }

    const html = await response.text();

    // Regex para extrair o primeiro videoId renderizado no payload do YouTube
    const videoMatches = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);

    if (videoMatches && videoMatches.length > 0) {
      for (const item of videoMatches) {
        const idMatch = item.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (idMatch && idMatch[1]) {
          const videoId = idMatch[1];
          return res.status(200).json({
            videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      }
    }

    return res.status(200).json({
      videoId: null,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`
    });
  } catch (error) {
    console.error('Erro na rota api/youtube:', error);
    return res.status(200).json({
      videoId: null,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`,
      error: error.message
    });
  }
}