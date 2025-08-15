import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extrair a ação da query string ou do body
    const action = req.query.action || req.body?.action;

    switch (action) {
      case 'get_teams':
        return await handleGetTeams(req, res);
      
      case 'update_team':
        return await handleUpdateTeam(req, res);
      
      case 'delete_team':
        return await handleDeleteTeam(req, res);
      
      case 'insert_member':
        return await handleInsertMember(req, res);
      
      case 'clear_all':
        return await handleClearAll(req, res);
      
      case 'reset_sequence':
        return await handleResetSequence(req, res);
      
      case 'save_header':
        return await handleSaveHeader(req, res);
      
      case 'get_header':
        return await handleGetHeader(req, res);
      
      default:
        // Se não especificar ação, manter comportamento original do fomio.js
        return await handleLegacyRouting(req, res);
    }

  } catch (error) {
    console.error('FOMIO Unified API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ===== FUNÇÕES PRINCIPAIS =====

// GET /api/fomio?action=get_teams
async function handleGetTeams(req, res) {
  const { data: teams, error } = await supabase
    .from('fomio_teams')
    .select('*')
    .order('team_name', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;

  // Organizar por equipa
  const teamData = {};
  teams.forEach(member => {
    if (!teamData[member.team_name]) {
      teamData[member.team_name] = [];
    }
    teamData[member.team_name].push({
      id: member.id,
      patente: member.patente,
      nome: member.nome
    });
  });

  return res.json({
    success: true,
    teams: teamData,
    timestamp: Date.now()
  });
}

// POST /api/fomio?action=update_team
async function handleUpdateTeam(req, res) {
  const { team_name, members } = req.body;

  if (!team_name || !Array.isArray(members)) {
    return res.status(400).json({
      success: false,
      error: 'team_name e members (array) são obrigatórios'
    });
  }

  // 1. Apagar todos os membros da equipa
  const { error: deleteError } = await supabase
    .from('fomio_teams')
    .delete()
    .eq('team_name', team_name);

  if (deleteError) throw deleteError;

  // 2. Inserir novos membros (se houver)
  if (members.length > 0) {
    const membersToInsert = members.map(member => ({
      team_name,
      patente: member.patente || '',
      nome: member.nome || ''
    }));

    const { error: insertError } = await supabase
      .from('fomio_teams')
      .insert(membersToInsert);

    if (insertError) throw insertError;
  }

  return res.json({
    success: true,
    message: `Equipa ${team_name} atualizada com ${members.length} membros`
  });
}

// DELETE /api/fomio?action=delete_team
async function handleDeleteTeam(req, res) {
  const { team_name } = req.body;

  if (!team_name) {
    return res.status(400).json({
      success: false,
      error: 'team_name é obrigatório'
    });
  }

  const { error } = await supabase
    .from('fomio_teams')
    .delete()
    .eq('team_name', team_name);

  if (error) throw error;

  return res.json({
    success: true,
    message: `Equipa ${team_name} limpa com sucesso`
  });
}

// POST /api/fomio?action=insert_member
async function handleInsertMember(req, res) {
  const { team_name, patente, nome } = req.body;

  console.log('Inserindo:', { team_name, patente, nome });

  const { data, error } = await supabase
    .from('fomio_teams')
    .insert([{ 
      team_name, 
      patente, 
      nome
    }])
    .select();

  if (error) throw error;

  console.log('Inserido com sucesso:', data);
  
  return res.status(200).json({ 
    success: true, 
    data 
  });
}

// DELETE /api/fomio?action=clear_all
async function handleClearAll(req, res) {
  console.log('Iniciando limpeza da tabela...');
  
  try {
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
    throw error;
  }
}

// POST /api/fomio?action=reset_sequence
async function handleResetSequence(req, res) {
  // Usar a função que criamos no SQL
  const { data, error } = await supabase.rpc('reset_fomio_sequence');
  
  if (error) {
    console.error('Reset error:', error);
    throw error;
  }
  
  console.log('Sequence reset executado com sucesso');
  
  return res.status(200).json({ 
    success: true, 
    message: 'Sequence reset com sucesso' 
  });
}

// POST /api/fomio?action=save_header
async function handleSaveHeader(req, res) {
  const { header_text } = req.body;

  if (!header_text) {
    return res.status(400).json({ 
      error: 'Header text é obrigatório' 
    });
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

  return res.status(200).json({ 
    success: true, 
    message: 'Header salvo com sucesso',
    data 
  });
}

// GET /api/fomio?action=get_header
async function handleGetHeader(req, res) {
  const { data, error } = await supabase
    .from('fomio_date')
    .select('header_text, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  const header = data && data.length > 0 ? data[0].header_text : null;

  return res.status(200).json({ 
    success: true, 
    header,
    updated_at: data && data.length > 0 ? data[0].updated_at : null
  });
}

// ===== COMPATIBILIDADE COM CÓDIGO ANTIGO =====

// Manter comportamento original do fomio.js para compatibilidade
async function handleLegacyRouting(req, res) {
  if (req.method === 'GET') {
    return await handleGetTeams(req, res);
  }

  if (req.method === 'POST') {
    // Se tiver team_name e members, é update_team
    if (req.body.team_name && req.body.members) {
      return await handleUpdateTeam(req, res);
    }
    // Se tiver header_text, é save_header
    if (req.body.header_text) {
      return await handleSaveHeader(req, res);
    }
    // Se tiver team_name, patente e nome, é insert_member
    if (req.body.team_name && req.body.patente && req.body.nome) {
      return await handleInsertMember(req, res);
    }
  }

  if (req.method === 'DELETE') {
    // Se tiver team_name, é delete_team
    if (req.body.team_name) {
      return await handleDeleteTeam(req, res);
    }
    // Se não tiver nada específico, é clear_all
    return await handleClearAll(req, res);
  }

  return res.status(405).json({ 
    error: 'Method not allowed or missing parameters' 
  });
}
