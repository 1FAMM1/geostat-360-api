import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjkbodfqsvckvnhjwmhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(res)
      case 'POST':
        return await handlePost(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

async function handleGet(res) {
  const { data, error } = await supabase
    .from('vehicle_status')
    .select('*')
    .order('vehicle', { ascending: true })

  if (error) throw error

  const vehicleStatuses = {}
  const vehicleINOP = {}
  
  data.forEach(item => {
    vehicleStatuses[item.vehicle] = item.status
    vehicleINOP[item.vehicle] = item.inop
  })

  return res.status(200).json({
    success: true,
    vehicleStatuses,
    vehicleINOP,
    timestamp: Date.now()
  })
}

async function handlePost(req, res) {
  const { vehicle, status, inop } = req.body

  if (!vehicle || !status) {
    return res.status(400).json({ error: 'Vehicle and status are required' })
  }

  const { error } = await supabase
    .from('vehicle_status')
    .upsert({ 
      vehicle, 
      status, 
      inop: inop || false,
      updated_at: new Date().toISOString()
    })

  if (error) throw error

  return res.status(200).json({
    success: true,
    message: `${vehicle} - ${status}`
  })
}

async function handleDelete(req, res) {
  const { vehicle } = req.body

  if (!vehicle) {
    return res.status(400).json({ error: 'Vehicle is required' })
  }

  const { error } = await supabase
    .from('vehicle_status')
    .delete()
    .eq('vehicle', vehicle)

  if (error) throw error

  return res.status(200).json({
    success: true,
    message: `Vehicle ${vehicle} deleted successfully`
  })
}
