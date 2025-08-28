import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todas as safras (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/safras - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('safras', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'data_inicio', ascending: false })
    
    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Safras encontradas (SEGURAS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar safras:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar safras' },
      { status: 500 }
    )
  }
}

// POST - Criar nova safra (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/safras - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { safra, data_inicio, data_fim, em_andamento, lucro_esperado, faturamento_esperado, faturamento_total, total_colhido, tipo_de_producao } = body

    if (!safra || !data_inicio) {
      return NextResponse.json(
        { success: false, error: 'Nome da safra e data de início são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('safras', userToken)
    const result = await repository.create({
      safra,
      data_inicio,
      data_fim: data_fim || null,
      em_andamento: em_andamento ?? true,
      lucro_esperado: lucro_esperado || 0,
      faturamento_esperado: faturamento_esperado || 0,
      faturamento_total: faturamento_total || 0,
      total_colhido: total_colhido || 0,
      tipo_de_producao: tipo_de_producao || 1
    })

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Safra criada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar safra:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar safra' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar safra (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/safras - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, safra, data_inicio, data_fim, em_andamento, lucro_esperado, faturamento_esperado, faturamento_total, total_colhido, tipo_de_producao } = body

    if (!id || !safra || !data_inicio) {
      return NextResponse.json(
        { success: false, error: 'ID, nome da safra e data de início são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('safras', userToken)
    const result = await repository.update(id, {
      safra,
      data_inicio,
      data_fim: data_fim || null,
      em_andamento: em_andamento ?? true,
      lucro_esperado: lucro_esperado || 0,
      faturamento_esperado: faturamento_esperado || 0,
      faturamento_total: faturamento_total || 0,
      total_colhido: total_colhido || 0,
      tipo_de_producao: tipo_de_producao || 1
    })

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Safra atualizada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar safra:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar safra' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir safra (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/safras - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('safras', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Safra excluída (SEGURA):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir safra:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir safra' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
