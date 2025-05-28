  return res.status(200).json({ 
    success: true, 
    vehicleStatuses,
    vehicleINOP,
    timestamp: Date.now()
  })
}

// POST - Adicionar veículo
async function handlePost(req, res) {
  const { vehicle, status = 'Disponível no Quartel', inop = false } = req.body

  // Validação
  if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome do veículo é obrigatório' 
    })
  }

  const vehicleName = vehicle.trim().toUpperCase()

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
      status: status,
      inop: inop
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
