// Base de dados simples em memória
let vehicleStatuses = {
  'VFCI-01': 'Disponível no Quartel',
  'VFCI-02': 'Disponível no Quartel',
  'VTTU-01': 'Disponível no Quartel',
  'VTTF-02': 'Disponível no Quartel',
  'ABSC-02': 'Disponível no Quartel',
  'ABSC-03': 'Disponível no Quartel'
};

// NOVO: Estados INOP separados
let vehicleINOP = {
  'VFCI-01': false,
  'VFCI-02': false,
  'VTTU-01': false,
  'VTTF-02': false,
  'ABSC-02': false,
  'ABSC-03': false
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ 
      success: true,
      vehicleStatuses: vehicleStatuses,
      vehicleINOP: vehicleINOP,  // ← NOVO!
      timestamp: Date.now()
    });
  } 
  else if (req.method === 'POST') {
    const { vehicle, status, inop } = req.body;
    
    // Atualizar status normal
    if (vehicle && status && vehicleStatuses.hasOwnProperty(vehicle)) {
      vehicleStatuses[vehicle] = status;
    }
    
    // NOVO: Atualizar INOP
    if (vehicle && typeof inop === 'boolean' && vehicleINOP.hasOwnProperty(vehicle)) {
      vehicleINOP[vehicle] = inop;
    }
    
    res.status(200).json({ 
      success: true, 
      message: `${vehicle} atualizado`,
      vehicleStatuses: vehicleStatuses,
      vehicleINOP: vehicleINOP
    });
  }
  // NOVO: Endpoint só para INOP (para a central VB)
  else if (req.method === 'PUT') {
    const { vehicle, inop } = req.body;
    
    if (vehicle && typeof inop === 'boolean' && vehicleINOP.hasOwnProperty(vehicle)) {
      vehicleINOP[vehicle] = inop;
      
      res.status(200).json({ 
        success: true, 
        message: `${vehicle} INOP: ${inop}`,
        vehicleINOP: vehicleINOP
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos para INOP' 
      });
    }
  }
  else {
    res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }
}
