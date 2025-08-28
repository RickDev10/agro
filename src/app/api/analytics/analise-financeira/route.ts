import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Análise financeira (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/analise-financeira - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const safraId = searchParams.get('safraId')
    const periodo = searchParams.get('periodo')

    console.log('💰 Iniciando Análise Financeira Avançada...')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Buscar dados
    const [gastosGerais, talhoes, safras] = await Promise.all([
      client.from('gastos_gerais').select('*'),
      client.from('talhoes').select('*'),
      client.from('safras').select('*')
    ])

    if (gastosGerais.error || talhoes.error || safras.error) {
      throw new Error('Erro ao buscar dados')
    }

    // Filtrar gastos por safra se especificado
    let gastosFiltrados = gastosGerais.data || []
    if (safraId) {
      const [plantios, colheitas] = await Promise.all([
        client.from('historico_plantio').select('id').eq('safra_id', safraId),
        client.from('historico_colheita').select('id').eq('safra_id', safraId)
      ])

      const idsPlantio = plantios.data?.map(p => p.id) || []
      const idsColheita = colheitas.data?.map(c => c.id) || []

      gastosFiltrados = gastosFiltrados.filter(gasto => {
        if (gasto.tipo === 'insumo' || gasto.tipo === 'combustivel') {
          return idsPlantio.includes(gasto.referencia_id) || idsColheita.includes(gasto.referencia_id)
        }
        return true
      })
    }

    // Filtrar por período
    if (periodo) {
      const hoje = new Date()
      let dataInicio: Date

      switch (periodo) {
        case '30dias':
          dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90dias':
          dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6meses':
          dataInicio = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1ano':
          dataInicio = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          dataInicio = new Date(0)
      }

      gastosFiltrados = gastosFiltrados.filter(gasto => 
        new Date(gasto.data) >= dataInicio
      )
    }

    // Calcular custos por categoria
    const custosPorCategoria = gastosFiltrados.reduce((acc, gasto) => {
      const tipo = gasto.tipo
      if (!acc[tipo]) acc[tipo] = 0
      acc[tipo] += Number(gasto.valor)
      return acc
    }, {} as Record<string, number>)

    // Calcular custos por hectare
    const totalArea = (talhoes.data || []).reduce((sum, talhao) => sum + Number(talhao.area_hectares || 0), 0)
    const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + Number(gasto.valor), 0)
    const custoPorHectare = totalArea > 0 ? totalGastos / totalArea : 0

    // Calcular margem por cultura
    const safrasComDados = safras.data?.map(safra => ({
      ...safra,
      faturamento_total: Number(safra.faturamento_total || 0),
      lucro_esperado: Number(safra.lucro_esperado || 0)
    })) || []

    const margemPorCultura = safrasComDados.map(safra => ({
      safra: safra.safra,
      faturamento: safra.faturamento_total,
      lucro: safra.lucro_esperado,
      margem: safra.faturamento_total > 0 ? (safra.lucro_esperado / safra.faturamento_total) * 100 : 0
    }))

    // Calcular break-even
    const totalFaturamento = safrasComDados.reduce((sum, safra) => sum + safra.faturamento_total, 0)
    const totalLucro = safrasComDados.reduce((sum, safra) => sum + safra.lucro_esperado, 0)
    
    // Separar custos fixos e variáveis (simplificado)
    const custosFixos = (custosPorCategoria['manutencao'] || 0) + (custosPorCategoria['outros'] || 0)
    const custosVariaveis = (custosPorCategoria['insumo'] || 0) + (custosPorCategoria['combustivel'] || 0) + (custosPorCategoria['compra_insumo'] || 0) + (custosPorCategoria['compra_combustivel'] || 0)
    
    const margemContribuicao = totalFaturamento - custosVariaveis
    const pontoEquilibrio = margemContribuicao > 0 ? custosFixos / (margemContribuicao / totalFaturamento) : 0
    const margemSeguranca = totalFaturamento > 0 ? ((totalFaturamento - pontoEquilibrio) / totalFaturamento) * 100 : 0

    // Análise de sensibilidade (simplificada)
    const variacoes = [-20, -10, 0, 10, 20] // Percentuais
    const analiseSensibilidade = variacoes.map(variacao => {
      const faturamentoAjustado = totalFaturamento * (1 + variacao / 100)
      const lucroAjustado = faturamentoAjustado - totalGastos
      return {
        variacao: variacao,
        faturamento: faturamentoAjustado,
        lucro: lucroAjustado,
        margem: faturamentoAjustado > 0 ? (lucroAjustado / faturamentoAjustado) * 100 : 0
      }
    })

    const analiseFinanceira = {
      // 1. Custo por Hectare
      custo_por_hectare: {
        insumos: (custosPorCategoria['insumo'] || 0) / totalArea,
        combustivel: (custosPorCategoria['combustivel'] || 0) / totalArea,
        manutencao: (custosPorCategoria['manutencao'] || 0) / totalArea,
        outros: (custosPorCategoria['outros'] || 0) / totalArea,
        total: custoPorHectare
      },

      // 2. Margem por Cultura
      margem_por_cultura: margemPorCultura,

      // 3. Break-even Analysis
      break_even_analysis: {
        ponto_equilibrio: pontoEquilibrio,
        margem_seguranca: margemSeguranca,
        margem_contribuicao: margemContribuicao,
        custos_fixos: custosFixos,
        custos_variaveis: custosVariaveis
      },

      // 4. Análise de Sensibilidade
      analise_sensibilidade: analiseSensibilidade,

      // 5. Resumo Geral
      resumo: {
        total_gastos: totalGastos,
        total_faturamento: totalFaturamento,
        total_lucro: totalLucro,
        margem_liquida: totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0,
        roi: totalGastos > 0 ? (totalLucro / totalGastos) * 100 : 0
      }
    }

    console.log('💰 Análise Financeira calculada:', analiseFinanceira)

    console.log('✅ Análise Financeira gerada (SEGURO):', {
      gastos: gastosFiltrados.length,
      safras: safrasComDados.length,
      talhoes: talhoes.data?.length || 0
    })

    return NextResponse.json({
      success: true,
      data: analiseFinanceira
    })

  } catch (error) {
    console.error('❌ Erro na Análise Financeira:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar análise financeira' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
