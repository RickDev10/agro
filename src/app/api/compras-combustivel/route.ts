import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Buscar todas as compras de combustível
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('compras_combustivel')
      .select('*')
      .order('data_compra', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar compras de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar compras de combustível' },
      { status: 500 }
    )
  }
}

// POST - Criar nova compra de combustível
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quantidade, preco_unitario, data_compra, observacao } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('compras_combustivel')
      .insert({
        quantidade: parseFloat(quantidade),
        preco_unitario: parseFloat(preco_unitario),
        data_compra: data_compra || new Date().toISOString().split('T')[0],
        observacao
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar compra de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar compra de combustível' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar compra de combustível
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantidade, preco_unitario, data_compra, observacao } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('compras_combustivel')
      .update({
        quantidade: parseFloat(quantidade),
        preco_unitario: parseFloat(preco_unitario),
        data_compra,
        observacao
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar compra de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar compra de combustível' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir compra de combustível
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
      .from('compras_combustivel')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir compra de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir compra de combustível' },
      { status: 500 }
    )
  }
}
