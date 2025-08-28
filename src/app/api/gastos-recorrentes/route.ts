import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar todos os gastos recorrentes (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/gastos-recorrentes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('gastos_recorrentes', userToken)
    const result = await repository.findAllWithOptions({
      orderBy: 'created_at',
      ascending: false
    })

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Gastos recorrentes encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar gastos recorrentes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar gastos recorrentes' },
      { status: 500 }
    )
  }
}

// POST - Criar novo gasto recorrente (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/gastos-recorrentes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      nome,
      descricao, 
      tipo, 
      valor, 
      frequencia,
      dia_mes,
      dia_semana,
      data_inicio,
      data_fim,
      ativo,
      referencia_id,
      referencia_tabela,
      fixo
    } = body

    // Validações básicas
    if (!nome || !tipo || !valor || !frequencia || !data_inicio) {
      return NextResponse.json(
        { success: false, error: 'Nome, tipo, valor, frequência e data de início são obrigatórios' },
        { status: 400 }
      )
    }

    // Calcular próxima execução baseada na data de início
    let proxima_execucao = new Date(data_inicio)
    
    // Se a data de início já passou, calcular próxima execução
    if (proxima_execucao <= new Date()) {
      const hoje = new Date()
      switch (frequencia) {
        case 'diario':
          proxima_execucao = new Date(hoje.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'semanal':
          proxima_execucao = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'mensal':
          proxima_execucao = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate())
          break
        case 'trimestral':
          proxima_execucao = new Date(hoje.getFullYear(), hoje.getMonth() + 3, hoje.getDate())
          break
        case 'semestral':
          proxima_execucao = new Date(hoje.getFullYear(), hoje.getMonth() + 6, hoje.getDate())
          break
        case 'anual':
          proxima_execucao = new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate())
          break
      }
    }

    const repository = new AuthenticatedRepository('gastos_recorrentes', userToken)
    const result = await repository.create({
      nome,
      descricao: descricao || '',
      tipo,
      valor: parseFloat(valor),
      frequencia,
      dia_mes: dia_mes || null,
      dia_semana: dia_semana || null,
      data_inicio,
      data_fim: data_fim || null,
      ativo: ativo !== undefined ? ativo : true,
      proxima_execucao: proxima_execucao.toISOString().split('T')[0],
      referencia_id: referencia_id || null,
      referencia_tabela: referencia_tabela || null,
      fixo: fixo || false
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Gasto recorrente criado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar gasto recorrente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar gasto recorrente' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar gasto recorrente (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/gastos-recorrentes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      nome,
      descricao, 
      tipo, 
      valor, 
      frequencia,
      dia_mes,
      dia_semana,
      data_inicio,
      data_fim,
      ativo,
      referencia_id,
      referencia_tabela,
      fixo
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('gastos_recorrentes', userToken)
    const result = await repository.update(id, {
      nome,
      descricao: descricao || '',
      tipo,
      valor: parseFloat(valor),
      frequencia,
      dia_mes: dia_mes || null,
      dia_semana: dia_semana || null,
      data_inicio,
      data_fim: data_fim || null,
      ativo,
      referencia_id: referencia_id || null,
      referencia_tabela: referencia_tabela || null,
      fixo: fixo || false,
      updated_at: new Date().toISOString()
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Gasto recorrente atualizado (SEGURO):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar gasto recorrente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar gasto recorrente' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir gasto recorrente (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/gastos-recorrentes - SEGURO - Usuário:', request.userEmail)
    
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

    const repository = new AuthenticatedRepository('gastos_recorrentes', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Gasto recorrente excluído (SEGURO):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir gasto recorrente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir gasto recorrente' },
      { status: 500 }
    )
  }
}

// PATCH - Executar gastos recorrentes (PROTEGIDO)
async function handlePatch(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PATCH /api/gastos-recorrentes - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Usar cliente autenticado para executar a função RPC
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    const { error } = await client.rpc('gerar_gastos_recorrentes')

    if (error) {
      throw error
    }

    console.log('✅ Gastos recorrentes processados (SEGURO)')
    return NextResponse.json({ 
      success: true, 
      message: 'Gastos recorrentes processados com sucesso' 
    })
  } catch (error) {
    console.error('❌ Erro ao executar gastos recorrentes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao executar gastos recorrentes' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
export const PATCH = withAuth(handlePatch)
