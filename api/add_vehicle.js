// Simulação de banco de dados em memória (em produção use um banco real)
let vehicles = {};

export default function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            const { vehicle, status } = req.body;
            
            // Validações
            if (!vehicle) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nome do veículo é obrigatório' 
                });
            }
            
            if (!status) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Status é obrigatório' 
                });
            }
            
            // Verificar formato
            if (!/^[A-Z]{4}-\d{2}$/.test(vehicle)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Formato inválido. Use: XXXX-XX (ex: VFCI-01)' 
                });
            }
            
            // Simular adição (aqui você salvaria no banco)
            vehicles[vehicle] = status;
            
            return res.status(200).json({ 
                success: true, 
                message: `Veículo ${vehicle} adicionado com status: ${status}`,
                vehicle: vehicle,
                status: status
            });
            
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor: ' + error.message 
            });
        }
    }
    
    // Método não permitido
    return res.status(405).json({ 
        success: false, 
        error: 'Método não permitido. Use POST.' 
    });
}
