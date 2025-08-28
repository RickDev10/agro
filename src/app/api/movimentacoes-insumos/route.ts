import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar movimentações de insumos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/movimentacoes-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('movimentacoes_insumos', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'data', ascending: false })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Movimentações de insumos encontradas (SEGURAS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar movimentações de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar movimentações de insumos' },
      { status: 500 }
    )
  }
}

// POST - Criar nova movimentação (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/movimentacoes-insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { insumo_id, tipo, quantidade, custo_unitario, observacao } = body

    if (!insumo_id || !tipo || !quantidade || !custo_unitario) {
      return NextResponse.json(
        { success: false, error: 'insumo_id, tipo, quantidade e custo_unitario são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo deve ser: entrada, saida ou ajuste' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('movimentacoes_insumos', userToken)
    const result = await repository.create({
      insumo_id,
      tipo,
      quantidade,
      custo_unitario,
      observacao: observacao || null,
      data: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Movimentação criada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar movimentação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar movimentação' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)