import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Buscar todos os gastos gerais
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const safraId = url.searchParams.get('safraId')
    
    const supabase = createClient()
    
    let query = supabase
      .from('gastos_gerais')
      .select('*')
      .order('data', { ascending: false })

    // Se safraId foi fornecido, filtrar apenas gastos relacionados
    if (safraId) {
      // Buscar IDs de plantio e colheita da safra
      const { data: plantioIds } = await supabase
        .from('historico_plantio')
        .select('id')
        .eq('safra_id', safraId)

      const { data: colheitaIds } = await supabase
        .from('historico_colheita')
        .select('id')
        .eq('safra_id', safraId)

      // Buscar IDs de movimentações que referenciam esses plantios/colheitas
      const { data: movimentacaoIds } = await supabase
        .from('movimentacoes_insumos')
        .select('id')
        .in('referencia_id', [
          ...(plantioIds?.map(p => p.id) || []),
          ...(colheitaIds?.map(c => c.id) || [])
        ])

      // Combinar todos os IDs relacionados
      const relatedIds = [
        ...(plantioIds?.map(p => p.id) || []),
        ...(colheitaIds?.map(c => c.id) || []),
        ...(movimentacaoIds?.map(m => m.id) || [])
      ]

      if (relatedIds.length > 0) {
        query = query.in('referencia_id', relatedIds)
      } else {
        // Se não há IDs relacionados, retornar dados vazios
        return NextResponse.json({ success: true, data: [] })
      }
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar gastos gerais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar gastos gerais' },
      { status: 500 }
    )
  }
}

// POST - Criar novo gasto geral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tipo, 
      descricao, 
      valor, 
      data, 
      referencia_id, 
      referencia_tabela,
      fixo
    } = body

    const supabase = createClient()

    const { data: gasto, error } = await supabase
      .from('gastos_gerais')
      .insert({
        tipo,
        descricao,
        valor: parseFloat(valor),
        data: data || new Date().toISOString(),
        referencia_id,
        referencia_tabela,
        fixo: fixo || false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: gasto })
  } catch (error) {
    console.error('Erro ao criar gasto geral:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar gasto geral' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar gasto geral
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      tipo, 
      descricao, 
      valor, 
      data, 
      referencia_id, 
      referencia_tabela,
      fixo
    } = body

    const supabase = createClient()

    const { data: gasto, error } = await supabase
      .from('gastos_gerais')
      .update({
        tipo,
        descricao,
        valor: parseFloat(valor),
        data,
        referencia_id,
        referencia_tabela,
        fixo: fixo || false
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: gasto })
  } catch (error) {
    console.error('Erro ao atualizar gasto geral:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar gasto geral' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir gasto geral
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('gastos_gerais')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir gasto geral:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir gasto geral' },
      { status: 500 }
    )
  }
}

// PATCH - Limpar gastos incorretos (valores muito altos)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()

    // Deletar gastos com valor maior que 1 milhão (provavelmente incorretos)
    const { error } = await supabase
      .from('gastos_gerais')
      .delete()
      .gte('valor', 1000000)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: 'Gastos incorretos removidos' })
  } catch (error) {
    console.error('Erro ao limpar gastos incorretos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao limpar gastos incorretos' },
      { status: 500 }
    )
  }
}
