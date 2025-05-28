import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // BUSCAR todos os status
      const { data: vehicles, error } = await supabase
        .from('vehicle_status')
        .select('*')

      if (error) throw error

      // Converter para formato esperado pela app
      const vehicleStatuses = {}
      const vehicleINOP = {}
      
      vehicles.forEach(vehicle => {
        if (vehicle.current_status && vehicle.current_status !== 'Disponível') {
          vehicleStatuses[vehicle.vehicle] = vehicle.current_status
        }
        vehicleINOP[vehicle.vehicle] = vehicle.is_inop
      })

      return res.json({
        success: true,
        vehicleStatuses,
        vehicleINOP,
        timestamp: Date.now()
      })
    }

    if (req.method === 'POST') {
      // ENVIAR status operacional (Saída Und., Chegada TO, etc.)
      const { vehicle, status } = req.body

      // Atualizar status atual
      const { error: updateError } = await supabase
        .from('vehicle_status')
        .update({
          current_status: status,
          last_update: new Date().toISOString()
        })
        .eq('vehicle', vehicle)

      if (updateError) throw updateError

      // Adicionar ao histórico
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          vehicle,
          status,
          timestamp: new Date().toISOString()
        })

      if (historyError) throw historyError

      // Se for "Chegada Und." - limpar status (volta a Disponível)
      if (status === 'Chegada Und.') {
        const { error: clearError } = await supabase
          .from('vehicle_status')
          .update({
            current_status: 'Disponível',
            last_update: new Date().toISOString()
          })
          .eq('vehicle', vehicle)
        
        if (clearError) console.log('Clear error:', clearError)
      }

      return res.json({
        success: true,
        message: `${vehicle} - ${status}`
      })
    }

    if (req.method === 'PUT') {
      // ALTERAR status INOP/OP
      const { vehicle, inop } = req.body

      const { error } = await supabase
        .from('vehicle_status')
        .update({
          is_inop: inop,
          last_update: new Date().toISOString()
        })
        .eq('vehicle', vehicle)

      if (error) throw error

      // Adicionar ao histórico
      const status = inop ? 'INOP' : 'Operacional'
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          vehicle,
          status,
          timestamp: new Date().toISOString()
        })

      if (historyError) throw historyError

      return res.json({
        success: true,
        message: `${vehicle} marcado como ${status}`
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
