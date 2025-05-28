import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { team_name, patente, nome } = req.body;

    console.log('Recebido:', { team_name, patente, nome });

    const { data, error } = await supabase
      .from('fomio_teams')
      .insert([{ 
        team_name, 
        patente, 
        nome,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Erro Supabase:', error);
      throw error;
    }

    console.log('Inserido com sucesso:', data);
    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
}
