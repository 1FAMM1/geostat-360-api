// Base de dados simples em memória
let vehicleStatuses = {
  'VFCI-01': 'Disponível no Quartel',
  'VFCI-02': 'Disponível no Quartel',
  'VTTU-01': 'Disponível no Quartel',
  'VTTF-02': 'Disponível no Quartel',
  'ABSC-02': 'Disponível no Quartel',
  'ABSC-03': 'Disponível no Quartel'
};

export default function handler(req, res) {
  // Permitir acesso de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Retornar todos os status
    res.status(200).json({ 
      success: true,
      vehicleStatuses: vehicleStatuses,
      timestamp: Date.now()
    });
  } 
  else if (req.method === 'POST') {
    // Atualizar status de um veículo
    const { vehicle, status } = req.body;
    
    if (vehicle && status && vehicleStatuses.hasOwnProperty(vehicle)) {
      vehicleStatuses[vehicle] = status;
      
      res.status(200).json({ 
        success: true, 
        message: `${vehicle} atualizado para ${status}`,
        vehicleStatuses: vehicleStatuses 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Veículo ou status inválido' 
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
