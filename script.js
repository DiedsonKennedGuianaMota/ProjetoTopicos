// server.js
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();

// 1) CORS: liberar seu domínio (GitHub Pages)
app.use(cors({
  origin: 'https://diedsonkennedguianamota.github.io/ProjetoTopicos/', // seu site
}));

// 2) Body parser JSON
app.use(express.json());

// 3) Cliente OpenAI (defina OPENAI_API_KEY no ambiente)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 4) Rota de chat para o front
app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Campo "question" é obrigatório.' });
    }

    // Chamada ao modelo de chat
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Você é um tutor de programação para alunos iniciantes. Responda em português simples.'
        },
        { role: 'user', content: question }
      ]
    });

    const answer =
      response.output?.[0]?.content?.[0]?.text ||
      'Não consegui gerar uma resposta agora.';

    res.json({ answer });
  } catch (err) {
    console.error('Erro no servidor de IA:', err);
    res.status(500).json({ error: 'Erro interno no servidor de IA.' });
  }
});

// 5) Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor de IA rodando na porta ' + PORT);
});
