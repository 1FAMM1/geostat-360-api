import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3NuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed. Use GET.'
        })
    }

    const { type } = req.query

    try {
        switch (type) {
            case 'epe': {
                const { data, error } = await supabase
                    .from('epe_status')
                    .select('*')
                    .order('id', { ascending: false })

                if (error) {
                    console.error('Erro Supabase ao buscar dados do EPE:', error)
                    return res.status(500).json({ success: false, error: error.message })
                }

                return res.status(200).json({
                    success: true,
                    count: data?.length || 0,
                    epeData: data || []
                })
            }

            case 'occurrences': {
                const { data, error } = await supabase
                    .from('occurrences_control')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Erro Supabase ao buscar ocorrências:', error)
                    return res.status(500).json({ success: false, error: error.message })
                }

                return res.status(200).json({
                    success: true,
                    count: data?.length || 0,
                    ocorrencias: data || []
                })
            }

            case 'all': {
                const [epeResult, occurrencesResult] = await Promise.all([
                    supabase.from('epe_status').select('*').order('id', { ascending: false }),
                    supabase.from('occurrences_control').select('*').order('created_at', { ascending: false })
                ])

                if (epeResult.error) {
                    console.error('Erro Supabase ao buscar dados do EPE:', epeResult.error)
                    return res.status(500).json({ success: false, error: epeResult.error.message })
                }

                if (occurrencesResult.error) {
                    console.error('Erro Supabase ao buscar ocorrências:', occurrencesResult.error)
                    return res.status(500).json({ success: false, error: occurrencesResult.error.message })
                }

                return res.status(200).json({
                    success: true,
                    epeData: {
                        count: epeResult.data?.length || 0,
                        data: epeResult.data || []
                    },
                    ocorrencias: {
                        count: occurrencesResult.data?.length || 0,
                        data: occurrencesResult.data || []
                    }
                })
            }

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetro "type" obrigatório. Use: ?type=epe, ?type=occurrences ou ?type=all'
                })
        }

    } catch (error) {
        console.error('Erro geral:', error)
        return res.status(500).json({ success: false, error: 'Erro interno: ' + error.message })
    }
}
