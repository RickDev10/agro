import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de plantio (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/plantio - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      safraId: searchParams.get('safraId'),
      tipoProducaoId: searchParams.get('tipoProducaoId'),
      funcionarioId: searchParams.get('funcionarioId'),
      talhaoId: searchParams.get('talhaoId'),
      tratorId: searchParams.get('tratorId'),
      statusExecucao: searchParams.get('statusExecucao'),
      valorMinimo: searchParams.get('valorMinimo'),
      valorMaximo: searchParams.get('valorMaximo')
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    let query = client
      .from('historico_plantio')
      .select(`
        *,
        tipo_producao:tipos_producao(id,nome_producao),
        safra:safras(id,safra),
        talhao:talhoes(id,nome),
        trator:tratores(id,nome),
        funcionario:funcionarios(id,nome)
      `)

    // Aplicar filtros dinamicamente
    if (filters.dataInicio) {
      query = query.gte('data_execucao', filters.dataInicio)
    }
    if (filters.dataFim) {
      query = query.lte('data_execucao', filters.dataFim)
    }
    if (filters.safraId) {
      query = query.eq('safra_id', filters.safraId)
    }
    if (filters.tipoProducaoId) {
      query = query.eq('tipo_de_producao', filters.tipoProducaoId)
    }
    if (filters.funcionarioId) {
      query = query.eq('funcionario_id', filters.funcionarioId)
    }
    if (filters.talhaoId) {
      query = query.eq('talhao_id', filters.talhaoId)
    }
    if (filters.tratorId) {
      query = query.eq('trator_id', filters.tratorId)
    }
    if (filters.statusExecucao) {
      query = query.eq('status_execucao', filters.statusExecucao)
    }

    const { data, error, count } = await query
      .order('data_execucao', { ascending: false })

    if (error) {
      console.error('❌ Erro Supabase:', error)
      throw error
    }

    console.log('✅ Relatório de plantio gerado (SEGURO):', data?.length || 0, 'registros')
    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de plantio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de plantio' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
