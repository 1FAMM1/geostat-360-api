import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
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
    const { header_text } = req.body;

    if (!header_text) {
      return res.status(400).json({ error: 'Header text é obrigatório' });
    }

    console.log('Salvando header:', header_text);

    // Limpar header anterior e inserir novo
    await supabase.from('fomio_date').delete().neq('id', 0);
    
    const { data, error } = await supabase
      .from('fomio_date')
      .insert({ header_text })
      .select();

    if (error) throw error;

    console.log('Header salvo com sucesso');

    res.status(200).json({ 
      success: true, 
      message: 'Header salvo com sucesso',
      data 
    });

  } catch (error) {
    console.error('Save Header Error:', error);
    res.status(500).json({ error: error.message });
  }
}
