import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🔧 Iniciando ajuste de valores para R$ 10M total das safras...')
    
    // Fator de multiplicação calculado: 10M / 2.54M = 3.94
    const fatorMultiplicacao = 3.94
    
    // Buscar todos os gastos de USO (insumo e combustivel)
    const { data: gastos, error: gastosError } = await supabase
      .from('gastos_gerais')
      .select('*')
      .in('tipo', ['insumo', 'combustivel'])
    
    if (gastosError) {
      throw gastosError
    }
    
    console.log(`📊 Encontrados ${gastos?.length || 0} gastos de uso para ajustar`)
    
    let totalAntes = 0
    let totalDepois = 0
    let registrosAtualizados = 0
    
    // Atualizar cada gasto multiplicando por 3.94
    for (const gasto of gastos || []) {
      const valorAntigo = gasto.valor || 0
      const valorNovo = Math.round(valorAntigo * fatorMultiplicacao * 100) / 100 // Arredondar para 2 casas decimais
      
      totalAntes += valorAntigo
      totalDepois += valorNovo
      
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
    
    console.log('✅ Ajuste concluído!')
    console.log(`📈 Total antes: R$ ${(totalAntes / 1000000).toFixed(2)}M`)
    console.log(`📈 Total depois: R$ ${(totalDepois / 1000000).toFixed(2)}M`)
    console.log(`🔄 Registros atualizados: ${registrosAtualizados}`)
    
    return NextResponse.json({
      success: true,
      message: 'Valores ajustados com sucesso',
      detalhes: {
        fatorMultiplicacao,
        totalAntes: totalAntes,
        totalDepois: totalDepois,
        registrosAtualizados
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao ajustar valores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao ajustar valores das safras' },
      { status: 500 }
    )
  }
}

