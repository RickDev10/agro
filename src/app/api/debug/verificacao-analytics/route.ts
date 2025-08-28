import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()

  try {
    console.log('🔍 Iniciando verificação completa das análises...')

    // 1. DADOS REAIS DO BANCO
    console.log('📊 Coletando dados reais do banco...')

    // Safras
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('*')
      .order('data_inicio', { ascending: false })

    if (safrasError) throw safrasError

    // Tratores
    const { data: tratores, error: tratoresError } = await supabase
      .from('tratores')
      .select('*')

    if (tratoresError) throw tratoresError

    // Talhões
    const { data: talhoes, error: talhoesError } = await supabase
      .from('talhoes')
      .select('*')

    if (talhoesError) throw talhoesError

    // Histórico de Plantio
    const { data: historicoPlantio, error: plantioError } = await supabase
      .from('historico_plantio')
      .select('*')

    if (plantioError) throw plantioError

    // Histórico de Colheita
    const { data: historicoColheita, error: colheitaError } = await supabase
      .from('historico_colheita')
      .select('*')

    if (colheitaError) throw colheitaError

    // Gastos Gerais
    const { data: gastosGerais, error: gastosError } = await supabase
      .from('gastos_gerais')
      .select('*')

    if (gastosError) throw gastosError

    // Movimentações de Combustível
    const { data: movimentacoesCombustivel, error: movCombustivelError } = await supabase
      .from('movimentacoes_combustivel')
      .select('*')

    if (movCombustivelError) throw movCombustivelError

    // Movimentações de Insumos
    const { data: movimentacoesInsumos, error: movInsumosError } = await supabase
      .from('movimentacoes_insumos')
      .select('*')

    if (movInsumosError) throw movInsumosError

    // 2. CÁLCULOS MANUAIS PARA COMPARAÇÃO
    console.log('🧮 Calculando métricas manualmente...')

    // Rentabilidade - Cálculos manuais
    const rentabilidadeManual = safras.map(safra => {
      // Operações da safra
      const plantiosSafra = historicoPlantio.filter(p => p.safra_id === safra.id)
      const colheitasSafra = historicoColheita.filter(c => c.safra_id === safra.id)
      
      const idsOperacoes = [
        ...plantiosSafra.map(p => p.id),
        ...colheitasSafra.map(c => c.id)
      ]

      // Gastos operacionais
      const gastosOperacionais = gastosGerais.filter(g => 
        g.safra_id === safra.id && 
        ['insumo', 'combustivel'].includes(g.tipo) &&
        ['historico_plantio', 'historico_colheita'].includes(g.referencia_tabela) &&
        idsOperacoes.includes(g.referencia_id)
      )

      // Outros gastos
      const outrosGastos = gastosGerais.filter(g => 
        g.safra_id === safra.id && 
        !['insumo', 'combustivel'].includes(g.tipo)
      )

      const custoOperacional = gastosOperacionais.reduce((acc, g) => acc + g.valor, 0)
      const custoOutros = outrosGastos.reduce((acc, g) => acc + g.valor, 0)
      const custoTotal = custoOperacional + custoOutros
      const receitaTotal = safra.faturamento_total || 0
      const lucro = receitaTotal - custoTotal
      const margemLucro = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0

      return {
        safra_id: safra.id,
        safra_nome: safra.safra,
        receita_total: receitaTotal,
        custo_total: custoTotal,
        lucro: lucro,
        margem_lucro: Math.round(margemLucro * 100) / 100,
        operacoes_count: idsOperacoes.length,
        gastos_operacionais_count: gastosOperacionais.length,
        outros_gastos_count: outrosGastos.length
      }
    })

    // Performance Operacional - Cálculos manuais
    const performanceManual = tratores.map(trator => {
      const plantiosTrator = historicoPlantio.filter(p => p.trator_id === trator.id)
      const colheitasTrator = historicoColheita.filter(c => c.trator_id === trator.id)
      
      const horasTrabalhadas = 
        plantiosTrator.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) +
        colheitasTrator.reduce((acc, c) => acc + (c.duracao_horas || 0), 0)

      const combustivelConsumido = 
        plantiosTrator.reduce((acc, p) => acc + (p.combustivel || 0), 0) +
        colheitasTrator.reduce((acc, c) => acc + (c.combustivel || 0), 0)

      const operacoes = plantiosTrator.length + colheitasTrator.length
      const eficienciaCombustivel = horasTrabalhadas > 0 ? combustivelConsumido / horasTrabalhadas : 0

      const idsOperacoes = [
        ...plantiosTrator.map(p => p.id),
        ...colheitasTrator.map(c => c.id)
      ]

      const gastosOperacionais = gastosGerais.filter(g => 
        ['insumo', 'combustivel'].includes(g.tipo) &&
        ['historico_plantio', 'historico_colheita'].includes(g.referencia_tabela) &&
        idsOperacoes.includes(g.referencia_id)
      )

      const custoOperacional = gastosOperacionais.reduce((acc, g) => acc + g.valor, 0)
      const custoPorHora = horasTrabalhadas > 0 ? custoOperacional / horasTrabalhadas : 0

      return {
        trator_id: trator.id,
        trator_nome: trator.nome,
        horas_trabalhadas: horasTrabalhadas,
        combustivel_consumido: combustivelConsumido,
        operacoes: operacoes,
        eficiencia_combustivel: Math.round(eficienciaCombustivel * 100) / 100,
        custo_por_hora: Math.round(custoPorHora * 100) / 100,
        gastos_operacionais_count: gastosOperacionais.length
      }
    })

    // Estoque e Sobra - Cálculos manuais
    const comprasCombustivel = movimentacoesCombustivel.filter(m => m.tipo === 'entrada')
    const saidasCombustivel = movimentacoesCombustivel.filter(m => m.tipo === 'saida')
    
    const totalCompradoCombustivel = comprasCombustivel.reduce((acc, c) => acc + (c.quantidade * c.custo_unitario), 0)
    const totalUtilizadoCombustivel = saidasCombustivel.reduce((acc, s) => acc + (s.quantidade * s.custo_unitario), 0)
    const sobraCombustivel = totalCompradoCombustivel - totalUtilizadoCombustivel

    const comprasInsumos = movimentacoesInsumos.filter(m => m.tipo === 'entrada')
    const saidasInsumos = movimentacoesInsumos.filter(m => m.tipo === 'saida')
    
    const totalCompradoInsumos = comprasInsumos.reduce((acc, c) => acc + (c.quantidade * c.custo_unitario), 0)
    const totalUtilizadoInsumos = saidasInsumos.reduce((acc, s) => acc + (s.quantidade * s.custo_unitario), 0)
    const sobraInsumos = totalCompradoInsumos - totalUtilizadoInsumos

    // Produtividade por Hectare - Cálculos manuais
    const talhoesComArea = talhoes.filter(t => t.area_hectares)
    const produtividadeManual = talhoesComArea.map(talhao => {
      const plantiosTalhao = historicoPlantio.filter(p => p.talhao_id === talhao.id)
      const colheitasTalhao = historicoColheita.filter(c => c.talhao_id === talhao.id)
      
      const horasTrabalhadas = 
        plantiosTalhao.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) +
        colheitasTalhao.reduce((acc, c) => acc + (c.duracao_horas || 0), 0)

      const combustivelConsumido = 
        plantiosTalhao.reduce((acc, p) => acc + (p.combustivel || 0), 0) +
        colheitasTalhao.reduce((acc, c) => acc + (c.combustivel || 0), 0)

      const idsOperacoes = [
        ...plantiosTalhao.map(p => p.id),
        ...colheitasTalhao.map(c => c.id)
      ]

      const gastosOperacionais = gastosGerais.filter(g => 
        ['insumo', 'combustivel'].includes(g.tipo) &&
        ['historico_plantio', 'historico_colheita'].includes(g.referencia_tabela) &&
        idsOperacoes.includes(g.referencia_id)
      )

      const custoOperacional = gastosOperacionais.reduce((acc, g) => acc + g.valor, 0)
      const areaHectares = talhao.area_hectares || 1
      
      return {
        talhao_id: talhao.id,
        talhao_nome: talhao.nome,
        area_hectares: areaHectares,
        horas_trabalhadas: horasTrabalhadas,
        combustivel_consumido: combustivelConsumido,
        custo_operacional: custoOperacional,
        horas_por_hectare: Math.round((horasTrabalhadas / areaHectares) * 100) / 100,
        combustivel_por_hectare: Math.round((combustivelConsumido / areaHectares) * 100) / 100,
        custo_por_hectare: Math.round((custoOperacional / areaHectares) * 100) / 100,
        operacoes: plantiosTalhao.length + colheitasTalhao.length
      }
    })

    // 3. RESUMO GERAL DOS DADOS
    const resumoDados = {
      safras: {
        total: safras.length,
        em_andamento: safras.filter(s => s.em_andamento).length,
        concluidas: safras.filter(s => !s.em_andamento).length,
        com_faturamento: safras.filter(s => s.faturamento_total && s.faturamento_total > 0).length
      },
      tratores: {
        total: tratores.length,
        em_manutencao: tratores.filter(t => t.em_manutencao).length
      },
      talhoes: {
        total: talhoes.length,
        com_area: talhoes.filter(t => t.area_hectares).length,
        sem_area: talhoes.filter(t => !t.area_hectares).length
      },
      operacoes: {
        plantios: historicoPlantio.length,
        colheitas: historicoColheita.length,
        total: historicoPlantio.length + historicoColheita.length
      },
      gastos: {
        total: gastosGerais.length,
        por_tipo: {
          insumo: gastosGerais.filter(g => g.tipo === 'insumo').length,
          combustivel: gastosGerais.filter(g => g.tipo === 'combustivel').length,
          manutencao: gastosGerais.filter(g => g.tipo === 'manutencao').length,
          outros: gastosGerais.filter(g => !['insumo', 'combustivel', 'manutencao'].includes(g.tipo)).length
        }
      },
      movimentacoes: {
        combustivel: {
          total: movimentacoesCombustivel.length,
          entradas: comprasCombustivel.length,
          saidas: saidasCombustivel.length
        },
        insumos: {
          total: movimentacoesInsumos.length,
          entradas: comprasInsumos.length,
          saidas: saidasInsumos.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resumo_dados: resumoDados,
        rentabilidade_manual: rentabilidadeManual,
        performance_manual: performanceManual,
        estoque_sobra_manual: {
          combustivel: {
            total_comprado: totalCompradoCombustivel,
            total_utilizado: totalUtilizadoCombustivel,
            sobra: sobraCombustivel,
            percentual_utilizacao: totalCompradoCombustivel > 0 ? (totalUtilizadoCombustivel / totalCompradoCombustivel) * 100 : 0
          },
          insumos: {
            total_comprado: totalCompradoInsumos,
            total_utilizado: totalUtilizadoInsumos,
            sobra: sobraInsumos,
            percentual_utilizacao: totalCompradoInsumos > 0 ? (totalUtilizadoInsumos / totalCompradoInsumos) * 100 : 0
          }
        },
        produtividade_manual: produtividadeManual,
        dados_brutos: {
          safras: safras,
          tratores: tratores,
          talhoes: talhoes,
          historico_plantio: historicoPlantio,
          historico_colheita: historicoColheita,
          gastos_gerais: gastosGerais,
          movimentacoes_combustivel: movimentacoesCombustivel,
          movimentacoes_insumos: movimentacoesInsumos
        }
      }
    })

  } catch (error) {
    console.error('Erro na verificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro na verificação dos dados' },
      { status: 500 }
    )
  }
}
