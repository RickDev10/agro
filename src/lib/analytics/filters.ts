import { SupabaseClient } from '@supabase/supabase-js'

export interface FilterParams {
  safraId?: string
  talhaoId?: string
  tratorId?: string
  funcionarioId?: string
  periodo?: string
  dataInicio?: string
  dataFim?: string
}

export const applyCommonFilters = async (
  supabase: SupabaseClient,
  filters: FilterParams
) => {
  const { safraId, periodo, dataInicio, dataFim } = filters

  // Buscar dados base
  const [safras, talhoes, gastosGerais] = await Promise.all([
    supabase.from('safras').select('*').order('safra'),
    supabase.from('talhoes').select('*'),
    supabase.from('gastos_gerais').select('*')
  ])

  if (safras.error || talhoes.error || gastosGerais.error) {
    throw new Error('Erro ao buscar dados básicos')
  }

  // Filtrar gastos por safra se especificado
  let gastosFiltrados = gastosGerais.data || []
  if (safraId) {
    const [plantios, colheitas] = await Promise.all([
      supabase.from('historico_plantio').select('id').eq('safra_id', safraId),
      supabase.from('historico_colheita').select('id').eq('safra_id', safraId)
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

  // Filtrar por período se especificado
  if (periodo) {
    const hoje = new Date()
    let dataInicioPeriodo: Date

    switch (periodo) {
      case '30dias':
        dataInicioPeriodo = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90dias':
        dataInicioPeriodo = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '6meses':
        dataInicioPeriodo = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1ano':
        dataInicioPeriodo = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        dataInicioPeriodo = new Date(0)
    }

    gastosFiltrados = gastosFiltrados.filter(gasto => 
      new Date(gasto.data) >= dataInicioPeriodo
    )
  }

  // Filtrar por data específica se fornecida
  if (dataInicio) {
    gastosFiltrados = gastosFiltrados.filter(gasto => 
      new Date(gasto.data) >= new Date(dataInicio)
    )
  }
  if (dataFim) {
    gastosFiltrados = gastosFiltrados.filter(gasto => 
      new Date(gasto.data) <= new Date(dataFim)
    )
  }

  return {
    safras: safras.data || [],
    talhoes: talhoes.data || [],
    gastosFiltrados
  }
}

export const getFilteredOperations = async (
  supabase: SupabaseClient,
  filters: FilterParams
) => {
  const { safraId, talhaoId, dataInicio, dataFim, tratorId, funcionarioId } = filters

  // Buscar plantios com filtros
  let plantiosQuery = supabase.from('historico_plantio').select('*')
  let colheitasQuery = supabase.from('historico_colheita').select('*')

  if (safraId) {
    plantiosQuery = plantiosQuery.eq('safra_id', safraId)
    colheitasQuery = colheitasQuery.eq('safra_id', safraId)
  }

  if (talhaoId) {
    plantiosQuery = plantiosQuery.eq('talhao_id', talhaoId)
    colheitasQuery = colheitasQuery.eq('talhao_id', talhaoId)
  }

  if (dataInicio) {
    plantiosQuery = plantiosQuery.gte('data_execucao', dataInicio)
    colheitasQuery = colheitasQuery.gte('data_execucao', dataInicio)
  }

  if (dataFim) {
    plantiosQuery = plantiosQuery.lte('data_execucao', dataFim)
    colheitasQuery = colheitasQuery.lte('data_execucao', dataFim)
  }

  if (tratorId) {
    plantiosQuery = plantiosQuery.eq('trator_id', tratorId)
    colheitasQuery = colheitasQuery.eq('trator_id', tratorId)
  }

  if (funcionarioId) {
    plantiosQuery = plantiosQuery.eq('funcionario_id', funcionarioId)
    colheitasQuery = colheitasQuery.eq('funcionario_id', funcionarioId)
  }

  const [plantios, colheitas] = await Promise.all([
    plantiosQuery,
    colheitasQuery
  ])

  return {
    plantios: plantios.data || [],
    colheitas: colheitas.data || []
  }
}
