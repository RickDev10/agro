import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os plantios (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/plantio - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data, error } = await client
      .from('historico_plantio')
      .select(`
        *,
        tipo_producao:tipos_producao(id,nome_producao),
        safra:safras(id,safra),
        talhao:talhoes(id,nome),
        trator:tratores(id,nome),
        funcionario:funcionarios(id,nome)
      `)
      .order('data_execucao', { ascending: false })

    if (error) {
      throw error
    }

    console.log('✅ Plantios encontrados (SEGUROS):', data?.length || 0)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar plantios:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar plantios' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plantio (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/plantio - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      tipo_producao_id, 
      safra_id, 
      talhao_id, 
      trator_id, 
      funcionario_id, 
      data_execucao, 
      status_execucao,
      observacoes 
    } = body

    // Validações básicas
    if (!tipo_producao_id || !safra_id || !talhao_id || !data_execucao) {
      return NextResponse.json(
        { success: false, error: 'Tipo de produção, safra, talhão e data de execução são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('historico_plantio', userToken)
    const result = await repository.create({
      tipo_producao_id,
      safra_id,
      talhao_id,
      trator_id,
      funcionario_id,
      data_execucao,
      status_execucao: status_execucao || 'Pendente',
      observacoes: observacoes || ''
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Buscar o registro criado com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data: fullData, error: relationsError } = await client
      .from('historico_plantio')
      .select(`
        *,
        tipo_producao:tipos_producao(id,nome_producao),
        safra:safras(id,safra),
        talhao:talhoes(id,nome),
        trator:tratores(id,nome),
        funcionario:funcionarios(id,nome)
      `)
      .eq('id', (result.data as any).id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Plantio criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao criar plantio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar plantio' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar plantio (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/plantio - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      tipo_producao_id, 
      safra_id, 
      talhao_id, 
      trator_id, 
      funcionario_id, 
      data_execucao, 
      status_execucao,
      observacoes 
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('historico_plantio', userToken)
    const result = await repository.update(id, {
      tipo_producao_id,
      safra_id,
      talhao_id,
      trator_id,
      funcionario_id,
      data_execucao,
      status_execucao,
      observacoes,
      updated_at: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Buscar o registro atualizado com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data: fullData, error: relationsError } = await client
      .from('historico_plantio')
      .select(`
        *,
        tipo_producao:tipos_producao(id,nome_producao),
        safra:safras(id,safra),
        talhao:talhoes(id,nome),
        trator:tratores(id,nome),
        funcionario:funcionarios(id,nome)
      `)
      .eq('id', id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Plantio atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao atualizar plantio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar plantio' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir plantio (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/plantio - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('historico_plantio', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Plantio excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir plantio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir plantio' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
