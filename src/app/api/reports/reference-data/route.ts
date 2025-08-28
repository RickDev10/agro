import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    // Buscar todos os dados de referência em paralelo
    const [
      { data: safras, error: safrasError },
      { data: tiposProducao, error: tiposError },
      { data: funcionarios, error: funcionariosError },
      { data: talhoes, error: talhoesError },
      { data: tratores, error: tratoresError }
    ] = await Promise.all([
      supabase.from('safras').select('id, safra').order('safra'),
      supabase.from('tipos_producao').select('id, nome_producao').order('nome_producao'),
      supabase.from('funcionarios').select('id, nome').order('nome'),
      supabase.from('talhoes').select('id, nome').order('nome'),
      supabase.from('tratores').select('id, nome').order('nome')
    ])

    // Verificar erros
    if (safrasError || tiposError || funcionariosError || talhoesError || tratoresError) {
      console.error('Erro ao buscar dados de referência:', {
        safrasError,
        tiposError,
        funcionariosError,
        talhoesError,
        tratoresError
      })
      throw new Error('Erro ao buscar dados de referência')
    }

    return NextResponse.json({
      success: true,
      data: {
        safras: safras || [],
        tiposProducao: tiposProducao || [],
        funcionarios: funcionarios || [],
        talhoes: talhoes || [],
        tratores: tratores || []
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
