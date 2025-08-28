import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Buscar todos os lotes de combustível
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('lotes_combustivel')
      .select('*')
      .order('data_compra', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar lotes de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lotes de combustível' },
      { status: 500 }
    )
  }
}

// POST - Criar novo lote de combustível
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quantidade, preco_unitario, data_compra } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('lotes_combustivel')
      .insert({
        quantidade: parseFloat(quantidade),
        preco_unitario: parseFloat(preco_unitario),
        data_compra: data_compra || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar lote de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar lote de combustível' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar lote de combustível
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantidade, preco_unitario, data_compra } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('lotes_combustivel')
      .update({
        quantidade: parseFloat(quantidade),
        preco_unitario: parseFloat(preco_unitario),
        data_compra
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar lote de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar lote de combustível' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir lote de combustível
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
      .from('lotes_combustivel')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir lote de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir lote de combustível' },
      { status: 500 }
    )
  }
}
