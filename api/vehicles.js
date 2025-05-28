import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://SEU-SUPABASE-URL.supabase.co';
const supabaseKey = 'SUA-CHAVE-SECRETA';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Buscar veículos
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle', { ascending: true });
      if (error) throw error;

      return res.status(200).json({ success: true, vehicles: data });
    }

    if (req.method === 'POST') {
      // Adicionar veículo
      const { vehicle, status } = req.body;

      if (!vehicle || !status) {
        return res.status(400).json({ success: false, error: 'Veículo e status são obrigatórios.' });
      }

      // Verifica se já existe o veículo
      const { data: existing, error: errCheck } = await supabase
        .from('vehicles')
        .select('vehicle')
        .eq('vehicle', vehicle);

      if (errCheck) throw errCheck;

      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'Veículo já existe.' });
      }

      const { error } = await supabase
        .from('vehicles')
        .insert([{ vehicle, status }]);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Remover veículo
      const { vehicle } = req.query;

      if (!vehicle) {
        return res.status(400).json({ success: false, error: 'Veículo é obrigatório para remoção.' });
      }

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('vehicle', vehicle);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    // Método não permitido
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
