import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de manutenções (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/manutencoes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      tratorId: searchParams.get('tratorId'),
      tipoManutencao: searchParams.get('tipoManutencao'),
      valorMinimo: searchParams.get('valorMinimo'),
      valorMaximo: searchParams.get('valorMaximo')
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    let query = client
      .from('manutencao')
      .select(`
        *,
        trator:tratores(id,nome)
      `)

    // Aplicar filtros dinamicamente
    if (filters.dataInicio) {
      query = query.gte('data_manutencao', filters.dataInicio)
    }
    if (filters.dataFim) {
      query = query.lte('data_manutencao', filters.dataFim)
    }
    if (filters.tratorId) {
      query = query.eq('trator_id', filters.tratorId)
    }
    if (filters.valorMinimo) {
      query = query.gte('valor_total', filters.valorMinimo)
    }
    if (filters.valorMaximo) {
      query = query.lte('valor_total', filters.valorMaximo)
    }

    const { data, error, count } = await query
      .order('data_manutencao', { ascending: false })

    if (error) {
      console.error('❌ Erro Supabase:', error)
      throw error
    }

    console.log('✅ Relatório de manutenções gerado (SEGURO):', data?.length || 0, 'registros')
    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de manutenções:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de manutenções' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
