// sendMessage.js
import express from 'express';
import fetch from 'node-fetch'; // se Node <18

const app = express();
app.use(express.json());

const TOKEN = '8014555896:AAEb3ulaMJknmxvLKMln0H4N_lmZ7U0z6rI';
const CHAT_ID = '7961378096';

app.post('/sendTelegram', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Mensagem vazia' });

  try {
    const telegramUrl = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      return res.json({ success: true });
    } else {
      const text = await response.text();
      return res.status(500).json({ success: false, error: text });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Servidor a correr na porta 3000'));
