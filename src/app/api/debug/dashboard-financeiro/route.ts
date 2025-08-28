import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    console.log('🔍 Debug Dashboard Financeiro...')

    // Buscar dados básicos
    const [safrasRes, talhoesRes, gastosRes] = await Promise.all([
      supabase.from('safras').select('*'),
      supabase.from('talhoes').select('*'),
      supabase.from('gastos_gerais').select('*')
    ])

    console.log('📊 Resultados das consultas:')
    console.log('Safras:', safrasRes)
    console.log('Talhões:', talhoesRes)
    console.log('Gastos:', gastosRes)

    if (safrasRes.error) {
      console.error('❌ Erro safras:', safrasRes.error)
    }
    if (talhoesRes.error) {
      console.error('❌ Erro talhões:', talhoesRes.error)
    }
    if (gastosRes.error) {
      console.error('❌ Erro gastos:', gastosRes.error)
    }

    const safras = safrasRes.data || []
    const talhoes = talhoesRes.data || []
    const gastos = gastosRes.data || []

    console.log('📈 Dados encontrados:')
    console.log('Safras:', safras.length, 'registros')
    console.log('Talhões:', talhoes.length, 'registros')
    console.log('Gastos:', gastos.length, 'registros')

    if (safras.length > 0) {
      console.log('📋 Primeira safra:', safras[0])
    }
    if (talhoes.length > 0) {
      console.log('📋 Primeiro talhão:', talhoes[0])
    }
    if (gastos.length > 0) {
      console.log('📋 Primeiro gasto:', gastos[0])
    }

    // Calcular KPIs básicos
    const totalReceita = safras.reduce((acc, safra) => acc + (safra.receita_total || 0), 0)
    const totalCustos = gastos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
    const totalLucro = totalReceita - totalCustos

    console.log('💰 KPIs calculados:')
    console.log('Total Receita:', totalReceita)
    console.log('Total Custos:', totalCustos)
    console.log('Total Lucro:', totalLucro)

    return NextResponse.json({
      success: true,
      debug: {
        safras: {
          count: safras.length,
          data: safras.slice(0, 3), // Primeiros 3 registros
          error: safrasRes.error
        },
        talhoes: {
          count: talhoes.length,
          data: talhoes.slice(0, 3), // Primeiros 3 registros
          error: talhoesRes.error
        },
        gastos: {
          count: gastos.length,
          data: gastos.slice(0, 3), // Primeiros 3 registros
          error: gastosRes.error
        },
        kpis: {
          totalReceita,
          totalCustos,
          totalLucro
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
