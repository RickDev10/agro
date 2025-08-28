import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de gastos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/gastos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      funcionarioId: searchParams.get('funcionarioId'),
      tipoGasto: searchParams.get('tipoGasto'),
      valorMinimo: searchParams.get('valorMinimo'),
      valorMaximo: searchParams.get('valorMaximo')
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    let query = client
      .from('gastos_funcionario')
      .select(`
        *,
        funcionario:funcionarios(id,nome)
      `)

    // Aplicar filtros dinamicamente
    if (filters.dataInicio) {
      query = query.gte('data_pgmto', filters.dataInicio)
    }
    if (filters.dataFim) {
      query = query.lte('data_pgmto', filters.dataFim)
    }
    if (filters.funcionarioId) {
      query = query.eq('funcionario_id', filters.funcionarioId)
    }
    if (filters.valorMinimo) {
      query = query.gte('valor_pago', filters.valorMinimo)
    }
    if (filters.valorMaximo) {
      query = query.lte('valor_pago', filters.valorMaximo)
    }

    const { data, error, count } = await query
      .order('data_pgmto', { ascending: false })

    if (error) {
      console.error('❌ Erro Supabase:', error)
      throw error
    }

    console.log('✅ Relatório de gastos gerado (SEGURO):', data?.length || 0, 'registros')
    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de gastos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de gastos' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
