import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defina no ambiente
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Você é um tutor de programação para alunos iniciantes. Responda em português de forma simples.'
        },
        { role: 'user', content: question }
      ]
    });

    const answer = response.output[0].content[0].text || 'Não consegui responder agora.';
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor de IA.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor de IA rodando na porta ' + PORT));
