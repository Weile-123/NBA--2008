import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', game: 'NBA传奇生涯 2008' });
  });

  // Server-side Gemini narrative helper
  app.post('/api/ai/narrative', async (req, res) => {
    const { prompt, type } = req.body;
    try {
      const rawKey = process.env.GEMINI_API_KEY;
      const apiKey = (rawKey && rawKey !== 'MY_GEMINI_API_KEY')
        ? rawKey
        : 'sk-ZBTMlw3rcaofRD0qlYt7u0zncmWiFjsWbjnzqJNeDdFVLAQ6';

      if (!apiKey) {
        return res.json({
          success: false,
          fallback: true,
          content: '【系统模拟】今夜的比赛震撼全场，球星用实力证明了自己的价值！',
        });
      }

      if (apiKey.startsWith('sk-')) {
        try {
          const baseUrl = process.env.OPENAI_BASE_URL || 'https://once-cf.novai.su/v1';
          const candidateModels = [
            process.env.OPENAI_MODEL,
            '[次]gemini-2.5-pro',
            '[次]gemini-3.5-flash',
            'gpt-4o-mini',
            'gemini-2.5-flash'
          ].filter(Boolean) as string[];

          for (const targetModel of candidateModels) {
            const openAiRes = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: targetModel,
                messages: [
                  { role: 'user', content: prompt || '请写一段2008年NBA比赛精彩评论。' }
                ],
              }),
            });

            if (openAiRes.ok) {
              const data = await openAiRes.json();
              const content = data.choices?.[0]?.message?.content;
              if (content) {
                return res.json({ success: true, content });
              }
            }
          }
        } catch (e) {
          console.warn('Novai relay endpoint request failed, attempting Gemini SDK:', e);
        }
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt || '请写一段2008年NBA比赛精彩评论。',
      });

      res.json({
        success: true,
        content: response.text,
      });
    } catch (err: any) {
      console.error('AI API Error:', err);
      res.json({
        success: false,
        fallback: true,
        content: '【比赛特别报道】球星展现了卓越的技战术素养，带领球队冲击总冠军！',
      });
    }
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NBA Career Server running on http://localhost:${PORT}`);
  });
}

startServer();
