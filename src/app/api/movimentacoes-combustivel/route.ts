import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Buscar todas as movimentações de combustível
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('movimentacoes_combustivel')
      .select('*')
      .order('data', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar movimentações de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar movimentações de combustível' },
      { status: 500 }
    )
  }
}

// POST - Criar nova movimentação de combustível
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, quantidade, custo_unitario, data, referencia_id, referencia_tabela, observacao } = body

    // Validações básicas
    if (!tipo || !quantidade || !data) {
      return NextResponse.json(
        { success: false, error: 'Tipo, quantidade e data são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo deve ser entrada, saida ou ajuste' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: result, error } = await supabase
      .from('movimentacoes_combustivel')
      .insert({
        tipo,
        quantidade: parseFloat(quantidade),
        custo_unitario: custo_unitario ? parseFloat(custo_unitario) : null,
        data: data || new Date().toISOString().split('T')[0],
        referencia_id: referencia_id ? parseInt(referencia_id) : null,
        referencia_tabela,
        observacao
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Erro ao criar movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar movimentação de combustível' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar movimentação de combustível
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, tipo, quantidade, custo_unitario, data, referencia_id, referencia_tabela, observacao } = body

    const supabase = createClient()

    const { data: result, error } = await supabase
      .from('movimentacoes_combustivel')
      .update({
        tipo,
        quantidade: parseFloat(quantidade),
        custo_unitario: custo_unitario ? parseFloat(custo_unitario) : null,
        data,
        referencia_id: referencia_id ? parseInt(referencia_id) : null,
        referencia_tabela,
        observacao
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Erro ao atualizar movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar movimentação de combustível' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir movimentação de combustível
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('movimentacoes_combustivel')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir movimentação de combustível' },
      { status: 500 }
    )
  }
}
