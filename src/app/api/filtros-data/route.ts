import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 Buscando dados para filtros...')

    // Buscar dados de todas as tabelas necessárias
    const [safrasRes, talhoesRes, tratoresRes, funcionariosRes] = await Promise.all([
      supabase.from('safras').select('id, safra').order('safra'),
      supabase.from('talhoes').select('id, nome').order('nome'),
      supabase.from('tratores').select('id, nome').order('nome'),
      supabase.from('funcionarios').select('id, nome').order('nome')
    ])

    if (safrasRes.error) {
      console.error('❌ Erro ao buscar safras:', safrasRes.error)
      return NextResponse.json({ error: 'Erro ao buscar safras' }, { status: 500 })
    }

    if (talhoesRes.error) {
      console.error('❌ Erro ao buscar talhões:', talhoesRes.error)
      return NextResponse.json({ error: 'Erro ao buscar talhões' }, { status: 500 })
    }

    if (tratoresRes.error) {
      console.error('❌ Erro ao buscar tratores:', tratoresRes.error)
      return NextResponse.json({ error: 'Erro ao buscar tratores' }, { status: 500 })
    }

    if (funcionariosRes.error) {
      console.error('❌ Erro ao buscar funcionários:', funcionariosRes.error)
      return NextResponse.json({ error: 'Erro ao buscar funcionários' }, { status: 500 })
    }

    const resultado = {
      safras: safrasRes.data || [],
      talhoes: talhoesRes.data || [],
      tratores: tratoresRes.data || [],
      funcionarios: funcionariosRes.data || []
    }

    console.log('✅ Dados dos filtros carregados:', {
      safras: resultado.safras.length,
      talhoes: resultado.talhoes.length,
      tratores: resultado.tratores.length,
      funcionarios: resultado.funcionarios.length
    })

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro ao buscar dados dos filtros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
