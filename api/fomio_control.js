import { createClient } from '@supabase/supabase-js'

// 🔧 Configuração Supabase
const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

// 🧠 Handler principal
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const action = req.query.action || req.body?.action
    console.log('🔹 Ação recebida:', action)

    switch (action) {
      case 'get_teams':
        return await handleGetTeams(req, res)
      case 'update_team':
        return await handleUpdateTeam(req, res)
      case 'delete_team':
        return await handleDeleteTeam(req, res)
      case 'insert_member':
        return await handleInsertMember(req, res)
      case 'clear_all':
        return await handleClearAll(req, res)
      case 'reset_sequence':
        return await handleResetSequence(req, res)
      case 'save_header':
        return await handleSaveHeader(req, res)
      case 'get_header':
        return await handleGetHeader(req, res)
      default:
        return await handleLegacyRouting(req, res)
    }
  } catch (error) {
    console.error('💥 ERRO GERAL:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ============================================================
// 📋 HANDLERS
// ============================================================

// 🔹 Buscar todas as equipas
async function handleGetTeams(req, res) {
  console.log('➡️ Buscando equipas...')
  const { data, error } = await supabase
    .from('fomio_teams')
    .select('*')
    .order('team_name', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw error

  const teamData = {}
  data.forEach(member => {
    if (!teamData[member.team_name]) teamData[member.team_name] = []
    teamData[member.team_name].push(member)
  })

  console.log('✅ Equipas carregadas:', Object.keys(teamData))
  return res.json({ success: true, teams: teamData })
}

// 🔹 Atualizar uma equipa completa
async function handleUpdateTeam(req, res) {
  const { team_name, members } = req.body
  console.log(`➡️ Atualizando equipa: ${team_name}`)

  if (!team_name || !Array.isArray(members)) {
    return res.status(400).json({
      success: false,
      error: 'team_name e members (array) são obrigatórios',
    })
  }

  const { error: deleteError } = await supabase
    .from('fomio_teams')
    .delete()
    .eq('team_name', team_name)

  if (deleteError) throw deleteError

  if (members.length === 0) {
    console.log(`⚠️ Equipa ${team_name} apagada sem novos membros`)
    return res.json({ success: true, message: `Equipa ${team_name} apagada` })
  }

  const membersToInsert = members.map(member => ({
    team_name,
    n_int: member.n_int || '',
    patente: member.patente || '',
    nome: member.nome || '',
    h_entrance: member.h_entrance || '',
    h_exit: member.h_exit || '',
    MP: !!member.MP,
    TAS: !!member.TAS,
    observ: member.observ || '',
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('fomio_teams')
    .insert(membersToInsert)
    .select()

  if (insertError) throw insertError

  console.log(`✅ ${inserted.length} registos gravados para ${team_name}`)
  return res.json({
    success: true,
    message: `Equipa ${team_name} atualizada com ${inserted.length} membros`,
  })
}

// 🔹 Inserir membro individual
async function handleInsertMember(req, res) {
  const {
    team_name,
    n_int = '',
    patente = '',
    nome = '',
    h_entrance = '',
    h_exit = '',
    MP = false,
    TAS = false,
    observ = '',
  } = req.body

  console.log('🟢 Inserindo membro:', { team_name, nome })

  const { data, error } = await supabase
    .from('fomio_teams')
    .insert([{ team_name, n_int, patente, nome, h_entrance, h_exit, MP, TAS, observ }])
    .select()

  if (error) throw error

  return res.json({ success: true, data })
}

// 🔹 Eliminar equipa específica
async function handleDeleteTeam(req, res) {
  const { team_name } = req.body
  console.log('🗑️ Eliminando equipa:', team_name)

  if (!team_name)
    return res.status(400).json({ success: false, error: 'team_name é obrigatório' })

  const { error } = await supabase.from('fomio_teams').delete().eq('team_name', team_name)
  if (error) throw error

  return res.json({ success: true, message: `Equipa ${team_name} eliminada` })
}

// 🔹 Limpar tudo (reset geral)
async function handleClearAll(req, res) {
  console.log('🧹 Limpando tabela fomio_teams...')

  const { error: deleteError } = await supabase.from('fomio_teams').delete().neq('id', 0)
  if (deleteError) throw deleteError

  console.log('✅ Todos os registos foram apagados')
  return res.json({ success: true, message: 'Todos os registos eliminados' })
}

// 🔹 Resetar sequence (ID)
async function handleResetSequence(req, res) {
  console.log('♻️ Resetando sequência fomio_teams_id_seq...')
  const { error } = await supabase.rpc('reset_fomio_sequence')
  if (error) throw error

  return res.json({ success: true, message: 'Sequência resetada com sucesso' })
}

// 🔹 Salvar cabeçalho
async function handleSaveHeader(req, res) {
  const { header_text } = req.body
  console.log('🕓 Salvando cabeçalho:', header_text)

  if (!header_text)
    return res.status(400).json({ success: false, error: 'header_text é obrigatório' })

  await supabase.from('fomio_date').delete().neq('id', 0)

  const { data, error } = await supabase.from('fomio_date').insert({ header_text }).select()
  if (error) throw error

  return res.json({ success: true, message: 'Header salvo com sucesso', data })
}

// 🔹 Obter cabeçalho mais recente
async function handleGetHeader(req, res) {
  const { data, error } = await supabase
    .from('fomio_date')
    .select('header_text, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) throw error

  return res.json({
    success: true,
    header: data?.[0]?.header_text || null,
    updated_at: data?.[0]?.updated_at || null,
  })
}

// 🔹 Roteamento de compatibilidade
async function handleLegacyRouting(req, res) {
  console.log('🧩 Legacy route fallback usado.')

  if (req.method === 'GET') return await handleGetTeams(req, res)
  if (req.method === 'POST') {
    if (req.body.team_name && req.body.members) return await handleUpdateTeam(req, res)
    if (req.body.header_text) return await handleSaveHeader(req, res)
    if (req.body.team_name && req.body.nome) return await handleInsertMember(req, res)
  }
  if (req.method === 'DELETE') {
    if (req.body.team_name) return await handleDeleteTeam(req, res)
    return await handleClearAll(req, res)
  }

  return res.status(405).json({ error: 'Método ou parâmetros inválidos' })
}
