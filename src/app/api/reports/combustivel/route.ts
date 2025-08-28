import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de combustível (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/combustivel - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const dataInicio = url.searchParams.get('dataInicio')
    const dataFim = url.searchParams.get('dataFim')
    const safraId = url.searchParams.get('safraId')
    const tratorId = url.searchParams.get('tratorId')
    const funcionarioId = url.searchParams.get('funcionarioId')
    const talhaoId = url.searchParams.get('talhaoId')
    const valorMinimo = url.searchParams.get('valorMinimo')
    const valorMaximo = url.searchParams.get('valorMaximo')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Construir query base
    let query = client
      .from('movimentacoes_combustivel')
      .select('*')

    // Aplicar filtros de data
    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }
    if (dataFim) {
      query = query.lte('data', dataFim)
    }

    // Aplicar filtros de valor
    if (valorMinimo) {
      query = query.gte('custo_unitario', parseFloat(valorMinimo))
    }
    if (valorMaximo) {
      query = query.lte('custo_unitario', parseFloat(valorMaximo))
    }

    // Se há filtros específicos (safra, trator, funcionário, talhão)
    const hasSpecificFilters = safraId || tratorId || funcionarioId || talhaoId

    if (hasSpecificFilters) {
      // Buscar IDs de operações que atendem aos filtros
      const operacaoIds = []

      if (safraId || tratorId || funcionarioId || talhaoId) {
        // Buscar em historico_plantio
        let plantioQuery = client
          .from('historico_plantio')
          .select('id')

        if (safraId) plantioQuery = plantioQuery.eq('safra_id', parseInt(safraId))
        if (tratorId) plantioQuery = plantioQuery.eq('trator_id', parseInt(tratorId))
        if (funcionarioId) plantioQuery = plantioQuery.eq('funcionario_id', parseInt(funcionarioId))
        if (talhaoId) plantioQuery = plantioQuery.eq('talhao_id', parseInt(talhaoId))

        const { data: plantioIds } = await plantioQuery
        if (plantioIds) {
          operacaoIds.push(...plantioIds.map(p => p.id))
        }

        // Buscar em historico_colheita
        let colheitaQuery = client
          .from('historico_colheita')
          .select('id')

        if (safraId) colheitaQuery = colheitaQuery.eq('safra_id', parseInt(safraId))
        if (tratorId) colheitaQuery = colheitaQuery.eq('trator_id', parseInt(tratorId))
        if (funcionarioId) colheitaQuery = colheitaQuery.eq('funcionario_id', parseInt(funcionarioId))
        if (talhaoId) colheitaQuery = colheitaQuery.eq('talhao_id', parseInt(talhaoId))

        const { data: colheitaIds } = await colheitaQuery
        if (colheitaIds) {
          operacaoIds.push(...colheitaIds.map(c => c.id))
        }
      }

      // Filtrar movimentações que referenciam essas operações
      if (operacaoIds.length > 0) {
        query = query.in('referencia_id', operacaoIds)
      } else {
        // Se não há operações que atendem aos filtros, retornar vazio
        console.log('✅ Relatório de combustível gerado (SEGURO): 0 registros (sem operações que atendem aos filtros)')
        return NextResponse.json({ success: true, data: [] })
      }
    }

    // Executar query
    const { data, error } = await query.order('data', { ascending: false })

    if (error) {
      throw error
    }

    console.log('✅ Relatório de combustível gerado (SEGURO):', data?.length || 0, 'registros')
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar dados de combustível para relatório:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de combustível' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
