import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os tipos de produção (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/tipos-producao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('tipos_producao', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'nome_producao', ascending: true })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Tipos de produção encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar tipos de produção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tipos de produção' },
      { status: 500 }
    )
  }
}

// POST - Criar novo tipo de produção (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/tipos-producao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome_producao } = body

    if (!nome_producao) {
      return NextResponse.json(
        { success: false, error: 'Nome da produção é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('tipos_producao', userToken)
    const result = await repository.create({
      nome_producao
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Tipo de produção criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar tipo de produção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar tipo de produção' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar tipo de produção (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/tipos-producao - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome_producao } = body

    if (!id || !nome_producao) {
      return NextResponse.json(
        { success: false, error: 'ID e nome da produção são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('tipos_producao', userToken)
    const result = await repository.update(id, {
      nome_producao,
      updated_at: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Tipo de produção atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar tipo de produção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar tipo de produção' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir tipo de produção (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/tipos-producao - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('tipos_producao', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Tipo de produção excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir tipo de produção:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir tipo de produção' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
