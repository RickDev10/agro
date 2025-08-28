import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os tratores (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/tratores - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('tratores', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'nome', ascending: true })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Tratores encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar tratores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tratores' },
      { status: 500 }
    )
  }
}

// POST - Criar novo trator (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/tratores - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, tempo_prox_manutencao, em_manutencao } = body

    if (!nome) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('tratores', userToken)
    const result = await repository.create({
      nome,
      tempo_prox_manutencao: tempo_prox_manutencao || 0,
      em_manutencao: em_manutencao || false
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Trator criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar trator:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar trator' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar trator (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/tratores - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome, tempo_prox_manutencao, em_manutencao } = body

    if (!id || !nome) {
      return NextResponse.json(
        { success: false, error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('tratores', userToken)
    const result = await repository.update(id, {
      nome,
      tempo_prox_manutencao: tempo_prox_manutencao || 0,
      em_manutencao: em_manutencao || false,
      updated_at: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Trator atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar trator:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar trator' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir trator (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/tratores - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('tratores', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Trator excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir trator:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir trator' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
