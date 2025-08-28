import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'
import { getFilteredOperations } from '@/lib/analytics/filters'
import { calculateProductivityMetrics, calculateOperationalCosts, calculateFuelCosts } from '@/lib/analytics/calculations'

// GET - Análise de eficiência operacional (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/eficiencia-operacional - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Extrair filtros dos parâmetros
    const filters = {
      safraId: searchParams.get('safraId') || undefined,
      talhaoId: searchParams.get('talhaoId') || undefined,
      tratorId: searchParams.get('tratorId') || undefined,
      funcionarioId: searchParams.get('funcionarioId') || undefined,
      periodo: searchParams.get('periodo') || undefined,
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined
    }
    
    console.log('🔍 Iniciando Eficiência Operacional com filtros:', filters)

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Buscar dados básicos
    const [tratoresRes, talhoesRes, safrasRes] = await Promise.all([
      client.from('tratores').select('*'),
      client.from('talhoes').select('*'),
      client.from('safras').select('*')
    ])

    if (tratoresRes.error) throw tratoresRes.error
    if (talhoesRes.error) throw talhoesRes.error
    if (safrasRes.error) throw safrasRes.error

    const tratores = tratoresRes.data || []
    const talhoes = talhoesRes.data || []
    const safras = safrasRes.data || []

    // 1. PERFORMANCE POR TRATOR
    const performancePorTrator = await Promise.all(
      tratores?.map(async (trator) => {
        // Buscar operações do trator com filtros
        const { plantios, colheitas } = await getFilteredOperations(client, {
          ...filters,
          tratorId: trator.id
        })

        // Calcular métricas de produtividade
        const metrics = calculateProductivityMetrics(plantios, colheitas)

        // Buscar gastos operacionais (apenas insumos)
        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]
        const gastosOperacionais = await calculateOperationalCosts(client, idsOperacoes)
        const custoInsumos = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)
        
        // Calcular custo de combustível baseado nos históricos
        const custoCombustivel = await calculateFuelCosts(client, plantios, colheitas)
        
        // Custo operacional total = insumos + combustível
        const custoOperacional = custoInsumos + custoCombustivel
        const custoPorHora = metrics.horas_trabalhadas > 0 ? custoOperacional / metrics.horas_trabalhadas : 0

        console.log('🚜 DEBUG - Trator:', trator.nome, {
          plantios: plantios?.length || 0,
          colheitas: colheitas?.length || 0,
          horas: metrics.horas_trabalhadas,
          combustivel_litros: metrics.combustivel_consumido,
          eficiencia: metrics.eficiencia_combustivel,
          custo_insumos: custoInsumos,
          custo_combustivel: custoCombustivel,
          custo_total: custoOperacional,
          custo_por_hora: custoPorHora
        })

        return {
          trator_id: trator.id,
          trator_nome: trator.nome,
          horas_trabalhadas: metrics.horas_trabalhadas,
          combustivel_consumido: metrics.combustivel_consumido,
          operacoes: metrics.operacoes,
          eficiencia_combustivel: metrics.eficiencia_combustivel,
          custo_por_hora: Math.round(custoPorHora * 100) / 100,
          produtividade_operacoes: metrics.produtividade_operacoes
        }
      }) || []
    )

    // 2. PRODUTIVIDADE POR TALHÃO
    const talhoesComArea = talhoes.filter(talhao => talhao.area_hectares)
    
    const produtividadePorTalhao = await Promise.all(
      talhoesComArea?.map(async (talhao) => {
        // Buscar operações do talhão com filtros
        const { plantios, colheitas } = await getFilteredOperations(client, {
          ...filters,
          talhaoId: talhao.id,
          tratorId: undefined // Não filtrar por trator para talhões
        })

        // Filtrar operações do talhão específico
        const plantiosTalhao = plantios.filter(p => p.talhao_id === talhao.id)
        const colheitasTalhao = colheitas.filter(c => c.talhao_id === talhao.id)

        // Calcular métricas de produtividade
        const metrics = calculateProductivityMetrics(plantiosTalhao, colheitasTalhao, talhao.area_hectares)

        // Buscar gastos operacionais (apenas insumos)
        const idsOperacoes = [
          ...(plantiosTalhao?.map(p => p.id) || []),
          ...(colheitasTalhao?.map(c => c.id) || [])
        ]
        const gastosOperacionais = await calculateOperationalCosts(client, idsOperacoes)
        const custoInsumos = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)
        
        // Calcular custo de combustível baseado nos históricos
        const custoCombustivel = await calculateFuelCosts(client, plantiosTalhao, colheitasTalhao)
        
        // Custo operacional total = insumos + combustível
        const custoOperacional = custoInsumos + custoCombustivel
        const custoPorHectare = talhao.area_hectares > 0 ? custoOperacional / talhao.area_hectares : 0

        return {
          talhao_id: talhao.id,
          talhao_nome: talhao.nome,
          area_hectares: talhao.area_hectares,
          horas_trabalhadas: metrics.horas_trabalhadas,
          combustivel_consumido: metrics.combustivel_consumido,
          custo_operacional: custoOperacional,
          horas_por_hectare: metrics.horas_por_hectare,
          combustivel_por_hectare: metrics.combustivel_por_hectare,
          custo_por_hectare: Math.round(custoPorHectare * 100) / 100,
          operacoes: metrics.operacoes
        }
      }) || []
    )

    // 3. PRODUTIVIDADE POR SAFRA
    const produtividadePorSafra = await Promise.all(
      safras?.map(async (safra) => {
        // Buscar operações da safra com filtros
        const { plantios, colheitas } = await getFilteredOperations(client, {
          ...filters,
          safraId: safra.id
        })

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

        // Calcular métricas de produtividade
        const metrics = calculateProductivityMetrics(plantios, colheitas, areaTotalSafra)

        // Buscar gastos operacionais (apenas insumos)
        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]
        const gastosOperacionais = await calculateOperationalCosts(client, idsOperacoes)
        const custoInsumos = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)
        
        // Calcular custo de combustível baseado nos históricos
        const custoCombustivel = await calculateFuelCosts(client, plantios, colheitas)
        
        // Custo operacional total = insumos + combustível
        const custoOperacional = custoInsumos + custoCombustivel

        // Calcular métricas por hectare
        const producaoTotal = safra.total_colhido || 0
        const producaoPorHectare = areaTotalSafra > 0 ? producaoTotal / areaTotalSafra : 0
        const custoPorHectare = areaTotalSafra > 0 ? custoOperacional / areaTotalSafra : 0

        // Calcular rentabilidade por hectare
        const receitaTotal = safra.faturamento_total || 0
        const lucroPorHectare = areaTotalSafra > 0 ? (receitaTotal - custoOperacional) / areaTotalSafra : 0

        return {
          safra_id: safra.id,
          safra_nome: safra.safra,
          area_utilizada: areaTotalSafra,
          horas_trabalhadas: metrics.horas_trabalhadas,
          combustivel_consumido: metrics.combustivel_consumido,
          producao_total: producaoTotal,
          producao_por_hectare: Math.round(producaoPorHectare * 100) / 100,
          custo_operacional: custoOperacional,
          custo_por_hectare: Math.round(custoPorHectare * 100) / 100,
          receita_total: receitaTotal,
          lucro_por_hectare: Math.round(lucroPorHectare * 100) / 100,
          eficiencia_combustivel: metrics.eficiencia_combustivel,
          operacoes: metrics.operacoes
        }
      }) || []
    )

    // 4. RESUMO GERAL
    const todasOperacoes = await getFilteredOperations(client, filters)
    const metricsGerais = calculateProductivityMetrics(todasOperacoes.plantios, todasOperacoes.colheitas)
    
    const idsTodasOperacoes = [
      ...(todasOperacoes.plantios?.map(p => p.id) || []),
      ...(todasOperacoes.colheitas?.map(c => c.id) || [])
    ]
    const gastosGerais = await calculateOperationalCosts(client, idsTodasOperacoes)
    const custoInsumosGerais = gastosGerais.reduce((acc, gasto) => acc + gasto.valor, 0)
    const custoCombustivelGerais = await calculateFuelCosts(client, todasOperacoes.plantios, todasOperacoes.colheitas)
    const custoOperacionalTotal = custoInsumosGerais + custoCombustivelGerais

    const resumoGeral = {
      total_operacoes: metricsGerais.operacoes,
      total_horas: metricsGerais.horas_trabalhadas,
      total_combustivel: metricsGerais.combustivel_consumido,
      eficiencia_media: metricsGerais.eficiencia_combustivel,
      custo_operacional_total: custoOperacionalTotal,
      custo_medio_por_hora: metricsGerais.horas_trabalhadas > 0 ? custoOperacionalTotal / metricsGerais.horas_trabalhadas : 0
    }

    console.log('✅ Eficiência Operacional calculada (SEGURO):', {
      tratores: performancePorTrator.length,
      talhoes: produtividadePorTalhao.length,
      safras: produtividadePorSafra.length
    })

    return NextResponse.json({
      success: true,
      data: {
        performancePorTrator,
        produtividadePorTalhao,
        produtividadePorSafra,
        resumoGeral
      }
    })

  } catch (error) {
    console.error('❌ Erro ao calcular eficiência operacional:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao calcular eficiência operacional' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
