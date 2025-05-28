import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Iniciando TRUNCATE da tabela fomio_teams...');
    
    // ✅ Usar TRUNCATE com reset de IDs
    const { data, error } = await supabase.rpc('truncate_fomio_teams');

    if (error) {
      console.error('TRUNCATE falhou, usando DELETE como fallback:', error);
      
      // Fallback: DELETE + reset sequence
      const { data: deleteData, error: deleteError } = await supabase
        .from('fomio_teams')
        .delete()
        .neq('id', 0);
      
      if (deleteError) throw deleteError;
      
      // Tentar reset da sequence
      await supabase.rpc('reset_fomio_sequence');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Data cleared with DELETE + sequence reset',
        method: 'fallback'
      });
    }

    console.log('TRUNCATE executado com sucesso');
    
    res.status(200).json({ 
      success: true, 
      message: 'Data cleared with TRUNCATE (efficient)',
      method: 'truncate'
    });

  } catch (error) {
    console.error('Clear Error:', error);
    res.status(500).json({ error: error.message });
  }
}
