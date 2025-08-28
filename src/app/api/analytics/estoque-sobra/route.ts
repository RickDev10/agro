import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Análise de estoque e sobra (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/estoque-sobra - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Extrair filtros dos parâmetros da URL
    const safraId = searchParams.get('safraId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    console.log('🔍 Calculando estoque de sobra...')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    // 1. Buscar todas as safras (com filtro se aplicável)
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

    // 2. Calcular estoque e sobra de combustível
    let comprasCombustivelQuery = client
      .from('movimentacoes_combustivel')
      .select('*')
      .eq('tipo', 'entrada')

    let movimentacoesCombustivelQuery = client
      .from('movimentacoes_combustivel')
      .select('*')
      .eq('tipo', 'saida')

    // Aplicar filtros de data
    if (dataInicio) {
      comprasCombustivelQuery = comprasCombustivelQuery.gte('data', dataInicio)
      movimentacoesCombustivelQuery = movimentacoesCombustivelQuery.gte('data', dataInicio)
    }
    if (dataFim) {
      comprasCombustivelQuery = comprasCombustivelQuery.lte('data', dataFim)
      movimentacoesCombustivelQuery = movimentacoesCombustivelQuery.lte('data', dataFim)
    }

    const { data: comprasCombustivel } = await comprasCombustivelQuery
    const { data: movimentacoesCombustivel } = await movimentacoesCombustivelQuery

    const totalCompradoCombustivel = comprasCombustivel?.reduce((acc, compra) => acc + (compra.quantidade * compra.custo_unitario), 0) || 0
    const totalUtilizadoCombustivel = movimentacoesCombustivel?.reduce((acc, mov) => acc + (mov.quantidade * mov.custo_unitario), 0) || 0
    const sobraCombustivel = totalCompradoCombustivel - totalUtilizadoCombustivel
    const percentualUtilizacaoCombustivel = totalCompradoCombustivel > 0 
      ? (totalUtilizadoCombustivel / totalCompradoCombustivel) * 100 
      : 0

    // 3. Calcular estoque e sobra de insumos
    let comprasInsumosQuery = client
      .from('movimentacoes_insumos')
      .select('*')
      .eq('tipo', 'entrada')

    let movimentacoesInsumosQuery = client
      .from('movimentacoes_insumos')
      .select('*')
      .eq('tipo', 'saida')

    // Aplicar filtros de data
    if (dataInicio) {
      comprasInsumosQuery = comprasInsumosQuery.gte('data', dataInicio)
      movimentacoesInsumosQuery = movimentacoesInsumosQuery.gte('data', dataInicio)
    }
    if (dataFim) {
      comprasInsumosQuery = comprasInsumosQuery.lte('data', dataFim)
      movimentacoesInsumosQuery = movimentacoesInsumosQuery.lte('data', dataFim)
    }

    const { data: comprasInsumos } = await comprasInsumosQuery
    const { data: movimentacoesInsumos } = await movimentacoesInsumosQuery

    const totalCompradoInsumos = comprasInsumos?.reduce((acc, compra) => acc + (compra.quantidade * compra.custo_unitario), 0) || 0
    const totalUtilizadoInsumos = movimentacoesInsumos?.reduce((acc, mov) => acc + (mov.quantidade * mov.custo_unitario), 0) || 0
    const sobraInsumos = totalCompradoInsumos - totalUtilizadoInsumos
    const percentualUtilizacaoInsumos = totalCompradoInsumos > 0 
      ? (totalUtilizadoInsumos / totalCompradoInsumos) * 100 
      : 0

    // 4. Calcular utilização por safra
    const utilizacaoPorSafra = await Promise.all(
      safras?.map(async (safra) => {
        // Buscar operações da safra
        const { data: plantios } = await client
          .from('historico_plantio')
          .select('id')
          .eq('safra_id', safra.id)

        const { data: colheitas } = await client
          .from('historico_colheita')
          .select('id')
          .eq('safra_id', safra.id)

        const idsOperacoes = [
          ...(plantios?.map(p => p.id) || []),
          ...(colheitas?.map(c => c.id) || [])
        ]

        // Buscar gastos operacionais da safra
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

        const insumosUtilizados = gastosOperacionais
          .filter(gasto => gasto.tipo === 'insumo')
          .reduce((acc, gasto) => acc + gasto.valor, 0)

        const combustivelUtilizado = gastosOperacionais
          .filter(gasto => gasto.tipo === 'combustivel')
          .reduce((acc, gasto) => acc + gasto.valor, 0)

        const percentualInsumos = totalCompradoInsumos > 0 
          ? (insumosUtilizados / totalCompradoInsumos) * 100 
          : 0

        const percentualCombustivel = totalCompradoCombustivel > 0 
          ? (combustivelUtilizado / totalCompradoCombustivel) * 100 
          : 0

        return {
          safra_id: safra.id,
          safra_nome: safra.safra,
          insumos_utilizados: insumosUtilizados,
          combustivel_utilizado: combustivelUtilizado,
          percentual_insumos: Math.round(percentualInsumos * 100) / 100,
          percentual_combustivel: Math.round(percentualCombustivel * 100) / 100
        }
      }) || []
    )

    // 5. Preparar dados de resposta
    const resumoGeral = [
      {
        tipo: 'combustivel',
        total_comprado: totalCompradoCombustivel,
        total_utilizado: totalUtilizadoCombustivel,
        sobra: sobraCombustivel,
        percentual_utilizacao: Math.round(percentualUtilizacaoCombustivel * 100) / 100
      },
      {
        tipo: 'insumos',
        total_comprado: totalCompradoInsumos,
        total_utilizado: totalUtilizadoInsumos,
        sobra: sobraInsumos,
        percentual_utilizacao: Math.round(percentualUtilizacaoInsumos * 100) / 100
      }
    ]

    console.log('✅ Análise de estoque e sobra gerada (SEGURO):', {
      safras: safras.length,
      combustivel: { comprado: totalCompradoCombustivel, utilizado: totalUtilizadoCombustivel },
      insumos: { comprado: totalCompradoInsumos, utilizado: totalUtilizadoInsumos }
    })

    return NextResponse.json({
      success: true,
      data: {
        resumo_geral: resumoGeral,
        utilizacao_por_safra: utilizacaoPorSafra
      }
    })
  } catch (error) {
    console.error('❌ Erro ao calcular estoque e sobra:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao calcular estoque e sobra' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
