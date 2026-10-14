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
              `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
                }
              }
            );

            const html = await ytRes.text();
            const videoMatches = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);

            if (videoMatches && videoMatches.length > 0) {
              const idMatch = videoMatches[0].match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (idMatch && idMatch[1]) {
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    videoId: idMatch[1],
                    url: `https://www.youtube.com/watch?v=${idMatch[1]}`
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