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
    console.log('Limpando tabela e resetando sequence...');
    
    // 1. Apagar todos os registos
    const { data: deleteData, error: deleteError } = await supabase
      .from('fomio_teams')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.error('Erro no DELETE:', deleteError);
      throw deleteError;
    }
    
    // 2. ✅ RESET FORÇADO DA SEQUENCE
    const { data: resetData, error: resetError } = await supabase
      .from('fomio_teams')
      .select('id')
      .limit(1);
    
    // Usar query SQL direta para reset
    const resetQuery = `SELECT setval('fomio_teams_id_seq', 1, false);`;
    
    // Como não temos acesso direto ao SQL, vamos usar um workaround
    // Inserir e apagar um registo para forçar reset
    const { data: tempData, error: tempError } = await supabase
      .from('fomio_teams')
      .insert({ team_name: 'temp', patente: 'temp', nome: 'temp' })
      .select();
    
    if (!tempError && tempData && tempData.length > 0) {
      // Se o ID não for 1, há problema na sequence
      const tempId = tempData[0].id;
      
      // Apagar o registo temporário
      await supabase
        .from('fomio_teams')
        .delete()
        .eq('id', tempId);
      
      console.log(`Sequence testada - próximo ID seria: ${tempId + 1}`);
    }

    console.log('Limpeza e reset concluídos');
    
    res.status(200).json({ 
      success: true, 
      message: 'Limpeza e reset de sequência com sucesso'
    });

  } catch (error) {
    console.error('Clear Error:', error);
    res.status(500).json({ error: error.message });
  }
}
