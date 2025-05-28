import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjkbodfqsvckvnhjwmhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      // Pega todos os veículos e seus status
      const { data, error } = await supabase
        .from('vehicle_status')
        .select('vehicle, status')
        .order('vehicle', { ascending: true })

      if (error) throw error

      // Retorna objeto com veículo: status
      const vehicleStatuses = {}
      data.forEach(({ vehicle, status }) => {
        vehicleStatuses[vehicle] = status
      })

      return res.status(200).json({
        success: true,
        vehicleStatuses,
        timestamp: Date.now(),
      })

    } else if (req.method === 'POST') {
      const { vehicle, status } = req.body
      if (!vehicle || !status) {
        return res.status(400).json({
          success: false,
          error: 'Veículo e status são obrigatórios.'
        })
      }

      // Inserir ou atualizar (upsert) o veículo com status
      const { error } = await supabase
        .from('vehicle_status')
        .upsert([{ vehicle, status }], { onConflict: 'vehicle' })

      if (error) throw error

      return res.status(200).json({ success: true })

    } else if (req.method === 'DELETE') {
      const { vehicle } = req.query
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "vehicle" é obrigatório.'
        })
      }

      const { error } = await supabase
        .from('vehicle_status')
        .delete()
        .eq('vehicle', vehicle)

      if (error) throw error

      return res.status(200).json({ success: true })
    } else {
      return res.status(405).json({ success: false, error: 'Método não permitido' })
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
