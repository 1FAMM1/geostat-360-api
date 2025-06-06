import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed. Use POST.' 
        });
    }
    
    try {
        const { vehicle, status } = req.body;
        
        // Validações
        if (!vehicle || !status) {
            return res.status(400).json({ 
                success: false, 
                error: 'Veículo e status são obrigatórios' 
            });
        }
        
        if (!/^[A-Z]{4}-\d{2}$/.test(vehicle)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Formato inválido. Use: XXXX-XX (ex: VFCI-01)' 
            });
        }
        
        // Verificar se veículo já existe na tabela correta
        const { data: existingVehicle, error: checkError } = await supabase
            .from('vehicle_status')  // ← Nome correto da tabela
            .select('vehicle')
            .eq('vehicle', vehicle)
            .single();
            
        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = "not found" é OK, outros erros não
            console.error('Erro ao verificar veículo:', checkError);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro ao verificar veículo existente: ' + checkError.message 
            });
        }
            
        if (existingVehicle) {
            return res.status(409).json({ 
                success: false, 
                error: `Veículo ${vehicle} já existe no sistema` 
            });
        }
        
        // Inserir novo veículo com nomes corretos dos campos
        const { data, error } = await supabase
            .from('vehicle_status')  // ← Nome correto da tabela
            .insert([
                { 
                    vehicle: vehicle,
                    current_status: status,  // ← Nome correto do campo
                    is_inop: false
                }
            ])
            .select();
        
        if (error) {
            console.error('Erro Supabase ao inserir:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro ao salvar: ' + error.message 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            message: `Veículo ${vehicle} adicionado com sucesso!`,
            vehicle: vehicle,
            status: status,
            data: data
        });
        
    } catch (error) {
        console.error('Erro geral:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno: ' + error.message 
        });
    }
}
