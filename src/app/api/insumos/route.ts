import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os insumos com dados da tabela (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('insumos', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'insumo', ascending: true })
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Calcular valor total de todos os insumos
    const insumos = result.data || []
    const valorTotalGeral = insumos.reduce((total, insumo: any) => {
      return total + (insumo.valor_total || 0)
    }, 0)

    // Retornar insumos com valor total geral
    const resultado = {
      insumos: insumos,
      valorTotalGeral: valorTotalGeral
    }

    console.log('✅ Insumos encontrados (SEGUROS):', insumos.length)
    return NextResponse.json({ success: true, data: resultado })
  } catch (error) {
    console.error('❌ Erro ao buscar insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar insumos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo insumo (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { insumo, medida } = body

    const repository = new AuthenticatedRepository('insumos', userToken)

    // Verificar se já existe um insumo com o mesmo nome e medida (com RLS aplicado)
    const existingResult = await repository.findAll({ insumo, medida })
    
    if (existingResult.error) {
      throw new Error(existingResult.error)
    }

    if (existingResult.data && existingResult.data.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Já existe um insumo "${insumo}" com a medida "${medida}". Use um nome diferente ou uma medida diferente.` 
        },
        { status: 400 }
      )
    }

    const result = await repository.create({
      insumo,
      medida,
      qnt_total: 0,
      valor_total: 0,
      valor_por_medida: 0
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Insumo criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar insumo' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar insumo (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, insumo, medida } = body

    const repository = new AuthenticatedRepository('insumos', userToken)

    // Verificar se já existe outro insumo com o mesmo nome e medida (com RLS aplicado)
    const existingResult = await repository.findAll({ insumo, medida })
    
    if (existingResult.error) {
      throw new Error(existingResult.error)
    }

    // Filtrar para excluir o item atual da verificação
    const conflictingItems = existingResult.data?.filter((item: any) => item.id !== id) || []
    
    if (conflictingItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Já existe um insumo "${insumo}" com a medida "${medida}". Use um nome diferente ou uma medida diferente.` 
        },
        { status: 400 }
      )
    }

    const result = await repository.update(id, {
      insumo,
      medida,
      qnt_total: 0,
      valor_total: 0,
      valor_por_medida: 0
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Insumo atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar insumo' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir insumo (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/insumos - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('insumos', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Insumo excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir insumo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir insumo' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
