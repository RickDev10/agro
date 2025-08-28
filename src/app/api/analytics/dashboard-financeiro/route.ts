import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Dashboard financeiro (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/dashboard-financeiro - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    console.log('👤 Usuário autenticado:', request.userEmail)
    console.log('🔍 Iniciando Dashboard Financeiro...')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Buscar dados básicos
    const [safrasRes, talhoesRes, gastosRes, manutencaoRes, historicoPlantioRes, historicoColheitaRes] = await Promise.all([
      client.from('safras').select('*'),
      client.from('talhoes').select('*'),
      client.from('gastos_gerais').select('*'),
      client.from('manutencao').select('*'),
      client.from('historico_plantio').select('*'),
      client.from('historico_colheita').select('*')
    ])

    if (safrasRes.error) {
      console.error('Erro ao buscar safras:', safrasRes.error)
      return NextResponse.json({ error: 'Erro ao buscar safras' }, { status: 500 })
    }

    if (talhoesRes.error) {
      console.error('Erro ao buscar talhões:', talhoesRes.error)
      return NextResponse.json({ error: 'Erro ao buscar talhões' }, { status: 500 })
    }

    if (gastosRes.error) {
      console.error('Erro ao buscar gastos:', gastosRes.error)
      return NextResponse.json({ error: 'Erro ao buscar gastos' }, { status: 500 })
    }

    if (manutencaoRes.error) {
      console.error('Erro ao buscar manutenção:', manutencaoRes.error)
      return NextResponse.json({ error: 'Erro ao buscar manutenção' }, { status: 500 })
    }

    if (historicoPlantioRes.error) {
      console.error('Erro ao buscar histórico de plantio:', historicoPlantioRes.error)
      return NextResponse.json({ error: 'Erro ao buscar histórico de plantio' }, { status: 500 })
    }

    if (historicoColheitaRes.error) {
      console.error('Erro ao buscar histórico de colheita:', historicoColheitaRes.error)
      return NextResponse.json({ error: 'Erro ao buscar histórico de colheita' }, { status: 500 })
    }

    const safras = safrasRes.data || []
    const talhoes = talhoesRes.data || []
    const gastos = gastosRes.data || []
    const manutencoes = manutencaoRes.data || []
    const historicoPlantio = historicoPlantioRes.data || []
    const historicoColheita = historicoColheitaRes.data || []

    console.log('📊 Dados encontrados:', {
      safras: safras.length,
      talhoes: talhoes.length,
      gastos: gastos.length,
      manutencoes: manutencoes.length,
      historicoPlantio: historicoPlantio.length,
      historicoColheita: historicoColheita.length
    })

    // Calcular KPIs Executivos - USANDO FATURAMENTO REAL
    const totalReceita = safras.reduce((acc, safra) => acc + (safra.faturamento_total || 0), 0)
    const totalVendas = totalReceita // Mesmo valor, já que faturamento_total é o real
    
    // Custos totais (APENAS gastos de compra e administrativos - NÃO contar gastos de USO)
    const gastosValidos = gastos.filter(gasto => 
      // Incluir apenas gastos de compra e administrativos
      // Excluir gastos de uso automático (insumo, combustivel sem "compra_")
      gasto.tipo !== 'insumo' && gasto.tipo !== 'combustivel' && 
      gasto.tipo !== 'insumos' && gasto.tipo !== 'Combustível'
    )
    const totalCustosGastos = gastosValidos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
    const totalCustosManutencoes = manutencoes.reduce((acc, manutencao) => acc + (manutencao.valor_total || 0), 0)
    const totalCustos = totalCustosGastos + totalCustosManutencoes
    
    const totalLucro = totalReceita - totalCustos
    const margemLucro = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0
    const roi = totalCustos > 0 ? (totalLucro / totalCustos) * 100 : 0

    // Calcular custos por hectare
    const areaTotal = talhoes.reduce((acc, talhao) => acc + (talhao.area_hectares || 0), 0)
    const custoPorHectare = areaTotal > 0 ? totalCustos / areaTotal : 0

    console.log('💰 KPIs calculados:', {
      totalReceita,
      totalVendas,
      totalCustosGastos,
      totalCustosManutencoes,
      totalCustos,
      totalLucro,
      margemLucro,
      roi,
      areaTotal,
      custoPorHectare
    })

    // Função para buscar custos de uma safra através das referências
    const getCustosPorSafra = (safraId: number) => {
      let custosSafra = 0
      
      // 1. Gastos de USO específicos desta safra (insumos e combustível usados)
      const gastosUsoSafra = gastos.filter(gasto => {
        // Incluir apenas gastos de USO para esta safra específica
        if (gasto.tipo !== 'insumo' && gasto.tipo !== 'combustivel') {
          return false
        }
        
        // Se o gasto tem referência específica, verificar se é desta safra
        if (gasto.referencia_tabela === 'historico_plantio') {
          const plantio = historicoPlantio.find(p => p.id === gasto.referencia_id)
          return plantio && plantio.safra_id === safraId
        }
        
        if (gasto.referencia_tabela === 'historico_colheita') {
          const colheita = historicoColheita.find(c => c.id === gasto.referencia_id)
          return colheita && colheita.safra_id === safraId
        }
        
        return false
      })
      
      // Somar gastos de uso da safra
      custosSafra += gastosUsoSafra.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
      
      // 2. Adicionar manutenções da safra
      const manutencoesSafra = manutencoes.filter(manutencao => manutencao.safra_id === safraId)
      custosSafra += manutencoesSafra.reduce((acc, manutencao) => acc + (manutencao.valor_total || 0), 0)
      
      // 3. Adicionar parte proporcional dos gastos gerais (apenas administrativos e outros, NÃO compras)
      // Calcular total de gastos gerais (excluindo uso E compras de insumos/combustível)
      const gastosGerais = gastos.filter(gasto => 
        gasto.tipo !== 'insumo' && gasto.tipo !== 'combustivel' && 
        gasto.tipo !== 'insumos' && gasto.tipo !== 'Combustível' &&
        gasto.tipo !== 'compra_insumo' && gasto.tipo !== 'compra_combustivel'
      )
      const totalGastosGerais = gastosGerais.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
      
      // Calcular área total e área da safra
      const areaTotal = talhoes.reduce((acc, talhao) => acc + (talhao.area_hectares || 0), 0)
      const plantiosSafra = historicoPlantio.filter(plantio => plantio.safra_id === safraId)
      const colheitasSafra = historicoColheita.filter(colheita => colheita.safra_id === safraId)
      
      const talhaoIdsPlantio = plantiosSafra.map(plantio => plantio.talhao_id)
      const talhaoIdsColheita = colheitasSafra.map(colheita => colheita.talhao_id)
      const talhaoIdsUnicos = [...new Set([...talhaoIdsPlantio, ...talhaoIdsColheita])]
      
      const talhoesSafra = talhoes.filter(talhao => talhaoIdsUnicos.includes(talhao.id))
      const areaSafra = talhoesSafra.reduce((acc, talhao) => acc + (talhao.area_hectares || 0), 0)
      
      // Distribuir gastos gerais proporcionalmente pela área
      const proporcaoGastosGerais = areaTotal > 0 ? areaSafra / areaTotal : 1 / safras.length
      custosSafra += totalGastosGerais * proporcaoGastosGerais
      
      return custosSafra
    }

    // Calcular margem por cultura
    const margemPorCultura = safras.map(safra => {
      const custosSafra = getCustosPorSafra(safra.id)
      const receitaSafra = safra.faturamento_total || 0 // Usar faturamento REAL
      const lucroSafra = receitaSafra - custosSafra
      const margemSafra = receitaSafra > 0 ? (lucroSafra / receitaSafra) * 100 : 0
      
      return {
        safra: safra.safra,
        receita: receitaSafra,
        custos: custosSafra,
        lucro: lucroSafra,
        margem: Math.round(margemSafra * 100) / 100
      }
    })

    // Calcular break-even - USANDO RECEITA REAL
    const custosFixos = manutencoes
      .reduce((acc, manutencao) => acc + (manutencao.custo || 0), 0)
    
    const custosVariaveis = gastos
      .filter(gasto => 
        // Para break-even, considerar apenas gastos de compra e administrativos
        // Excluir gastos de uso automático
        gasto.tipo !== 'insumo' && gasto.tipo !== 'combustivel' && 
        gasto.tipo !== 'insumos' && gasto.tipo !== 'Combustível'
      )
      .reduce((acc, gasto) => acc + (gasto.valor || 0), 0)

    const pontoEquilibrio = custosVariaveis > 0 ? custosFixos / (custosVariaveis / totalReceita) : 0
    const margemSeguranca = totalReceita > 0 ? ((totalReceita - pontoEquilibrio) / totalReceita) * 100 : 0
    const margemContribuicao = totalReceita - custosVariaveis

    const breakEven = {
      ponto_equilibrio: Math.round(pontoEquilibrio * 100) / 100,
      margem_seguranca: Math.round(margemSeguranca * 100) / 100,
      margem_contribuicao: Math.round(margemContribuicao * 100) / 100
    }

    // Análise de sensibilidade - USANDO RECEITA REAL
    const variacoes = [-20, -10, 0, 10, 20]
    const sensibilidade = variacoes.map(variacao => {
      const faturamentoAjustado = totalReceita * (1 + variacao / 100)
      const lucroAjustado = faturamentoAjustado - totalCustos
      const margem = faturamentoAjustado > 0 ? (lucroAjustado / faturamentoAjustado) * 100 : 0

      return {
        variacao,
        faturamento: Math.round(faturamentoAjustado * 100) / 100,
        lucro: Math.round(lucroAjustado * 100) / 100,
        margem: Math.round(margem * 100) / 100
      }
    })

    // Rentabilidade por safra (dados detalhados)
    const rentabilidadePorSafra = safras.map(safra => {
      const custosOperacionais = getCustosPorSafra(safra.id)
      const receitaSafra = safra.faturamento_total || 0 // Usar faturamento REAL
      const lucroSafra = receitaSafra - custosOperacionais
      const margemSafra = receitaSafra > 0 ? (lucroSafra / receitaSafra) * 100 : 0

      // Calcular área total dos talhões desta safra
      // Buscar talhões através do histórico de plantio/colheita
      const plantiosSafra = historicoPlantio.filter(plantio => plantio.safra_id === safra.id)
      const colheitasSafra = historicoColheita.filter(colheita => colheita.safra_id === safra.id)
      
      const talhaoIdsPlantio = plantiosSafra.map(plantio => plantio.talhao_id)
      const talhaoIdsColheita = colheitasSafra.map(colheita => colheita.talhao_id)
      const talhaoIdsUnicos = [...new Set([...talhaoIdsPlantio, ...talhaoIdsColheita])]
      
      const talhoesSafra = talhoes.filter(talhao => talhaoIdsUnicos.includes(talhao.id))
      const areaSafra = talhoesSafra.reduce((acc, talhao) => acc + (talhao.area_hectares || 0), 0)
      
      const rentabilidadePorHectare = areaSafra > 0 ? lucroSafra / areaSafra : 0

      return {
        safra: safra.safra,
        receita: receitaSafra,
        custos_operacionais: custosOperacionais,
        lucro: lucroSafra,
        margem: Math.round(margemSafra * 100) / 100,
        area_hectares: areaSafra,
        rentabilidade_por_hectare: Math.round(rentabilidadePorHectare * 100) / 100,
        operacoes: plantiosSafra.length + colheitasSafra.length
      }
    })

    // Resumo financeiro
    const resumo = {
      total_receita: totalReceita,
      total_vendas: totalVendas,
      total_custos: totalCustos,
      total_lucro: totalLucro,
      margem_lucro: Math.round(margemLucro * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      area_total: areaTotal,
      custo_por_hectare: Math.round(custoPorHectare * 100) / 100,
      total_safras: safras.length,
      safras_ativas: safras.filter(s => s.em_andamento === true).length
    }

    console.log('✅ Dashboard Financeiro calculado (SEGURO):', {
      safras: safras.length,
      talhoes: talhoes.length,
      gastos: gastos.length,
      manutencoes: manutencoes.length
    })

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          receita: totalReceita,
          vendas: totalVendas,
          custos: totalCustos,
          lucro: totalLucro,
          margem: Math.round(margemLucro * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          custoPorHectare: Math.round(custoPorHectare * 100) / 100
        },
        margemPorCultura,
        breakEven,
        sensibilidade,
        rentabilidadePorSafra,
        resumo
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard financeiro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar dashboard financeiro' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
