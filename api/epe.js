import { createClient } from '@supabase/supabase-js'

// Substitua pelos seus dados do Supabase
const supabaseUrl = 'https://rjkbodfqsvckvnhjwmhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2JvZGZxc3ZuaGp3bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjM3NjQsImV4cCI6MjA2MzczOTc2NH0.jX5OPZkz1JSSwrahCoFzqGYw8tYkgE8isbn12uP43-0'
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

    try {
        // Buscar todas as ocorrências da tabela do EPE
        const { data, error } = await supabase
            .from('epe')  // Substitua pelo nome real da tabela
            .select('*')
            .order('created_at', { ascending: false }) // opcional: ordenar por data

        if (error) {
            console.error('Erro Supabase ao buscar dados do EPE:', error)
            return res.status(500).json({ 
                success: false,
                error: 'Erro ao buscar dados do EPE: ' + error.message
            })
        }

        return res.status(200).json({
            success: true,
            count: data.length,
            epeData: data
        })

    } catch (error) {
        console.error('Erro geral:', error)
        return res.status(500).json({ 
            success: false,
            error: 'Erro interno: ' + error.message
        })
    }
}
