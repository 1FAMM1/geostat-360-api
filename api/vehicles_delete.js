import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // CORRIGIDO: Ler do query parameter em vez do body
    const { vehicle } = req.query;
    
    // Validar se o veículo foi fornecido
    if (!vehicle) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle name is required in query parameter'
      });
    }

    console.log(`Tentando deletar veículo: ${vehicle}`);

    // Verificar se o veículo existe antes de deletar
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicle_status')
      .select('vehicle')
      .eq('vehicle', vehicle)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: `Vehicle '${vehicle}' not found`
      });
    }

    if (checkError) throw checkError;

    // Deletar o veículo específico
    const { data: deleteData, error: deleteError } = await supabase
      .from('vehicle_status')
      .delete()
      .eq('vehicle', vehicle);

    if (deleteError) throw deleteError;

    console.log(`Veículo ${vehicle} deletado com sucesso`);

    return res.status(200).json({
      success: true,
      message: `Vehicle '${vehicle}' deleted successfully`,
      deletedVehicle: vehicle
    });

  } catch (error) {
    console.error('Delete Vehicle Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
