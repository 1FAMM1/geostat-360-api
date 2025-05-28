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
    console.log('Iniciando limpeza da tabela...');
    
    // Método 1: TRUNCATE direto via SQL
    const { data: truncateData, error: truncateError } = await supabase
      .rpc('sql', { 
        query: 'TRUNCATE TABLE fomio_teams RESTART IDENTITY CASCADE;' 
      });

    if (!truncateError) {
      console.log('TRUNCATE executado com sucesso');
      return res.status(200).json({ 
        success: true, 
        message: 'Data cleared with TRUNCATE',
        method: 'truncate_sql'
      });
    }

    console.log('TRUNCATE falhou, tentando função personalizada...');
    
    // Método 2: Função personalizada
    const { data: funcData, error: funcError } = await supabase
      .rpc('truncate_fomio_teams');

    if (!funcError) {
      console.log('Função personalizada executada');
      return res.status(200).json({ 
        success: true, 
        message: 'Data cleared with custom function',
        method: 'custom_function'
      });
    }

    console.log('Função falhou, usando DELETE + reset manual...');
    
    // Método 3: DELETE + reset manual
    const { data: deleteData, error: deleteError } = await supabase
      .from('fomio_teams')
      .delete()
      .neq('id', 0);
    
    if (deleteError) throw deleteError;
    
    // Reset manual da sequence
    const { data: resetData, error: resetError } = await supabase
      .rpc('sql', { 
        query: "SELECT setval('fomio_teams_id_seq', 1, false);" 
      });

    console.log('DELETE + reset manual executado');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Data cleared with DELETE + manual reset',
      method: 'delete_reset'
    });

  } catch (error) {
    console.error('Clear Error:', error);
    res.status(500).json({ error: error.message });
  }
}
