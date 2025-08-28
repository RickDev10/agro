import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os gastos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/gastos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data, error } = await client
      .from('gastos_funcionario')
      .select(`
        *,
        funcionario:funcionarios(id,nome)
      `)
      .order('data_pgmto', { ascending: false })

    if (error) {
      throw error
    }

    console.log('✅ Gastos encontrados (SEGUROS):', data?.length || 0)
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar gastos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar gastos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo gasto (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/gastos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      funcionario_id, 
      data_pgmto, 
      valor_pgmto, 
      tipo_pgmto, 
      descricao,
      observacoes 
    } = body

    // Validações básicas
    if (!funcionario_id || !data_pgmto || !valor_pgmto || !tipo_pgmto) {
      return NextResponse.json(
        { success: false, error: 'Funcionário, data de pagamento, valor e tipo de pagamento são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('gastos_funcionario', userToken)
    const result = await repository.create({
      funcionario_id,
      data_pgmto,
      valor_pgmto,
      tipo_pgmto,
      descricao: descricao || '',
      observacoes: observacoes || ''
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Buscar o registro criado com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { data: fullData, error: relationsError } = await client
      .from('gastos_funcionario')
      .select(`
        *,
        funcionario:funcionarios(id,nome)
      `)
      .eq('id', (result.data as any).id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Gasto criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao criar gasto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar gasto' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar gasto (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/gastos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      funcionario_id, 
      data_pgmto, 
      valor_pgmto, 
      tipo_pgmto, 
      descricao,
      observacoes 
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('gastos_funcionario', userToken)
    const result = await repository.update(id, {
      funcionario_id,
      data_pgmto,
      valor_pgmto,
      tipo_pgmto,
      descricao,
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
      .from('gastos_funcionario')
      .select(`
        *,
        funcionario:funcionarios(id,nome)
      `)
      .eq('id', id)
      .single()

    if (relationsError) {
      throw new Error(relationsError.message)
    }

    console.log('✅ Gasto atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: fullData })
  } catch (error) {
    console.error('❌ Erro ao atualizar gasto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar gasto' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir gasto (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/gastos - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('gastos_funcionario', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Gasto excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir gasto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir gasto' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
