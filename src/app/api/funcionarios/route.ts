/**
 * API Segura de Funcionários
 * 
 * API completamente protegida com autenticação, autorização e isolamento por organização
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getRequestData, logActivity, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// Tipos
interface Funcionario {
  id: number
  nome: string
  numero?: string
  created_by: string
  created_at: string
  updated_at?: string
  updated_by?: string
  organization_id?: number
}

// GET - Buscar todos os funcionários (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/funcionarios - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository<Funcionario>('funcionarios', userToken)
    const result = await repository.findAll()
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Log da atividade
    logActivity(request.userId, 'READ', 'funcionarios', { count: result.data?.length || 0 })

    console.log('✅ Funcionários encontrados (SEGUROS):', result.data?.length || 0)
    return NextResponse.json({ success: true, data: result.data || [] })
  } catch (error) {
    console.error('❌ Erro ao buscar funcionários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar funcionários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo funcionário (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/funcionarios - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Validar dados da requisição
    const data = await getRequestData(request)
    
    if (!data.nome || data.nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (data.nome.length > 100) {
      return NextResponse.json(
        { error: 'Nome deve ter no máximo 100 caracteres' },
        { status: 400 }
      )
    }

    // Criar funcionário
    const repository = new AuthenticatedRepository<Funcionario>('funcionarios', userToken)
    const result = await repository.create(
      {
        nome: data.nome.trim(),
        numero: data.numero?.trim() || null
      },
      request.userId
    )
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Log da atividade
    logActivity(request.userId, 'CREATE', 'funcionarios', { 
      funcionario_id: result.data?.id,
      nome: data.nome 
    })

    console.log('✅ Funcionário criado (SEGURO):', result.data?.id)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao criar funcionário' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar funcionário (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/funcionarios - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Validar dados da requisição
    const data = await getRequestData(request)
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    if (!data.nome || data.nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (data.nome.length > 100) {
      return NextResponse.json(
        { error: 'Nome deve ter no máximo 100 caracteres' },
        { status: 400 }
      )
    }

    // Atualizar funcionário
    const repository = new AuthenticatedRepository<Funcionario>('funcionarios', userToken)
    const result = await repository.update(
      data.id,
      {
        nome: data.nome.trim(),
        numero: data.numero?.trim() || null
      },
      request.userId
    )
    
    if (result.error) {
      if (result.error.includes('No rows')) {
        return NextResponse.json(
          { error: 'Funcionário não encontrado ou sem permissão para editar' },
          { status: 404 }
        )
      }
      throw new Error(result.error)
    }

    // Log da atividade
    logActivity(request.userId, 'UPDATE', 'funcionarios', { 
      funcionario_id: data.id,
      nome: data.nome 
    })

    console.log('✅ Funcionário atualizado (SEGURO):', data.id)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar funcionário' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir funcionário (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/funcionarios - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    // Validar dados da requisição
    const data = await getRequestData(request)
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o funcionário existe antes de excluir
    const repository = new AuthenticatedRepository<Funcionario>('funcionarios', userToken)
    const existing = await repository.findById(data.id)
    
    if (existing.error || !existing.data) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou sem permissão para excluir' },
        { status: 404 }
      )
    }

    // Excluir funcionário
    const result = await repository.delete(data.id)
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Log da atividade
    logActivity(request.userId, 'DELETE', 'funcionarios', { 
      funcionario_id: data.id,
      nome: existing.data.nome
    })

    console.log('✅ Funcionário excluído (SEGURO):', data.id)
    return NextResponse.json({ 
      success: true,
      message: 'Funcionário excluído com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro ao excluir funcionário:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir funcionário' },
      { status: 500 }
    )
  }
}

// Aplicar middlewares de segurança
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)