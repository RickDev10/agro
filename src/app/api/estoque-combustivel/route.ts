import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Buscar estoque de combustível
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('estoque_combustivel')
      .select('*')
      .order('atualizado_em', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao buscar estoque de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estoque de combustível' },
      { status: 500 }
    )
  }
}

// POST - Criar novo estoque de combustível
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, medida } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('estoque_combustivel')
      .insert({
        nome: nome || 'Diesel S10',
        medida: medida || 'L'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao criar estoque de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar estoque de combustível' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar estoque de combustível
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nome, medida } = body

    const supabase = createClient()

    const { data, error } = await supabase
      .from('estoque_combustivel')
      .update({
        nome,
        medida
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erro ao atualizar estoque de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar estoque de combustível' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir estoque de combustível
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
      .from('estoque_combustivel')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir estoque de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir estoque de combustível' },
      { status: 500 }
    )
  }
}
