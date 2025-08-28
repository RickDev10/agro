import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🔧 Iniciando ajuste para TOTAL GERAL = R$ 10M...')
    
    // Buscar todos os gastos
    const { data: gastos, error: gastosError } = await supabase
      .from('gastos_gerais')
      .select('*')
    
    if (gastosError) {
      throw gastosError
    }
    
    // Calcular total atual dos gastos que aparecem em analytics (excluindo uso)
    const gastosNaoUso = (gastos || []).filter(g => 
      g.tipo !== 'insumo' && 
      g.tipo !== 'combustivel' && 
      g.tipo !== 'insumos' && 
      g.tipo !== 'Combustível'
    )
    const totalAtual = gastosNaoUso.reduce((sum, g) => sum + (g.valor || 0), 0)
    
    const metaTotal = 10000000 // R$ 10M
    const fatorReducao = totalAtual > 0 ? metaTotal / totalAtual : 1
    
    console.log(`📊 Total atual: R$ ${(totalAtual / 1000000).toFixed(2)}M`)
    console.log(`🎯 Meta: R$ 10.00M`)
    console.log(`📉 Fator de redução: ${fatorReducao.toFixed(3)}`)
    
    let registrosAtualizados = 0
    
    // 1. Reduzir todos os gastos (exceto uso) pelo fator calculado
    for (const gasto of gastosNaoUso) {
      const valorNovo = Math.round(gasto.valor * fatorReducao * 100) / 100
      
      const { error: updateError } = await supabase
        .from('gastos_gerais')
        .update({ valor: valorNovo })
        .eq('id', gasto.id)
      
      if (updateError) {
        console.error(`Erro ao atualizar gasto ${gasto.id}:`, updateError)
      } else {
        registrosAtualizados++
      }
    }
    
    // 2. Agora ajustar os gastos de uso (safras) para serem proporcionais
    const gastosUso = gastos?.filter(g => g.tipo === 'insumo' || g.tipo === 'combustivel') || []
    const totalUsoAtual = gastosUso.reduce((sum, g) => sum + (g.valor || 0), 0)
    
    // Reduzir uso para que seja proporcional (ex: 30% do total = R$ 3M)
    const metaUso = metaTotal * 0.3 // 30% para uso das safras
    const fatorReducaoUso = metaUso / totalUsoAtual
    
    console.log(`📊 Total uso atual: R$ ${(totalUsoAtual / 1000000).toFixed(2)}M`)
    console.log(`🎯 Meta uso (30%): R$ ${(metaUso / 1000000).toFixed(2)}M`)
    console.log(`📉 Fator redução uso: ${fatorReducaoUso.toFixed(3)}`)
    
    for (const gasto of gastosUso) {
      const valorNovo = Math.round(gasto.valor * fatorReducaoUso * 100) / 100
      
      const { error: updateError } = await supabase
        .from('gastos_gerais')
        .update({ valor: valorNovo })
        .eq('id', gasto.id)
      
      if (updateError) {
        console.error(`Erro ao atualizar gasto uso ${gasto.id}:`, updateError)
      } else {
        registrosAtualizados++
      }
    }
    
    console.log('✅ Ajuste concluído!')
    console.log(`🔄 Registros atualizados: ${registrosAtualizados}`)
    
    return NextResponse.json({
      success: true,
      message: 'Valores ajustados para R$ 10M total',
      detalhes: {
        fatorReducaoGeral: fatorReducao,
        fatorReducaoUso: fatorReducaoUso,
        totalAntes: totalAtual,
        metaTotal: metaTotal,
        registrosAtualizados
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao ajustar valores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao ajustar valores para R$ 10M' },
      { status: 500 }
    )
  }
}
