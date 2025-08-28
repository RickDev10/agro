import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar lotes de insumos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/lotes-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('lotes_insumos', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'data_compra', ascending: false })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Lotes de insumos encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar lotes de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lotes de insumos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo lote (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/lotes-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { insumo_id, quantidade, preco_unitario, data_compra } = body

    if (!insumo_id || !quantidade || !preco_unitario || !data_compra) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('lotes_insumos', userToken)
    const result = await repository.create({
      insumo_id,
      quantidade,
      preco_unitario,
      data_compra,
      atualizado_em: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Lote criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar lote:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar lote' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)