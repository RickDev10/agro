import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { gastos } = await request.json()
    const supabase = await createClient()

    // Identificar gastos que referenciam historico_plantio ou historico_colheita
    const gastosComRelacao = gastos.filter((gasto: any) => 
      gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita'
    )

    if (gastosComRelacao.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {} 
      })
    }

    // Buscar relações do historico_plantio
    const plantioIds = gastosComRelacao
      .filter((g: any) => g.referencia_tabela === 'historico_plantio')
      .map((g: any) => g.referencia_id)

    const colheitaIds = gastosComRelacao
      .filter((g: any) => g.referencia_tabela === 'historico_colheita')
      .map((g: any) => g.referencia_id)

    const relacoes: {[key: number]: {safra_id?: number, trator_id?: number, talhao_id?: number}} = {}

    // Buscar plantio
    if (plantioIds.length > 0) {
      const { data: plantioData, error: plantioError } = await supabase
        .from('historico_plantio')
        .select('id, safra_id, trator_id, talhao_id')
        .in('id', plantioIds)

      if (!plantioError && plantioData) {
        plantioData.forEach((item: any) => {
          relacoes[item.id] = {
            safra_id: item.safra_id,
            trator_id: item.trator_id,
            talhao_id: item.talhao_id
          }
        })
      }
    }

    // Buscar colheita
    if (colheitaIds.length > 0) {
      const { data: colheitaData, error: colheitaError } = await supabase
        .from('historico_colheita')
        .select('id, safra_id, trator_id, talhao_id')
        .in('id', colheitaIds)

      if (!colheitaError && colheitaData) {
        colheitaData.forEach((item: any) => {
          relacoes[item.id] = {
            safra_id: item.safra_id,
            trator_id: item.trator_id,
            talhao_id: item.talhao_id
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: relacoes 
    })

  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
