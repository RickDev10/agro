import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('historico_colheita')
      .select(`
        *,
        talhao:talhoes(nome),
        funcionario:funcionarios(nome),
        trator:tratores(nome),
        tipo_producao:tipos_producao(nome_producao)
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar histórico de colheita:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar histórico de colheita' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('historico_colheita')
      .insert([body])
      .select()

    if (error) {
      console.error('Erro ao criar registro de colheita:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar registro de colheita' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0] 
    }, { status: 201 })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('historico_colheita')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erro ao atualizar registro de colheita:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar registro de colheita' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0] 
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    const supabase = await createClient()

    const { error } = await supabase
      .from('historico_colheita')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar registro de colheita:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao deletar registro de colheita' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registro deletado com sucesso' 
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}


