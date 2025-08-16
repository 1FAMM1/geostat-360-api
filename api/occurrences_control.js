import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3Zja3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
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

    try {
        const { data: ocorrencias, error: errorOcorrencias } = await supabase
            .from('occurrences_control')
            .select('*')
            .order('created_at', { ascending: false })

        if (errorOcorrencias) {
            console.error('Erro Supabase ao buscar ocorrências:', errorOcorrencias)
            return res.status(500).json({ 
                success: false,
                error: 'Erro ao buscar ocorrências: ' + errorOcorrencias.message
            })
        }

        const { data: epeData, error: errorEpe } = await supabase
            .from('epe_status')
            .select('*')
            .order('id', { ascending: false })

        if (errorEpe) {
            console.error('Erro Supabase ao buscar dados do EPE:', errorEpe)
            return res.status(500).json({ 
                success: false,
                error: 'Erro ao buscar dados do EPE: ' + errorEpe.message
            })
        }

        return res.status(200).json({
            success: true,
            ocorrenciasCount: ocorrencias.length,
            epeCount: epeData.length,
            ocorrencias,
            epeData
        })

    } catch (error) {
        console.error('Erro geral:', error)
        return res.status(500).json({ 
            success: false,
            error: 'Erro interno: ' + error.message
        })
    }
}
