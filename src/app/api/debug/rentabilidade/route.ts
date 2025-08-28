import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createClient()
  
  try {
    console.log('🔍 Iniciando debugging de rentabilidade...')
    
    // 1. Verificar safras
    console.log('📊 Buscando safras...')
    const { data: safras, error: safrasError } = await supabase
      .from('safras')
      .select('*')
      .order('data_inicio', { ascending: false })
    
    if (safrasError) {
      console.error('❌ Erro ao buscar safras:', safrasError)
      throw safrasError
    }
    
    console.log('✅ Safras encontradas:', safras?.length || 0)
    console.log('📋 Dados das safras:', safras)
    
    // 2. Verificar gastos_gerais
    console.log('💰 Buscando gastos gerais...')
    const { data: gastosGerais, error: gastosError } = await supabase
      .from('gastos_gerais')
      .select('*')
      .order('data', { ascending: false })
    
    if (gastosError) {
      console.error('❌ Erro ao buscar gastos:', gastosError)
      throw gastosError
    }
    
    console.log('✅ Gastos encontrados:', gastosGerais?.length || 0)
    console.log('📋 Dados dos gastos:', gastosGerais)
    
    // 3. Verificar gastos por safra
    const gastosPorSafra: Record<number, any[]> = {}
    
    safras?.forEach(safra => {
      const gastosDaSafra = gastosGerais?.filter(gasto => 
        gasto.referencia_tabela === 'safras' && gasto.referencia_id === safra.id
      ) || []
      
      gastosPorSafra[safra.id] = gastosDaSafra
      console.log(`🔍 Safra ${safra.safra} (ID: ${safra.id}): ${gastosDaSafra.length} gastos`)
      console.log(`   Faturamento total: ${safra.faturamento_total || 0}`)
      console.log(`   Gastos:`, gastosDaSafra)
    })
    
    // 4. Calcular métricas de exemplo
    const exemploCalculo = safras?.map(safra => {
      const gastosDaSafra = gastosPorSafra[safra.id] || []
      const receitaTotal = safra.faturamento_total || 0
      const custosPorCategoria = gastosDaSafra.reduce((acc, gasto) => {
        acc[gasto.tipo] = (acc[gasto.tipo] || 0) + gasto.valor
        return acc
      }, {} as Record<string, number>)
      
      const custosTotais = Object.values(custosPorCategoria).reduce((a, b) => a + b, 0)
      const lucroLiquido = receitaTotal - custosTotais
      
      console.log(`📈 Cálculo para safra ${safra.safra}:`)
      console.log(`   Receita: ${receitaTotal}`)
      console.log(`   Custos por categoria:`, custosPorCategoria)
      console.log(`   Custos totais: ${custosTotais}`)
      console.log(`   Lucro líquido: ${lucroLiquido}`)
      
      return {
        safra: safra.safra,
        safra_id: safra.id,
        receita_total: receitaTotal,
        custos_totais: custosTotais,
        custos_por_categoria: custosPorCategoria,
        lucro_liquido: lucroLiquido,
        gastos_count: gastosDaSafra.length
      }
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        safras_count: safras?.length || 0,
        gastos_count: gastosGerais?.length || 0,
        safras: safras,
        gastos_gerais: gastosGerais,
        gastos_por_safra: gastosPorSafra,
        exemplo_calculo: exemploCalculo
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no debugging:', error)
    return NextResponse.json(
      { success: false, error: 'Erro no debugging' },
      { status: 500 }
    )
  }
}
