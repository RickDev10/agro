import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os talhões (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/talhoes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('talhoes', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'nome', ascending: true })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Talhões encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar talhões:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar talhões' },
      { status: 500 }
    )
  }
}

// POST - Criar novo talhão (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/talhoes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, area_hectares } = body

    if (!nome) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('talhoes', userToken)
    const result = await repository.create({
      nome,
      area_hectares: area_hectares || 0
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Talhão criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar talhão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar talhão' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar talhão (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/talhoes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome, area_hectares } = body

    if (!id || !nome) {
      return NextResponse.json(
        { success: false, error: 'ID e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('talhoes', userToken)
    const result = await repository.update(id, {
      nome,
      area_hectares: area_hectares || 0,
      updated_at: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Talhão atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar talhão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar talhão' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir talhão (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/talhoes - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('talhoes', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Talhão excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir talhão:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir talhão' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
