import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Análise de produtividade por hectare (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/produtividade-hectare - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Extrair filtros dos parâmetros da URL
    const safraId = searchParams.get('safraId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const tratorId = searchParams.get('tratorId')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // 1. Buscar todos os talhões com área
    const { data: talhoes, error: talhoesError } = await client
      .from('talhoes')
      .select('*')
      .not('area_hectares', 'is', null)

    if (talhoesError) {
      throw talhoesError
    }

    // 2. Buscar todas as safras (com filtro se aplicável)
    let safrasQuery = client
      .from('safras')
      .select('*')
      .order('data_inicio', { ascending: false })

    if (safraId) {
      safrasQuery = safrasQuery.eq('id', safraId)
    }

    const { data: safras, error: safrasError } = await safrasQuery

    if (safrasError) {
      throw safrasError
    }

    // 3. Calcular produtividade por talhão
    const produtividadePorTalhao = await Promise.all(
      talhoes?.map(async (talhao) => {
        // Buscar plantios e colheitas do talhão (com filtros)
        let plantiosQuery = client
          .from('historico_plantio')
          .select('*')
          .eq('talhao_id', talhao.id)

        let colheitasQuery = client
          .from('historico_colheita')
          .select('*')
          .eq('talhao_id', talhao.id)

        // Aplicar filtros de data
        if (dataInicio) {
          plantiosQuery = plantiosQuery.gte('data_execucao', dataInicio)
          colheitasQuery = colheitasQuery.gte('data_execucao', dataInicio)
        }
        if (dataFim) {
          plantiosQuery = plantiosQuery.lte('data_execucao', dataFim)
          colheitasQuery = colheitasQuery.lte('data_execucao', dataFim)
        }

        // Aplicar filtro de trator
        if (tratorId) {
          plantiosQuery = plantiosQuery.eq('trator_id', tratorId)
          colheitasQuery = colheitasQuery.eq('trator_id', tratorId)
        }

        // Aplicar filtro de safra
        if (safraId) {
          plantiosQuery = plantiosQuery.eq('safra_id', safraId)
          colheitasQuery = colheitasQuery.eq('safra_id', safraId)
        }

        const { data: plantios } = await plantiosQuery
        const { data: colheitas } = await colheitasQuery

        // Calcular métricas do talhão
        const horasTrabalhadas = (plantios?.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) || 0) +
                                (colheitas?.reduce((acc, c) => acc + (c.duracao_horas || 0), 0) || 0)

        const combustivelConsumido = (plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0) +
                                    (colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0)

        // Buscar gastos operacionais do talhão
        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]

        let gastosOperacionais = []
        if (idsOperacoes.length > 0) {
          const { data: gastos } = await client
            .from('gastos_gerais')
            .select('*')
            .in('tipo', ['insumo', 'combustivel'])
            .in('referencia_tabela', ['historico_plantio', 'historico_colheita'])
            .in('referencia_id', idsOperacoes)

          gastosOperacionais = gastos || []
        }

        const custoOperacional = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)

        // Calcular métricas por hectare
        const areaHectares = talhao.area_hectares || 1
        const horasPorHectare = areaHectares > 0 ? horasTrabalhadas / areaHectares : 0
        const combustivelPorHectare = areaHectares > 0 ? combustivelConsumido / areaHectares : 0
        const custoPorHectare = areaHectares > 0 ? custoOperacional / areaHectares : 0

        return {
          talhao_id: talhao.id,
          talhao_nome: talhao.nome,
          area_hectares: areaHectares,
          horas_trabalhadas: horasTrabalhadas,
          combustivel_consumido: combustivelConsumido,
          custo_operacional: custoOperacional,
          horas_por_hectare: Math.round(horasPorHectare * 100) / 100,
          combustivel_por_hectare: Math.round(combustivelPorHectare * 100) / 100,
          custo_por_hectare: Math.round(custoPorHectare * 100) / 100,
          operacoes: (plantios?.length || 0) + (colheitas?.length || 0)
        }
      }) || []
    )

    // 4. Calcular produtividade por safra
    const produtividadePorSafra = await Promise.all(
      safras?.map(async (safra) => {
        // Buscar plantios e colheitas da safra (com filtros)
        let plantiosQuery = client
          .from('historico_plantio')
          .select('id, talhao_id, duracao_horas, combustivel')
          .eq('safra_id', safra.id)

        let colheitasQuery = client
          .from('historico_colheita')
          .select('id, talhao_id, duracao_horas, combustivel')
          .eq('safra_id', safra.id)

        // Aplicar filtros de data
        if (dataInicio) {
          plantiosQuery = plantiosQuery.gte('data_execucao', dataInicio)
          colheitasQuery = colheitasQuery.gte('data_execucao', dataInicio)
        }
        if (dataFim) {
          plantiosQuery = plantiosQuery.lte('data_execucao', dataFim)
          colheitasQuery = colheitasQuery.lte('data_execucao', dataFim)
        }

        // Aplicar filtro de trator
        if (tratorId) {
          plantiosQuery = plantiosQuery.eq('trator_id', tratorId)
          colheitasQuery = colheitasQuery.eq('trator_id', tratorId)
        }

        const { data: plantios } = await plantiosQuery
        const { data: colheitas } = await colheitasQuery

        // Calcular área total utilizada na safra
        const talhoesUtilizados = new Set([
          ...(plantios?.map(p => p.talhao_id) || []),
          ...(colheitas?.map(c => c.talhao_id) || [])
        ])

        const { data: talhoesSafra } = await client
          .from('talhoes')
          .select('area_hectares')
          .in('id', Array.from(talhoesUtilizados))

        const areaTotalSafra = talhoesSafra?.reduce((acc, t) => acc + (t.area_hectares || 0), 0) || 0

        // Calcular métricas da safra
        const horasTrabalhadas = (plantios?.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) || 0) +
                                (colheitas?.reduce((acc, c) => acc + (c.duracao_horas || 0), 0) || 0)

        const combustivelConsumido = (plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0) +
                                    (colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0)

        // Buscar gastos operacionais da safra
        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]

        let gastosOperacionais = []
        if (idsOperacoes.length > 0) {
          const { data: gastos } = await client
            .from('gastos_gerais')
            .select('*')
            .in('tipo', ['insumo', 'combustivel'])
            .in('referencia_tabela', ['historico_plantio', 'historico_colheita'])
            .in('referencia_id', idsOperacoes)

          gastosOperacionais = gastos || []
        }

        const custoOperacional = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)

        // Calcular métricas por hectare
        const producaoTotal = safra.total_colhido || 0
        const producaoPorHectare = areaTotalSafra > 0 ? producaoTotal / areaTotalSafra : 0
        const horasPorHectare = areaTotalSafra > 0 ? horasTrabalhadas / areaTotalSafra : 0
        const combustivelPorHectare = areaTotalSafra > 0 ? combustivelConsumido / areaTotalSafra : 0
        const custoPorHectare = areaTotalSafra > 0 ? custoOperacional / areaTotalSafra : 0

        // Calcular rentabilidade por hectare
        const receitaTotal = safra.faturamento_total || 0
        const receitaPorHectare = areaTotalSafra > 0 ? receitaTotal / areaTotalSafra : 0
        const lucroPorHectare = receitaPorHectare - custoPorHectare

        return {
          safra_id: safra.id,
          safra_nome: safra.safra,
          area_total_utilizada: areaTotalSafra,
          producao_total: producaoTotal,
          receita_total: receitaTotal,
          horas_trabalhadas: horasTrabalhadas,
          combustivel_consumido: combustivelConsumido,
          custo_operacional: custoOperacional,
          producao_por_hectare: Math.round(producaoPorHectare * 100) / 100,
          receita_por_hectare: Math.round(receitaPorHectare * 100) / 100,
          horas_por_hectare: Math.round(horasPorHectare * 100) / 100,
          combustivel_por_hectare: Math.round(combustivelPorHectare * 100) / 100,
          custo_por_hectare: Math.round(custoPorHectare * 100) / 100,
          lucro_por_hectare: Math.round(lucroPorHectare * 100) / 100,
          status: safra.em_andamento ? 'Em Andamento' : 'Concluída',
          data_inicio: safra.data_inicio,
          data_fim: safra.data_fim
        }
      }) || []
    )

    // 5. Calcular resumo geral
    const areaTotal = talhoes?.reduce((acc, t) => acc + (t.area_hectares || 0), 0) || 0
    const totalHoras = produtividadePorTalhao.reduce((acc, t) => acc + t.horas_trabalhadas, 0)
    const totalCombustivel = produtividadePorTalhao.reduce((acc, t) => acc + t.combustivel_consumido, 0)
    const totalCusto = produtividadePorTalhao.reduce((acc, t) => acc + t.custo_operacional, 0)

    const resumoGeral = {
      area_total: areaTotal,
      horas_trabalhadas_total: totalHoras,
      combustivel_consumido_total: totalCombustivel,
      custo_operacional_total: totalCusto,
      horas_media_por_hectare: areaTotal > 0 ? Math.round((totalHoras / areaTotal) * 100) / 100 : 0,
      combustivel_medio_por_hectare: areaTotal > 0 ? Math.round((totalCombustivel / areaTotal) * 100) / 100 : 0,
      custo_medio_por_hectare: areaTotal > 0 ? Math.round((totalCusto / areaTotal) * 100) / 100 : 0
    }

    console.log('✅ Análise de produtividade por hectare gerada (SEGURO):', {
      talhoes: produtividadePorTalhao.length,
      safras: produtividadePorSafra.length,
      areaTotal
    })

    return NextResponse.json({
      success: true,
      data: {
        por_talhao: produtividadePorTalhao,
        por_safra: produtividadePorSafra,
        resumo_geral: resumoGeral
      }
    })
  } catch (error) {
    console.error('❌ Erro ao calcular produtividade por hectare:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao calcular produtividade por hectare' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
