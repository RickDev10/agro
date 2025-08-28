import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Análise de rentabilidade (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/rentabilidade - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Extrair filtros dos parâmetros da URL
    const safraId = searchParams.get('safraId')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

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

    // 2. Calcular rentabilidade por safra
    const rentabilidadePorSafra = await Promise.all(
      safras?.map(async (safra) => {
        // Buscar plantios e colheitas da safra (com filtros de data)
        let plantiosQuery = client
          .from('historico_plantio')
          .select('id')
          .eq('safra_id', safra.id)

        let colheitasQuery = client
          .from('historico_colheita')
          .select('id')
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

        const { data: plantios } = await plantiosQuery
        const { data: colheitas } = await colheitasQuery

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

        // Buscar outros gastos da safra (não operacionais)
        const { data: outrosGastos } = await client
          .from('gastos_gerais')
          .select('*')
          .eq('safra_id', safra.id)
          .not('tipo', 'in', ['insumo', 'combustivel'])

        // Calcular custos totais
        const custoOperacional = gastosOperacionais.reduce((acc, gasto) => acc + gasto.valor, 0)
        const custoOutros = outrosGastos?.reduce((acc, gasto) => acc + gasto.valor, 0) || 0
        const custoTotal = custoOperacional + custoOutros

        // Calcular receita total
        const receitaTotal = safra.faturamento_total || 0

        // Calcular lucro e margem
        const lucro = receitaTotal - custoTotal
        const margemLucro = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0

        return {
          safra_id: safra.id,
          safra_nome: safra.safra,
          receita_total: receitaTotal,
          custo_total: custoTotal,
          lucro: lucro,
          margem_lucro: Math.round(margemLucro * 100) / 100,
          status: safra.em_andamento ? 'Em Andamento' : 'Concluída',
          data_inicio: safra.data_inicio,
          data_fim: safra.data_fim
        }
      }) || []
    )

    // 3. Calcular resumo geral
    const receitaTotal = rentabilidadePorSafra.reduce((acc, safra) => acc + safra.receita_total, 0)
    const custoTotal = rentabilidadePorSafra.reduce((acc, safra) => acc + safra.custo_total, 0)
    const lucroTotal = rentabilidadePorSafra.reduce((acc, safra) => acc + safra.lucro, 0)
    const margemMedia = rentabilidadePorSafra.length > 0 
      ? rentabilidadePorSafra.reduce((acc, safra) => acc + safra.margem_lucro, 0) / rentabilidadePorSafra.length 
      : 0

    const resumoGeral = {
      receita_total: receitaTotal,
      custo_total: custoTotal,
      lucro_total: lucroTotal,
      margem_media: Math.round(margemMedia * 100) / 100
    }

    console.log('✅ Análise de rentabilidade gerada (SEGURO):', rentabilidadePorSafra.length, 'safras analisadas')

    return NextResponse.json({
      success: true,
      data: {
        por_safra: rentabilidadePorSafra,
        resumo_geral: resumoGeral
      }
    })
  } catch (error) {
    console.error('❌ Erro ao calcular rentabilidade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao calcular rentabilidade' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
