export default async function handler(req, res) {
  // Liberação de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Parâmetro de busca "q" ausente' });
  }

  const cleanQuery = q.trim();

  // 1. Se você configurar uma chave no painel da Vercel (YOUTUBE_API_KEY), usa a API oficial do Google
  const googleApiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;
  if (googleApiKey) {
    try {
      const gRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(cleanQuery)}&key=${googleApiKey}`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        const vidId = gData.items?.[0]?.id?.videoId;
        if (vidId) {
          return res.status(200).json({
            videoId: vidId,
            url: `https://www.youtube.com/watch?v=${vidId}`
          });
        }
      }
    } catch (e) {
      console.warn('Google API Key falhou, tentando InnerTube API:', e);
    }
  }

  // 2. YouTube InnerTube API (Sem necessidade de chave, protocolo nativo do YouTube)
  try {
    const ytRes = await fetch(
      'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20240101.01.00',
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240101.01.00',
              hl: 'pt-BR',
              gl: 'BR'
            }
          },
          query: cleanQuery
        })
      }
    );

    if (ytRes.ok) {
      const data = await ytRes.json();
      const stringified = JSON.stringify(data);

      // Extrai o primeiro videoId válido de 11 caracteres presente nos renderizadores
      const match = stringified.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return res.status(200).json({
          videoId: match[1],
          url: `https://www.youtube.com/watch?v=${match[1]}`
        });
      }
    }
  } catch (err) {
    console.error('InnerTube falhou:', err);
  }

  // 3. Fallback de contingência caso os dois falhem
  return res.status(200).json({
    videoId: null,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`
  });
}