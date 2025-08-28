import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/dashboard/receita-gastos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }
    
    // Criar repositórios autenticados
    const safrasRepo = new AuthenticatedRepository('safras', userToken)
    const gastosRepo = new AuthenticatedRepository('gastos_gerais', userToken)
    
    // Buscar safras e gastos (com ordenação personalizada)
    const [safrasRes, gastosRes] = await Promise.all([
      safrasRepo.findAllWithOptions({ orderBy: 'data_inicio' }),
      gastosRepo.findAllWithOptions({ orderBy: 'data' })
    ])

    if (safrasRes.error) throw new Error(safrasRes.error)
    if (gastosRes.error) throw new Error(gastosRes.error)

    // Processar dados das safras
    const receitaGastosData = safrasRes.data?.map((safra: any) => {
      // Calcular gastos da safra (baseado em gastos_gerais relacionados)
      const gastosSafra = gastosRes.data?.filter((gasto: any) => {
        // Gastos relacionados a esta safra (pode ser por data ou referência)
        const gastoDate = new Date(gasto.data)
        const safraInicio = new Date(safra.data_inicio)
        const safraFim = safra.data_fim ? new Date(safra.data_fim) : new Date()
        
        return gastoDate >= safraInicio && gastoDate <= safraFim
      }) || []

      const totalGastos = gastosSafra.reduce((sum: number, gasto: any) => sum + gasto.valor, 0)
      
      return {
        mes: safra.safra,
        receita: safra.faturamento_total || 0,
        gastos: totalGastos,
        safra_id: safra.id,
        em_andamento: safra.em_andamento
      }
    }) || []

    // Se não há dados suficientes, criar dados de exemplo baseados nos dados reais
    if (receitaGastosData.length === 0) {
      // Buscar gastos por mês para criar dados de exemplo
      const gastosPorMes = gastosRes.data?.reduce((acc: any, gasto: any) => {
        const date = new Date(gasto.data)
        const mes = date.toLocaleString('pt-BR', { month: 'short' })
        
        if (!acc[mes]) {
          acc[mes] = { receita: 0, gastos: 0 }
        }
        acc[mes].gastos += gasto.valor
        return acc
      }, {}) || {}

      // Converter para array
      const dadosExemplo = Object.entries(gastosPorMes).map(([mes, dados]: [string, any]) => ({
        mes,
        receita: dados.receita,
        gastos: dados.gastos
      }))

      return NextResponse.json({ 
        success: true, 
        data: dadosExemplo 
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: receitaGastosData 
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de receita vs gastos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de receita vs gastos' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)


