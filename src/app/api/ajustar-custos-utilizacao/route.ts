import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // 1️⃣ BUSCAR DADOS ATUAIS
    const [gastosRes, manutencaoRes, insumosRes, combustivelRes] = await Promise.all([
      supabase.from('gastos_gerais').select('*'),
      supabase.from('manutencao').select('*'),
      supabase.from('insumos').select('*'),
      supabase.from('estoque_combustivel').select('*')
    ])

    if (gastosRes.error) throw gastosRes.error
    if (manutencaoRes.error) throw manutencaoRes.error
    if (insumosRes.error) throw insumosRes.error
    if (combustivelRes.error) throw combustivelRes.error

    const gastos = gastosRes.data || []
    const manutencoes = manutencaoRes.data || []
    const insumos = insumosRes.data || []
    const combustivel = combustivelRes.data || []

    // 2️⃣ CALCULAR TOTAIS ATUAIS
    const gastosCompraAdm = gastos.filter(g => 
      g.tipo !== 'insumo' && g.tipo !== 'combustivel' && 
      g.tipo !== 'insumos' && g.tipo !== 'Combustível'
    )
    const totalGastosAtual = gastosCompraAdm.reduce((acc, g) => acc + (g.valor || 0), 0)
    const totalManutencaoAtual = manutencoes.reduce((acc, m) => acc + (m.valor_total || 0), 0)
    const totalAtual = totalGastosAtual + totalManutencaoAtual

    console.log('📊 SITUAÇÃO ATUAL:')
    console.log(`Total gastos: R$ ${(totalGastosAtual / 1000000).toFixed(2)}M`)
    console.log(`Total manutenção: R$ ${(totalManutencaoAtual / 1000000).toFixed(2)}M`)
    console.log(`Total atual: R$ ${(totalAtual / 1000000).toFixed(2)}M`)

    // 3️⃣ CALCULAR FATOR DE AJUSTE PARA R$ 10M
    const metaTotal = 10000000 // R$ 10M
    const fatorReducao = totalAtual > 0 ? metaTotal / totalAtual : 1

    console.log(`🎯 Meta: R$ 10.00M`)
    console.log(`📉 Fator de ajuste: ${fatorReducao.toFixed(4)}`)

    // 4️⃣ AJUSTAR GASTOS E MANUTENÇÕES
    let gastosAtualizados = 0
    for (const gasto of gastosCompraAdm) {
      const novoValor = gasto.valor * fatorReducao
      const { error } = await supabase
        .from('gastos_gerais')
        .update({ valor: novoValor })
        .eq('id', gasto.id)
      
      if (error) {
        console.error(`Erro ao atualizar gasto ${gasto.id}:`, error)
        throw error
      }
      gastosAtualizados++
    }

    let manutencoesAtualizadas = 0
    for (const manutencao of manutencoes) {
      const novoValor = manutencao.valor_total * fatorReducao
      const { error } = await supabase
        .from('manutencao')
        .update({ valor_total: novoValor })
        .eq('id', manutencao.id)
      
      if (error) {
        console.error(`Erro ao atualizar manutenção ${manutencao.id}:`, error)
        throw error
      }
      manutencoesAtualizadas++
    }

    // 5️⃣ CALCULAR VALORES PARA 90% DE UTILIZAÇÃO
    const valorTotalInsumos = insumos.reduce((acc, i) => acc + (i.valor_total || 0), 0)
    const valorTotalCombustivel = combustivel.reduce((acc, c) => acc + (c.valor_total || 0), 0)
    
    const utilizacao90Insumos = valorTotalInsumos * 0.90
    const utilizacao90Combustivel = valorTotalCombustivel * 0.90
    
    // Dividir igualmente entre as 3 safras
    const valorInsumoPorSafra = utilizacao90Insumos / 3
    const valorCombustivelPorSafra = utilizacao90Combustivel / 3

    console.log('🔄 UTILIZAÇÃO 90%:')
    console.log(`Insumos total: R$ ${(valorTotalInsumos / 1000000).toFixed(2)}M`)
    console.log(`90% insumos: R$ ${(utilizacao90Insumos / 1000000).toFixed(2)}M`)
    console.log(`Por safra insumos: R$ ${(valorInsumoPorSafra / 1000000).toFixed(2)}M`)
    console.log(`Combustível total: R$ ${(valorTotalCombustivel / 1000000).toFixed(2)}M`)
    console.log(`90% combustível: R$ ${(utilizacao90Combustivel / 1000000).toFixed(2)}M`)
    console.log(`Por safra combustível: R$ ${(valorCombustivelPorSafra / 1000000).toFixed(2)}M`)

    // 6️⃣ BUSCAR AS 3 SAFRAS
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('id, safra')
      .order('id')
      .limit(3)

    if (safrasError) throw safrasError
    if (!safras || safras.length < 3) {
      throw new Error('Não foi possível encontrar 3 safras')
    }

    // 7️⃣ REMOVER GASTOS DE USO EXISTENTES
    const { error: deleteError } = await supabase
      .from('gastos_gerais')
      .delete()
      .in('tipo', ['insumo', 'combustivel', 'insumos', 'Combustível'])

    if (deleteError) throw deleteError

    // 8️⃣ CRIAR NOVOS GASTOS DE USO (90% dividido por 3 safras)
    const novosGastosUso = []
    
    for (const safra of safras) {
      // Gastos de insumos para cada safra
      novosGastosUso.push({
        tipo: 'insumo',
        descricao: `Uso de Insumos - ${safra.safra}`,
        valor: valorInsumoPorSafra,
        referencia_id: safra.id,
        referencia_tabela: 'safras',
        data: new Date().toISOString()
      })

      // Gastos de combustível para cada safra
      novosGastosUso.push({
        tipo: 'combustivel',
        descricao: `Uso de Combustível - ${safra.safra}`,
        valor: valorCombustivelPorSafra,
        referencia_id: safra.id,
        referencia_tabela: 'safras',
        data: new Date().toISOString()
      })
    }

    const { data: gastosInseridos, error: insertError } = await supabase
      .from('gastos_gerais')
      .insert(novosGastosUso)
      .select()

    if (insertError) throw insertError

    // 9️⃣ CALCULAR NOVO TOTAL
    const novoTotalGastos = gastosCompraAdm.reduce((acc, g) => acc + (g.valor * fatorReducao), 0)
    const novoTotalManutencao = manutencoes.reduce((acc, m) => acc + (m.valor_total * fatorReducao), 0)
    const novoTotal = novoTotalGastos + novoTotalManutencao

    return NextResponse.json({
      success: true,
      message: 'Custos ajustados com sucesso!',
      detalhes: {
        fatorReducao: fatorReducao.toFixed(4),
        totalAnterior: `R$ ${(totalAtual / 1000000).toFixed(2)}M`,
        totalNovo: `R$ ${(novoTotal / 1000000).toFixed(2)}M`,
        gastosAtualizados,
        manutencoesAtualizadas,
        gastosUsoInseridos: gastosInseridos?.length || 0,
        utilizacao: {
          insumosTotal: `R$ ${(valorTotalInsumos / 1000000).toFixed(2)}M`,
          utilizacao90Insumos: `R$ ${(utilizacao90Insumos / 1000000).toFixed(2)}M`,
          porSafraInsumos: `R$ ${(valorInsumoPorSafra / 1000000).toFixed(2)}M`,
          combustivelTotal: `R$ ${(valorTotalCombustivel / 1000000).toFixed(2)}M`,
          utilizacao90Combustivel: `R$ ${(utilizacao90Combustivel / 1000000).toFixed(2)}M`,
          porSafraCombustivel: `R$ ${(valorCombustivelPorSafra / 1000000).toFixed(2)}M`
        },
        safras: safras.map(s => s.safra)
      }
    })

  } catch (error) {
    console.error('Erro ao ajustar custos e utilização:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

