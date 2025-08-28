import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todas as manutenções (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/manutencao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data, error } = await client
      .from('manutencao')
      .select(`
        *,
        trator:tratores(id,nome)
      `)
      .order('data_manutencao', { ascending: false })

    if (error) {
      throw error
    }

    console.log('✅ Manutenções encontradas (SEGURAS):', data?.length || 0)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar manutenções:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar manutenções' },
      { status: 500 }
    )
  }
}

// POST - Criar nova manutenção (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/manutencao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      trator_id, 
      data_manutencao, 
      tipo_manutencao, 
      descricao, 
      custo, 
      status_manutencao,
      observacoes 
    } = body

    // Validações básicas
    if (!trator_id || !data_manutencao || !tipo_manutencao) {
      return NextResponse.json(
        { success: false, error: 'Trator, data de manutenção e tipo de manutenção são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('manutencao', userToken)
    const result = await repository.create({
      trator_id,
      data_manutencao,
      tipo_manutencao,
      descricao: descricao || '',
      custo: custo || 0,
      status_manutencao: status_manutencao || 'Pendente',
      observacoes: observacoes || ''
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Buscar o registro criado com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data: fullData, error: relationsError } = await client
      .from('manutencao')
      .select(`
        *,
        trator:tratores(id,nome)
      `)
      .eq('id', (result.data as any).id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Manutenção criada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao criar manutenção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar manutenção' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar manutenção (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/manutencao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      trator_id, 
      data_manutencao, 
      tipo_manutencao, 
      descricao, 
      custo, 
      status_manutencao,
      observacoes 
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('manutencao', userToken)
    const result = await repository.update(id, {
      trator_id,
      data_manutencao,
      tipo_manutencao,
      descricao,
      custo,
      status_manutencao,
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
      .from('manutencao')
      .select(`
        *,
        trator:tratores(id,nome)
      `)
      .eq('id', id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Manutenção atualizada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao atualizar manutenção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar manutenção' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir manutenção (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/manutencao - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('manutencao', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Manutenção excluída (SEGURA):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir manutenção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir manutenção' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
