import { SupabaseClient } from '@supabase/supabase-js'

export const calculateOperationalCosts = async (
  supabase: SupabaseClient,
  idsOperacoes: number[]
) => {
  if (idsOperacoes.length === 0) return []

  // Buscar apenas gastos de INSUMOS (não combustível, pois combustível vem dos históricos)
  const { data: gastos } = await supabase
    .from('gastos_gerais')
    .select('*')
    .eq('tipo', 'insumo') // Apenas insumos, não combustível
    .in('referencia_tabela', ['historico_plantio', 'historico_colheita'])
    .in('referencia_id', idsOperacoes)

  return gastos || []
}

// Nova função para calcular custos de combustível baseado nos históricos
export const calculateFuelCosts = async (
  supabase: SupabaseClient,
  plantios: any[],
  colheitas: any[]
) => {
  if ((plantios?.length || 0) + (colheitas?.length || 0) === 0) return 0

  // Buscar preço médio do combustível das movimentações
  const { data: movimentacoes } = await supabase
    .from('movimentacoes_combustivel')
    .select('custo_unitario, quantidade')
    .eq('tipo', 'entrada')
    .not('custo_unitario', 'is', null)

  if (!movimentacoes || movimentacoes.length === 0) return 0

  // Calcular preço médio ponderado
  const totalQuantidade = movimentacoes.reduce((acc, m) => acc + (m.quantidade || 0), 0)
  const totalValor = movimentacoes.reduce((acc, m) => acc + ((m.custo_unitario || 0) * (m.quantidade || 0)), 0)
  const precoMedio = totalQuantidade > 0 ? totalValor / totalQuantidade : 0

  // Calcular combustível consumido dos históricos (em litros)
  const combustivelConsumido = (plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0) +
                              (colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0)

  // Retornar custo total do combustível
  return combustivelConsumido * precoMedio
}

export const calculateMargins = (receita: number, custos: number) => {
  const lucro = receita - custos
  const margem = receita > 0 ? (lucro / receita) * 100 : 0
  const roi = custos > 0 ? (lucro / custos) * 100 : 0

  return {
    lucro,
    margem: Math.round(margem * 100) / 100,
    roi: Math.round(roi * 100) / 100
  }
}

export const calculateBreakEven = (
  faturamento: number,
  custosFixos: number,
  custosVariaveis: number
) => {
  const margemContribuicao = faturamento - custosVariaveis
  const pontoEquilibrio = margemContribuicao > 0 ? custosFixos / (margemContribuicao / faturamento) : 0
  const margemSeguranca = faturamento > 0 ? ((faturamento - pontoEquilibrio) / faturamento) * 100 : 0

  return {
    ponto_equilibrio: Math.round(pontoEquilibrio * 100) / 100,
    margem_seguranca: Math.round(margemSeguranca * 100) / 100,
    margem_contribuicao: Math.round(margemContribuicao * 100) / 100
  }
}

export const calculateSensitivityAnalysis = (
  faturamento: number,
  gastos: number,
  variacoes: number[] = [-20, -10, 0, 10, 20]
) => {
  return variacoes.map(variacao => {
    const faturamentoAjustado = faturamento * (1 + variacao / 100)
    const lucroAjustado = faturamentoAjustado - gastos
    const margem = faturamentoAjustado > 0 ? (lucroAjustado / faturamentoAjustado) * 100 : 0

    return {
      variacao,
      faturamento: Math.round(faturamentoAjustado * 100) / 100,
      lucro: Math.round(lucroAjustado * 100) / 100,
      margem: Math.round(margem * 100) / 100
    }
  })
}

export const calculateProductivityMetrics = (
  plantios: any[],
  colheitas: any[],
  areaHectares: number = 1
) => {
  const horasTrabalhadas = (plantios?.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) || 0) +
                          (colheitas?.reduce((acc, c) => acc + (c.duracao_horas || 0), 0) || 0)

  const combustivelConsumido = (plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0) +
                              (colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0)

  const operacoes = (plantios?.length || 0) + (colheitas?.length || 0)

  // Logs de debug para verificar os cálculos
  console.log('🔍 DEBUG - Cálculo de Produtividade:', {
    plantios: plantios?.length || 0,
    colheitas: colheitas?.length || 0,
    horas_plantio: plantios?.reduce((acc, p) => acc + (p.duracao_horas || 0), 0) || 0,
    horas_colheita: colheitas?.reduce((acc, c) => acc + (c.duracao_horas || 0), 0) || 0,
    combustivel_plantio: plantios?.reduce((acc, p) => acc + (p.combustivel || 0), 0) || 0,
    combustivel_colheita: colheitas?.reduce((acc, c) => acc + (c.combustivel || 0), 0) || 0,
    total_horas: horasTrabalhadas,
    total_combustivel: combustivelConsumido,
    eficiencia_calculada: horasTrabalhadas > 0 ? combustivelConsumido / horasTrabalhadas : 0
  })

  return {
    horas_trabalhadas: horasTrabalhadas,
    combustivel_consumido: combustivelConsumido,
    operacoes,
    horas_por_hectare: areaHectares > 0 ? Math.round((horasTrabalhadas / areaHectares) * 100) / 100 : 0,
    combustivel_por_hectare: areaHectares > 0 ? Math.round((combustivelConsumido / areaHectares) * 100) / 100 : 0,
    eficiencia_combustivel: horasTrabalhadas > 0 ? Math.round((combustivelConsumido / horasTrabalhadas) * 100) / 100 : 0,
    produtividade_operacoes: horasTrabalhadas > 0 ? Math.round((operacoes / horasTrabalhadas) * 100) / 100 : 0
  }
}
