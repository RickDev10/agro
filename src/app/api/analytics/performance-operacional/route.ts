import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  // Extrair filtros dos parâmetros da URL
  const safraId = searchParams.get('safraId')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const tratorId = searchParams.get('tratorId')

  try {
    // 1. Buscar todos os tratores
    let tratoresQuery = supabase
      .from('tratores')
      .select('*')
      .order('nome', { ascending: true })

    if (tratorId) {
      tratoresQuery = tratoresQuery.eq('id', tratorId)
    }

    const { data: tratores, error: tratoresError } = await tratoresQuery

    if (tratoresError) {
      throw tratoresError
    }

    // 2. Calcular performance por trator
    const performancePorTrator = await Promise.all(
      tratores?.map(async (trator) => {
        // Buscar plantios e colheitas do trator (com filtros)
        let plantiosQuery = supabase
          .from('historico_plantio')
          .select('*')
          .eq('trator_id', trator.id)

        let colheitasQuery = supabase
          .from('historico_colheita')
          .select('*')
          .eq('trator_id', trator.id)

        // Aplicar filtros de data
        if (dataInicio) {
          plantiosQuery = plantiosQuery.gte('data_execucao', dataInicio)
          colheitasQuery = colheitasQuery.gte('data_execucao', dataInicio)
        }
        if (dataFim) {
          plantiosQuery = plantiosQuery.lte('data_execucao', dataFim)
          colheitasQuery = colheitasQuery.lte('data_execucao', dataFim)
        }

        // Aplicar filtro de safra
        if (safraId) {
          plantiosQuery = plantiosQuery.eq('safra_id', safraId)
          colheitasQuery = colheitasQuery.eq('safra_id', safraId)
        }

        const { data: plantios } = await plantiosQuery
        const { data: colheitas } = await colheitasQuery

        // Calcular métricas do trator
        const horasTrabalhadas = (plantios?.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) || 0) +
                                (colheitas?.reduce((acc, c) => acc + (c.duracao_horas || 0), 0) || 0)

        const combustivelConsumido = (plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0) +
                                    (colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0)

        const operacoes = (plantios?.length || 0) + (colheitas?.length || 0)

        // Calcular eficiência de combustível (L/h)
        const eficienciaCombustivel = horasTrabalhadas > 0 ? combustivelConsumido / horasTrabalhadas : 0

        // Buscar gastos operacionais do trator
        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]

        let gastosOperacionais = []
        if (idsOperacoes.length > 0) {
          const { data: gastos } = await supabase
            .from('gastos_gerais')
            .select('*')
            .in('tipo', ['insumo', 'combustivel'])
            .in('referencia_tabela', ['historico_plantio', 'historico_colheita'])
            .in('referencia_id', idsOperacoes)

          gastosOperacionais = gastos || []
        }

        const custoOperacional = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)
        const custoPorHora = horasTrabalhadas > 0 ? custoOperacional / horasTrabalhadas : 0

        // Calcular produtividade (operações por hora)
        const produtividadeOperacoes = horasTrabalhadas > 0 ? operacoes / horasTrabalhadas : 0

        return {
          trator_id: trator.id,
          trator_nome: trator.nome,
          horas_trabalhadas: horasTrabalhadas,
          combustivel_consumido: combustivelConsumido,
          operacoes: operacoes,
          eficiencia_combustivel: Math.round(eficienciaCombustivel * 100) / 100,
          custo_por_hora: Math.round(custoPorHora * 100) / 100,
          produtividade_operacoes: Math.round(produtividadeOperacoes * 100) / 100
        }
      }) || []
    )

    // 3. Calcular resumo geral
    const totalHoras = performancePorTrator.reduce((acc, t) => acc + t.horas_trabalhadas, 0)
    const totalCombustivel = performancePorTrator.reduce((acc, t) => acc + t.combustivel_consumido, 0)
    const totalOperacoes = performancePorTrator.reduce((acc, t) => acc + t.operacoes, 0)
    const eficienciaMedia = performancePorTrator.length > 0 
      ? performancePorTrator.reduce((acc, t) => acc + t.eficiencia_combustivel, 0) / performancePorTrator.length 
      : 0
    const custoMedioPorHora = performancePorTrator.length > 0
      ? performancePorTrator.reduce((acc, t) => acc + t.custo_por_hora, 0) / performancePorTrator.length
      : 0

    const resumoGeral = {
      total_horas: totalHoras,
      total_combustivel: totalCombustivel,
      total_operacoes: totalOperacoes,
      eficiencia_media: Math.round(eficienciaMedia * 100) / 100,
      custo_medio_por_hora: Math.round(custoMedioPorHora * 100) / 100
    }

    return NextResponse.json({
      success: true,
      data: {
        por_trator: performancePorTrator,
        resumo_geral: resumoGeral
      }
    })
  } catch (error) {
    console.error('Erro ao calcular performance operacional:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao calcular performance operacional' },
      { status: 500 }
    )
  }
}
