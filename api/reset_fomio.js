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
    // Usar a função que criámos no SQL
    const { data, error } = await supabase.rpc('reset_fomio_sequence');
    
    if (error) {
      console.error('Reset error:', error);
      throw error;
    }
    
    console.log('Sequence reset executado com sucesso');
    
    res.status(200).json({ 
      success: true, 
      message: 'Sequence reset com sucesso' 
    });

  } catch (error) {
    console.error('Reset Error:', error);
    res.status(500).json({ error: error.message });
  }
}
