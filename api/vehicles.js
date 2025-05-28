import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjkbodfqsvckvnhjwmhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
)

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    })
  }
}

// GET - Listar veículos
async function handleGet(req, res) {
  const { data, error } = await supabase
    .from('vehicle_status')
    .select('vehicle')
    .order('vehicle', { ascending: true })

  if (error) throw error

  const vehicles = data.map(v => v.vehicle)
  
  return res.status(200).json({ 
    success: true, 
    vehicles 
  })
}

// POST - Adicionar veículo
async function handlePost(req, res) {
  const { vehicle, status = 'ativo' } = req.body

  // Validação
  if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome do veículo é obrigatório' 
    })
  }

  const vehicleName = vehicle.trim()

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('vehicle_status')
    .select('vehicle')
    .eq('vehicle', vehicleName)
    .single()

  if (existing) {
    return res.status(409).json({ 
      success: false, 
      error: 'Veículo já existe' 
    })
  }

  // Inserir novo veículo
  const { data, error } = await supabase
    .from('vehicle_status')
    .insert([{ 
      vehicle: vehicleName, 
      status: status 
    }])
    .select()

  if (error) throw error

  return res.status(201).json({ 
    success: true, 
    message: 'Veículo adicionado com sucesso',
    vehicle: data[0]
  })
}

// DELETE - Remover veículo
async function handleDelete(req, res) {
  const { vehicle } = req.body

  // Validação
  if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome do veículo é obrigatório' 
    })
  }

  const vehicleName = vehicle.trim()

  // Verificar se existe
  const { data: existing } = await supabase
    .from('vehicle_status')
    .select('vehicle')
    .eq('vehicle', vehicleName)
    .single()

  if (!existing) {
    return res.status(404).json({ 
      success: false, 
      error: 'Veículo não encontrado' 
    })
  }

  // Remover veículo
  const { error } = await supabase
    .from('vehicle_status')
    .delete()
    .eq('vehicle', vehicleName)

  if (error) throw error

  return res.status(200).json({ 
    success: true, 
    message: 'Veículo removido com sucesso' 
  })
}
