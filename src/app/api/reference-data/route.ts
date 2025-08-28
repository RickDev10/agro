import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    // Buscar todos os dados de referência em paralelo
    const [tiposProducao, safras, funcionarios, talhoes, tratores, insumos] = await Promise.all([
      supabase.from('tipos_producao').select('*').order('nome_producao'),
      supabase.from('safras').select('*').order('safra'),
      supabase.from('funcionarios').select('*').order('nome'),
      supabase.from('talhoes').select('*').order('nome'),
      supabase.from('tratores').select('*').order('nome'),
      supabase.from('insumos').select('*').order('insumo')
    ])

    // Verificar erros
    const errors = [tiposProducao.error, safras.error, funcionarios.error, talhoes.error, tratores.error, insumos.error]
    const hasError = errors.some(error => error !== null)
    
    if (hasError) {
      console.error('Erros ao buscar dados de referência:', errors)
      throw new Error('Erro ao buscar dados de referência')
    }

    return NextResponse.json({
      success: true,
      data: {
        tiposProducao: tiposProducao.data || [],
        safras: safras.data || [],
        funcionarios: funcionarios.data || [],
        talhoes: talhoes.data || [],
        tratores: tratores.data || [],
        insumos: insumos.data || []
      }
    })

  } catch (error) {
    console.error('Erro ao buscar dados de referência:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
