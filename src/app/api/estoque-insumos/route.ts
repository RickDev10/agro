import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar estoque de insumos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/estoque-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('estoque_insumos', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'atualizado_em', ascending: false })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Estoque de insumos encontrado (SEGURO):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar estoque de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estoque de insumos' },
      { status: 500 }
    )
  }
}

// POST - Criar/Atualizar estoque (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/estoque-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { insumo_id, quantidade } = body

    if (!insumo_id || quantidade === undefined) {
      return NextResponse.json(
        { success: false, error: 'insumo_id e quantidade são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('estoque_insumos', userToken)
    const result = await repository.create({
      insumo_id,
      quantidade,
      atualizado_em: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Estoque criado/atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar/atualizar estoque:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar/atualizar estoque' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)