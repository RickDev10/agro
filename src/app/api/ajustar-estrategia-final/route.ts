import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🎯 Estratégia Final: Total R$ 10M + Compras divididas por 3 safras')
    
    // Buscar gastos atuais
    const { data: gastos, error: gastosError } = await supabase
      .from('gastos_gerais')
      .select('*')
    
    if (gastosError) throw gastosError
    
    // Categorizar gastos
    let compras = 0
    let outrosGastos = 0
    let gastosUso = 0
    
    const gastosCompra = []
    const gastosOutros = []
    const gastosUsoArray = []
    
    for (const gasto of gastos || []) {
      const valor = gasto.valor || 0
      
      if (gasto.tipo === 'compra_insumo' || gasto.tipo === 'compra_combustivel') {
        compras += valor
        gastosCompra.push(gasto)
      } else if (gasto.tipo === 'insumo' || gasto.tipo === 'combustivel') {
        gastosUso += valor
        gastosUsoArray.push(gasto)
      } else {
        outrosGastos += valor
        gastosOutros.push(gasto)
      }
    }
    
    // Buscar manutenções
    const { data: manutencoes } = await supabase.from('manutencao').select('*')
    const totalManutencoes = (manutencoes || []).reduce((sum, m) => sum + (m.valor_total || 0), 0)
    
    const totalAtual = compras + outrosGastos + totalManutencoes
    const metaTotal = 10000000 // R$ 10M
    const fatorReducao = metaTotal / totalAtual
    
    console.log(`Total atual: R$ ${(totalAtual / 1000000).toFixed(2)}M`)
    console.log(`Fator redução: ${fatorReducao.toFixed(3)}`)
    
    // ETAPA 1: Reduzir compras e outros gastos proporcionalmente
    const novasCompras = compras * fatorReducao
    const novosOutros = outrosGastos * fatorReducao
    
    let atualizados = 0
    
    // Atualizar gastos de compra
    for (const gasto of gastosCompra) {
      const novoValor = Math.round(gasto.valor * fatorReducao * 100) / 100
      await supabase.from('gastos_gerais').update({ valor: novoValor }).eq('id', gasto.id)
      atualizados++
    }
    
    // Atualizar outros gastos
    for (const gasto of gastosOutros) {
      const novoValor = Math.round(gasto.valor * fatorReducao * 100) / 100
      await supabase.from('gastos_gerais').update({ valor: novoValor }).eq('id', gasto.id)
      atualizados++
    }
    
    // ETAPA 2: Ajustar gastos de uso das safras (compras ÷ 3)
    const valorPorSafra = novasCompras / 3 // Dividir compras por 3 safras
    const totalUsoAtual = gastosUso
    const fatorUso = valorPorSafra / (totalUsoAtual / 3) // Cada safra representa 1/3 do uso atual
    
    // Atualizar gastos de uso
    for (const gasto of gastosUsoArray) {
      const novoValor = Math.round(gasto.valor * fatorUso * 100) / 100
      await supabase.from('gastos_gerais').update({ valor: novoValor }).eq('id', gasto.id)
      atualizados++
    }
    
    console.log('✅ Ajuste concluído!')
    console.log(`Compras ajustadas: R$ ${(novasCompras / 1000000).toFixed(2)}M`)
    console.log(`Valor por safra: R$ ${(valorPorSafra / 1000000).toFixed(2)}M`)
    console.log(`Registros atualizados: ${atualizados}`)
    
    return NextResponse.json({
      success: true,
      message: 'Estratégia final aplicada com sucesso',
      detalhes: {
        totalAntes: totalAtual,
        totalDepois: metaTotal,
        comprasAjustadas: novasCompras,
        valorPorSafra: valorPorSafra,
        registrosAtualizados: atualizados
      }
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao aplicar estratégia final' },
      { status: 500 }
    )
  }
}

