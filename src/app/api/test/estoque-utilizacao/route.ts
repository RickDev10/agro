import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()

  try {
    console.log('🔍 Testando cálculos de estoque e utilização...')

    // 1. Verificar movimentações de combustível
    const { data: comprasCombustivel, error: comprasCombustivelError } = await supabase
      .from('movimentacoes_combustivel')
      .select('*')
      .eq('tipo', 'entrada')

    if (comprasCombustivelError) throw comprasCombustivelError

    const { data: saidasCombustivel, error: saidasCombustivelError } = await supabase
      .from('movimentacoes_combustivel')
      .select('*')
      .eq('tipo', 'saida')

    if (saidasCombustivelError) throw saidasCombustivelError

    // 2. Verificar movimentações de insumos
    const { data: comprasInsumos, error: comprasInsumosError } = await supabase
      .from('movimentacoes_insumos')
      .select('*')
      .eq('tipo', 'entrada')

    if (comprasInsumosError) throw comprasInsumosError

    const { data: saidasInsumos, error: saidasInsumosError } = await supabase
      .from('movimentacoes_insumos')
      .select('*')
      .eq('tipo', 'saida')

    if (saidasInsumosError) throw saidasInsumosError

    // 3. Calcular totais de combustível
    const totalCompradoCombustivel = comprasCombustivel?.reduce((acc, compra) => 
      acc + ((compra.quantidade || 0) * (compra.custo_unitario || 0)), 0) || 0

    const totalUtilizadoCombustivel = saidasCombustivel?.reduce((acc, mov) => 
      acc + ((mov.quantidade || 0) * (mov.custo_unitario || 0)), 0) || 0

    const percentualUtilizacaoCombustivel = totalCompradoCombustivel > 0 
      ? (totalUtilizadoCombustivel / totalCompradoCombustivel) * 100 
      : 0

    // 4. Calcular totais de insumos
    const totalCompradoInsumos = comprasInsumos?.reduce((acc, compra) => 
      acc + ((compra.quantidade || 0) * (compra.custo_unitario || 0)), 0) || 0

    const totalUtilizadoInsumos = saidasInsumos?.reduce((acc, mov) => 
      acc + ((mov.quantidade || 0) * (mov.custo_unitario || 0)), 0) || 0

    const percentualUtilizacaoInsumos = totalCompradoInsumos > 0 
      ? (totalUtilizadoInsumos / totalCompradoInsumos) * 100 
      : 0

    // 5. Verificar histórico de plantio e colheita
    const { data: historicoPlantio, error: historicoPlantioError } = await supabase
      .from('historico_plantio')
      .select('id, insumos, combustivel, safra_id')
      .limit(10)

    if (historicoPlantioError) throw historicoPlantioError

    const { data: historicoColheita, error: historicoColheitaError } = await supabase
      .from('historico_colheita')
      .select('id, combustivel, safra_id')
      .limit(10)

    if (historicoColheitaError) throw historicoColheitaError

    // 6. Verificar gastos gerais
    const { data: gastosGerais, error: gastosGeraisError } = await supabase
      .from('gastos_gerais')
      .select('*')
      .in('tipo', ['insumo', 'combustivel'])

    if (gastosGeraisError) throw gastosGeraisError

    // 7. Verificar safras
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('*')

    if (safrasError) throw safrasError

    return NextResponse.json({
      success: true,
      dados: {
        // Dados brutos
        compras_combustivel: comprasCombustivel,
        saidas_combustivel: saidasCombustivel,
        compras_insumos: comprasInsumos,
        saidas_insumos: saidasInsumos,
        historico_plantio: historicoPlantio,
        historico_colheita: historicoColheita,
        gastos_gerais: gastosGerais,
        safras: safras,

        // Cálculos detalhados
        combustivel: {
          total_comprado: totalCompradoCombustivel,
          total_utilizado: totalUtilizadoCombustivel,
          sobra: totalCompradoCombustivel - totalUtilizadoCombustivel,
          percentual_utilizacao: Math.round(percentualUtilizacaoCombustivel * 100) / 100,
          quantidade_compras: comprasCombustivel?.length || 0,
          quantidade_saidas: saidasCombustivel?.length || 0
        },

        insumos: {
          total_comprado: totalCompradoInsumos,
          total_utilizado: totalUtilizadoInsumos,
          sobra: totalCompradoInsumos - totalUtilizadoInsumos,
          percentual_utilizacao: Math.round(percentualUtilizacaoInsumos * 100) / 100,
          quantidade_compras: comprasInsumos?.length || 0,
          quantidade_saidas: saidasInsumos?.length || 0
        },

        // Resumo geral (igual ao da API original)
        resumo_geral: [
          {
            tipo: 'combustivel',
            total_comprado: totalCompradoCombustivel,
            total_utilizado: totalUtilizadoCombustivel,
            sobra: totalCompradoCombustivel - totalUtilizadoCombustivel,
            percentual_utilizacao: Math.round(percentualUtilizacaoCombustivel * 100) / 100
          },
          {
            tipo: 'insumos',
            total_comprado: totalCompradoInsumos,
            total_utilizado: totalUtilizadoInsumos,
            sobra: totalCompradoInsumos - totalUtilizadoInsumos,
            percentual_utilizacao: Math.round(percentualUtilizacaoInsumos * 100) / 100
          }
        ]
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json(
      { success: false, error: 'Erro no teste' },
      { status: 500 }
    )
  }
}
