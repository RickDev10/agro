import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 DEBUG - Verificando dados de combustível...')

    // Buscar dados de todas as tabelas relacionadas ao combustível
    const [historicoPlantioRes, historicoColheitaRes, movimentacoesRes, gastosGeraisRes] = await Promise.all([
      supabase.from('historico_plantio').select('*'),
      supabase.from('historico_colheita').select('*'),
      supabase.from('movimentacoes_combustivel').select('*'),
      supabase.from('gastos_gerais').select('*').eq('tipo', 'combustivel')
    ])

    if (historicoPlantioRes.error) throw historicoPlantioRes.error
    if (historicoColheitaRes.error) throw historicoColheitaRes.error
    if (movimentacoesRes.error) throw movimentacoesRes.error
    if (gastosGeraisRes.error) throw gastosGeraisRes.error

    const historicoPlantio = historicoPlantioRes.data || []
    const historicoColheita = historicoColheitaRes.data || []
    const movimentacoes = movimentacoesRes.data || []
    const gastosCombustivel = gastosGeraisRes.data || []

    // Calcular totais dos históricos
    const combustivelPlantio = historicoPlantio.reduce((acc, p) => acc + (p.combustivel || 0), 0)
    const combustivelColheita = historicoColheita.reduce((acc, c) => acc + (c.combustivel || 0), 0)
    const totalCombustivelHistoricos = combustivelPlantio + combustivelColheita

    const horasPlantio = historicoPlantio.reduce((acc, p) => acc + (p.duracao_horas || 0), 0)
    const horasColheita = historicoColheita.reduce((acc, c) => acc + (c.duracao_horas || 0), 0)
    const totalHoras = horasPlantio + horasColheita

    // Calcular eficiência
    const eficienciaCalculada = totalHoras > 0 ? totalCombustivelHistoricos / totalHoras : 0

    // Verificar gastos de combustível
    const totalGastosCombustivel = gastosCombustivel.reduce((acc, g) => acc + (g.valor || 0), 0)

    // Verificar movimentações
    const entradasCombustivel = movimentacoes
      .filter(m => m.tipo === 'entrada')
      .reduce((acc, m) => acc + (m.quantidade || 0), 0)
    
    const saidasCombustivel = movimentacoes
      .filter(m => m.tipo === 'saida')
      .reduce((acc, m) => acc + (m.quantidade || 0), 0)

    const resultado = {
      // Dados dos históricos
      historico_plantio: {
        registros: historicoPlantio.length,
        combustivel_total: combustivelPlantio,
        horas_total: horasPlantio,
        detalhes: historicoPlantio.map(p => ({
          id: p.id,
          trator_id: p.trator_id,
          talhao_id: p.talhao_id,
          safra_id: p.safra_id,
          combustivel: p.combustivel,
          duracao_horas: p.duracao_horas,
          data_execucao: p.data_execucao
        }))
      },
      historico_colheita: {
        registros: historicoColheita.length,
        combustivel_total: combustivelColheita,
        horas_total: horasColheita,
        detalhes: historicoColheita.map(c => ({
          id: c.id,
          trator_id: c.trator_id,
          talhao_id: c.talhao_id,
          safra_id: c.safra_id,
          combustivel: c.combustivel,
          duracao_horas: c.duracao_horas,
          data_execucao: c.data_execucao
        }))
      },
      // Totais
      totais: {
        combustivel_total_historicos: totalCombustivelHistoricos,
        horas_total: totalHoras,
        eficiencia_calculada: Math.round(eficienciaCalculada * 100) / 100
      },
      // Gastos gerais
      gastos_combustivel: {
        registros: gastosCombustivel.length,
        valor_total: totalGastosCombustivel,
        detalhes: gastosCombustivel.map(g => ({
          id: g.id,
          valor: g.valor,
          referencia_id: g.referencia_id,
          referencia_tabela: g.referencia_tabela,
          descricao: g.descricao
        }))
      },
      // Movimentações
      movimentacoes: {
        registros: movimentacoes.length,
        entradas: entradasCombustivel,
        saidas: saidasCombustivel,
        saldo: entradasCombustivel - saidasCombustivel
      },
      // Análise da inconsistência
      analise: {
        problema_identificado: totalCombustivelHistoricos !== 1055 ? 'Dados diferentes dos esperados' : 'Dados corretos',
        combustivel_esperado_para_12_9_l_h: 12.9 * totalHoras,
        diferenca: totalCombustivelHistoricos - (12.9 * totalHoras),
        possiveis_causas: [
          'Dados de diferentes períodos sendo somados',
          'Filtros não aplicados corretamente',
          'Dados de teste misturados com dados reais',
          'Registros duplicados'
        ]
      }
    }

    console.log('✅ DEBUG - Análise de combustível concluída')

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro no debug de combustível:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
