import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-youtube',
      configureServer(server) {
        server.middlewares.use('/api/youtube', async (req, res) => {
          const url = new URL(req.url, 'http://localhost');
          const q = url.searchParams.get('q');

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (!q) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Query q ausente' }));
            return;
          }

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
                  query: q
                })
              }
            );

            if (ytRes.ok) {
              const data = await ytRes.json();
              const stringified = JSON.stringify(data);
              const match = stringified.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (match && match[1]) {
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    videoId: match[1],
                    url: `https://www.youtube.com/watch?v=${match[1]}`
                  })
                );
                return;
              }
            }
          } catch (e) {
            console.warn('Erro local YouTube fetch:', e);
          }

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              videoId: null,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
            })
          );
        });
      }
    }
  ]
});