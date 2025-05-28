import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vehicle, status, inop } = req.body;

    if (!vehicle) {
      return res.status(400).json({ error: 'Nome do veículo é obrigatório' });
    }

    // Validar formato do veículo (opcional)
    const vehiclePattern = /^[A-Z]{4}-\d{2}$/;
    if (!vehiclePattern.test(vehicle)) {
      return res.status(400).json({ 
        error: 'Formato inválido. Use: XXXX-XX (ex: VFCI-01)' 
      });
    }

    console.log('Adicionando veículo:', vehicle);

    // Verificar se já existe
    const { data: existing, error: checkError } = await supabase
      .from('vehicle_status')
      .select('vehicle')
      .eq('vehicle', vehicle)
      .single();

    if (existing) {
      return res.status(409).json({ 
        error: `Veículo '${vehicle}' já existe` 
      });
    }

    // Inserir novo veículo (SEM created_at)
    const { data, error } = await supabase
      .from('vehicle_status')
      .insert({ 
        vehicle: vehicle.toUpperCase(),
        status: status || 'Disponível no Quartel',
        is_inop: inop || false
      })
      .select();

    if (error) throw error;

    console.log('Veículo adicionado com sucesso');

    res.status(201).json({
      success: true,
      message: `Veículo '${vehicle}' adicionado com sucesso`,
      data: data[0]
    });

  } catch (error) {
    console.error('Add Vehicle Error:', error);
    res.status(500).json({ error: error.message });
  }
}
