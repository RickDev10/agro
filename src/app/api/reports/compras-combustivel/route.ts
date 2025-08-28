import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const filters = {
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      valorMinimo: searchParams.get('valorMinimo'),
      valorMaximo: searchParams.get('valorMaximo')
    }

    let query = supabase
      .from('compras_combustivel')
      .select('*')

    // Aplicar filtros dinamicamente
    if (filters.dataInicio) {
      query = query.gte('data_compra', filters.dataInicio)
    }
    if (filters.dataFim) {
      query = query.lte('data_compra', filters.dataFim)
    }
    if (filters.valorMinimo) {
      query = query.gte('valor_total', filters.valorMinimo)
    }
    if (filters.valorMaximo) {
      query = query.lte('valor_total', filters.valorMaximo)
    }

    const { data, error, count } = await query
      .order('data_compra', { ascending: false })

    if (error) {
      console.error('Erro Supabase:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    })

  } catch (error) {
    console.error('Erro ao buscar dados de compras de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
