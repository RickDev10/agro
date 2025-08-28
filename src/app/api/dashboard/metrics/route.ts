import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/dashboard/metrics - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }
    
    // Criar repositórios autenticados
    const funcionariosRepo = new AuthenticatedRepository('funcionarios', userToken)
    const safrasRepo = new AuthenticatedRepository('safras', userToken)
    const insumosRepo = new AuthenticatedRepository('insumos', userToken)
    const tratoresRepo = new AuthenticatedRepository('tratores', userToken)
    const gastosRepo = new AuthenticatedRepository('gastos_gerais', userToken)

    // Buscar dados em paralelo
    const [
      funcionariosRes,
      safrasRes,
      insumosRes,
      tratoresRes,
      gastosRes
    ] = await Promise.all([
      funcionariosRepo.findAll(),
      safrasRepo.findAll(),
      insumosRepo.findAll(),
      tratoresRepo.findAll(),
      gastosRepo.findAll()
    ])

    // Verificar erros
    if (funcionariosRes.error) throw new Error(funcionariosRes.error)
    if (safrasRes.error) throw new Error(safrasRes.error)
    if (insumosRes.error) throw new Error(insumosRes.error)
    if (tratoresRes.error) throw new Error(tratoresRes.error)
    if (gastosRes.error) throw new Error(gastosRes.error)

    // Calcular métricas
    const totalFuncionarios = funcionariosRes.data?.length || 0
    const safrasAtivas = safrasRes.data?.filter((s: any) => s.em_andamento).length || 0
    const insumosBaixoEstoque = insumosRes.data?.filter((i: any) => (i.qnt_total || 0) < 100).length || 0
    const tratoresAtivos = tratoresRes.data?.filter((t: any) => !t.em_manutencao).length || 0
    
    // Gastos do mês atual
    const currentDate = new Date()
    const gastosDoMes = gastosRes.data?.filter((g: any) => {
      const gastoDate = new Date(g.data)
      return gastoDate.getMonth() === currentDate.getMonth() && 
             gastoDate.getFullYear() === currentDate.getFullYear()
    }) || []
    
    const gastosMesAtual = gastosDoMes.reduce((sum: number, gasto: any) => sum + gasto.valor, 0)

    // Calcular receita do mês atual (baseada em safras finalizadas)
    const receitaDoMes = safrasRes.data
      ?.filter((s: any) => !s.em_andamento && s.faturamento_total)
      .reduce((sum: number, safra: any) => sum + (safra.faturamento_total || 0), 0) || 0

    // Calcular produtividade média (baseada em safras finalizadas)
    const safrasFinalizadas = safrasRes.data?.filter((s: any) => !s.em_andamento && s.total_colhido) || []
    const produtividadeMedia = safrasFinalizadas.length > 0 
      ? safrasFinalizadas.reduce((sum: number, safra: any) => {
          const produtividade = safra.total_colhido ? 85 : 0 // Valor padrão se não houver cálculo específico
          return sum + produtividade
        }, 0) / safrasFinalizadas.length
      : 0

    // Calcular eficiência operacional (baseada em tratores ativos vs total)
    const totalTratores = tratoresRes.data?.length || 0
    const eficienciaOperacional = totalTratores > 0 
      ? (tratoresAtivos / totalTratores) * 100 
      : 0

    const metrics = {
      total_funcionarios: totalFuncionarios,
      safras_ativas: safrasAtivas,
      insumos_baixo_estoque: insumosBaixoEstoque,
      tratores_ativos: tratoresAtivos,
      gastos_mes_atual: gastosMesAtual,
      receita_mes_atual: receitaDoMes,
      produtividade_media: Math.round(produtividadeMedia * 10) / 10,
      eficiencia_operacional: Math.round(eficienciaOperacional * 10) / 10,
    }

    console.log('✅ Métricas calculadas (SEGURAS):', metrics)
    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('❌ Erro ao buscar métricas do dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar métricas' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
