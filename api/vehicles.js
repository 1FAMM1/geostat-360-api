import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rjkbodfqsvckvnhjwmhg.supabase.co',
  ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
'
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_status')
      .select('vehicle')
      .order('vehicle', { ascending: true })

    if (error) throw error

    const vehicles = data.map(v => v.vehicle)

    return res.status(200).json({ success: true, vehicles })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
