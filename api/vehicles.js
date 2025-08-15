import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // === VEHICLE.JS REPLICA ===
    // GET /vehicles?action=list
    if (req.method === 'GET' && req.query.action === 'list') {
      const { data, error } = await supabase
        .from('vehicle_status')
        .select('vehicle')
        .order('vehicle', { ascending: true })
      
      if (error) throw error
      
      const vehicles = data.map(v => v.vehicle)
      return res.status(200).json({ success: true, vehicles })
    }

    // === VEHICLE_STATUS.JS REPLICA ===
    if (req.method === 'GET' && !req.query.action) {
      const { data: vehicles, error } = await supabase
        .from('vehicle_status')
        .select('*')
      
      if (error) throw error
      
      const vehicleStatuses = {}
      const vehicleINOP = {}
      const allVehicles = []
      
      vehicles.forEach(vehicle => {
        allVehicles.push(vehicle.vehicle)
        vehicleStatuses[vehicle.vehicle] = vehicle.current_status || 'Disponível'
        vehicleINOP[vehicle.vehicle] = vehicle.is_inop
      })
      
      return res.json({
        success: true,
        vehicles: allVehicles,
        vehicleStatuses,
        vehicleINOP,
        timestamp: Date.now()
      })
    }

    // === VEHICLES_ADD.JS REPLICA ===
    // POST /vehicles com action=add OU se tem vehicle+status mas não tem action
    if (req.method === 'POST' && (req.body.action === 'add' || (!req.body.action && req.body.vehicle && req.body.status && !req.body.inop))) {
      const { vehicle, status } = req.body
      
      // Validações
      if (!vehicle || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Veículo e status são obrigatórios' 
        })
      }
      
      if (!/^[A-Z]{4}-\d{2}$/.test(vehicle)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato inválido. Use: XXXX-XX (ex: VFCI-01)' 
        })
      }
      
      // Verificar se veículo já existe
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicle_status')
        .select('vehicle')
        .eq('vehicle', vehicle)
        .single()
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar veículo:', checkError)
        return res.status(500).json({ 
          success: false, 
          error: 'Erro ao verificar veículo existente: ' + checkError.message 
        })
      }
        
      if (existingVehicle) {
        return res.status(409).json({ 
          success: false, 
          error: `Veículo ${vehicle} já existe no sistema` 
        })
      }
      
      // Inserir novo veículo
      const { data, error } = await supabase
        .from('vehicle_status')
        .insert([
          { 
            vehicle: vehicle,
            current_status: status,
            is_inop: false
          }
        ])
        .select()
      
      if (error) {
        console.error('Erro Supabase ao inserir:', error)
        return res.status(500).json({ 
          success: false, 
          error: 'Erro ao salvar: ' + error.message 
        })
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Veículo ${vehicle} adicionado com sucesso!`,
        vehicle: vehicle,
        status: status,
        data: data
      })
    }

    // === VEHICLE_STATUS.JS REPLICA - UPDATE STATUS ===
    // POST /vehicles sem action (atualizar status)
    if (req.method === 'POST' && !req.body.action) {
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

    // === VEHICLE_STATUS.JS REPLICA - PUT ===
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

    // === VEHICLES_DELETE.JS REPLICA ===
    if (req.method === 'DELETE') {
      const { vehicle } = req.query
      
      if (!vehicle) {
        return res.status(400).json({
          success: false,
          error: 'Vehicle name is required in query parameter'
        })
      }
      
      console.log(`Tentando deletar veículo: ${vehicle}`)
      
      // Verificar se o veículo existe antes de deletar
      const { data: existingVehicle, error: checkError } = await supabase
        .from('vehicle_status')
        .select('vehicle')
        .eq('vehicle', vehicle)
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `Vehicle '${vehicle}' not found`
        })
      }
      
      if (checkError) throw checkError
      
      // Deletar o veículo específico
      const { data: deleteData, error: deleteError } = await supabase
        .from('vehicle_status')
        .delete()
        .eq('vehicle', vehicle)
      
      if (deleteError) throw deleteError
      
      console.log(`Veículo ${vehicle} deletado com sucesso`)
      
      return res.status(200).json({
        success: true,
        message: `Vehicle '${vehicle}' deleted successfully`,
        deletedVehicle: vehicle
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
