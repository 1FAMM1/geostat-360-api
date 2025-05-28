import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'SEU_SUPABASE_KEY_AQUI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // GET: lista todos os veículos
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('vehicle_status')
      .select('*')
      .order('vehicle', { ascending: true })

    if (error) return res.status(500).json({ success: false, error: error.message })

    return res.status(200).json({ success: true, vehicles: data })
  }

  // POST: adiciona um veículo com status
  if (req.method === 'POST') {
    const { vehicle, status } = req.body

    if (!vehicle || !status) {
      return res.status(400).json({ success: false, error: 'Veículo e status são obrigatórios.' })
    }

    // Inserir no supabase (pode usar upsert para atualizar se já existir)
    const { data, error } = await supabase
      .from('vehicle_status')
      .upsert({ vehicle, status })

    if (error) return res.status(500).json({ success: false, error: error.message })

    return res.status(200).json({ success: true, message: 'Veículo adicionado/atualizado.' })
  }

  // DELETE: remove veículo pelo parâmetro vehicle na query string
  if (req.method === 'DELETE') {
    const { vehicle } = req.query

    if (!vehicle) {
      return res.status(400).json({ success: false, error: 'Parâmetro "vehicle" ausente.' })
    }

    const { error } = await supabase
      .from('vehicle_status')
      .delete()
      .eq('vehicle', vehicle)

    if (error) return res.status(500).json({ success: false, error: error.message })

    return res.status(200).json({ success: true, message: `Veículo ${vehicle} removido.` })
  }

  // Outros métodos não permitidos
  return res.status(405).json({ success: false, error: 'Método não permitido' })
}
