import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // BUSCAR todos os membros das equipas
      const { data: teams, error } = await supabase
        .from('fomio_teams')
        .select('*')
        .order('team_name', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error

      // Organizar por equipa
      const teamData = {}
      teams.forEach(member => {
        if (!teamData[member.team_name]) {
          teamData[member.team_name] = []
        }
        teamData[member.team_name].push({
          id: member.id,
          patente: member.patente,
          nome: member.nome
        })
      })

      return res.json({
        success: true,
        teams: teamData,
        timestamp: Date.now()
      })
    }

    if (req.method === 'POST') {
      // ADICIONAR/ATUALIZAR membros de uma equipa
      const { team_name, members } = req.body

      if (!team_name || !Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          error: 'team_name e members (array) são obrigatórios'
        })
      }

      // 1. APAGAR todos os membros da equipa
      const { error: deleteError } = await supabase
        .from('fomio_teams')
        .delete()
        .eq('team_name', team_name)

      if (deleteError) throw deleteError

      // 2. INSERIR novos membros (se houver)
      if (members.length > 0) {
        const membersToInsert = members.map(member => ({
          team_name,
          patente: member.patente || '',
          nome: member.nome || ''
        }))

        const { error: insertError } = await supabase
          .from('fomio_teams')
          .insert(membersToInsert)

        if (insertError) throw insertError
      }

      return res.json({
        success: true,
        message: `Equipa ${team_name} atualizada com ${members.length} membros`
      })
    }

    if (req.method === 'DELETE') {
      // LIMPAR uma equipa específica
      const { team_name } = req.body

      if (!team_name) {
        return res.status(400).json({
          success: false,
          error: 'team_name é obrigatório'
        })
      }

      const { error } = await supabase
        .from('fomio_teams')
        .delete()
        .eq('team_name', team_name)

      if (error) throw error

      return res.json({
        success: true,
        message: `Equipa ${team_name} limpa com sucesso`
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('FOMIO API Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
