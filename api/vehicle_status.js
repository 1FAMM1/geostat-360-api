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
      const { data: vehicles, error } = await supabase
        .from('vehicle_status')
        .select('*')

      if (error) throw error

      const vehicleStatuses = {}
      const vehicleINOP = {}
      const allVehicles = [] // ✅ NOVO: Lista completa de veículos

      vehicles.forEach(vehicle => {
        // ✅ CORRIGIDO: Sempre adicionar o veículo à lista completa
        allVehicles.push(vehicle.vehicle)
        
        // ✅ CORRIGIDO: Incluir todos os status, não só os diferentes de 'Disponível'
        vehicleStatuses[vehicle.vehicle] = vehicle.current_status || 'Disponível'
        
        // INOP status
        vehicleINOP[vehicle.vehicle] = vehicle.is_inop
      })

      return res.json({
        success: true,
        vehicles: allVehicles,        // ✅ NOVO: Lista completa para o frontend
        vehicleStatuses,              // ✅ CORRIGIDO: Todos os status
        vehicleINOP,
        timestamp: Date.now()
      })
    }

    if (req.method === 'POST') {
      const { vehicle, status } = req.body
      
      if (!vehicle || !status) {
        return res.status(400).json({ error: 'Veículo e status são obrigatórios.' })
      }

      const { error: updateError } = await supabase
        .from('vehicle_status')
        .update({
          current_status: status
        })
        .eq('vehicle', vehicle)

      if (updateError) throw updateError

      // Se chegou na unidade, volta a Disponível
      if (status === 'Chegada Und.') {
        const { error: clearError } = await supabase
          .from('vehicle_status')
          .update({
            current_status: 'Disponível'
          })
          .eq('vehicle', vehicle)
        
        if (clearError) console.log('Erro ao limpar status:', clearError)
      }

      return res.json({
        success: true,
        message: `${vehicle} - ${status}`
      })
    }

    if (req.method === 'PUT') {
      const { vehicle, inop, current_status } = req.body
      
      if (!vehicle) {
        return res.status(400).json({ error: 'Veículo é obrigatório.' })
      }

      const updates = {}
      
      if (typeof inop === 'boolean') {
        updates.is_inop = inop
      }
      
      if (typeof current_status === 'string') {
        updates.current_status = current_status
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para atualizar.' })
      }

      const { error } = await supabase
        .from('vehicle_status')
        .update(updates)
        .eq('vehicle', vehicle)

      if (error) throw error

      return res.json({
        success: true,
        message: `${vehicle} atualizado.`,
        updates
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
