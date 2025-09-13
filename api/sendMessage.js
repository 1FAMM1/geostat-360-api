export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { vehicle, action, kilometers, hours, minutes, temBomba } = req.body;

  if (!vehicle || !action) {
    return res.status(400).json({ success: false, message: 'Faltam parâmetros essenciais' });
  }

  try {
    // 🔑 Inserir direto aqui
    const TELEGRAM_TOKEN = '8065383541:AAG96PvaHbqXKJmFgVvW5Hs7uJ9NtXR00tg';
    const TELEGRAM_CHAT_ID = '7961378096';

    const now = new Date();
    const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pt-PT');

    let message = `🚨 *GEOSTAT 360*\n\n${vehicle}\n📍 *${action}*\n\n⏰ ${time}\n📅 ${date}`;
    if (kilometers) message += `\n🛣️ *KMs: ${kilometers}*`;
    if (temBomba) {
      const pumpTime = `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m`;
      message += `\n⏱️ *Tempo Bomba: ${pumpTime}*`;
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, message: data.description || 'Erro no Telegram' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
