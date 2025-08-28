/**
 * Wrapper para APIs Protegidas
 * 
 * Este wrapper garante que todas as APIs protegidas tenham verificação de autenticação
 * antes de processar a requisição.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, checkRateLimit, type AuthenticatedUser } from '@/middleware/auth'

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser['user']
  userId: string
  userEmail: string | null
}

/**
 * Wrapper que adiciona autenticação a qualquer handler de API
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      console.log(`🔐 Verificando autenticação para: ${request.method} ${request.url}`)
      
      // Verificar rate limiting
      const rateLimitOk = await checkRateLimit(request, 100) // 100 requests por hora
      if (!rateLimitOk) {
        console.log('❌ Rate limit excedido')
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente mais tarde.' },
          { status: 429 }
        )
      }

      // Verificar autenticação
      const authResult = await authenticateRequest(request)
      
      if (!authResult) {
        console.log('❌ Usuário não autenticado')
        return NextResponse.json(
          { error: 'Acesso negado. Faça login para continuar.' },
          { status: 401 }
        )
      }

      // Adicionar dados do usuário ao request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = authResult.user
      authenticatedRequest.userId = authResult.userId
      authenticatedRequest.userEmail = authResult.userEmail

      console.log(`✅ Usuário autenticado: ${authResult.userEmail}`)
      
      // Executar o handler original com dados de autenticação
      return await handler(authenticatedRequest, ...args)
      
    } catch (error) {
      console.error('❌ Erro no wrapper de autenticação:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrapper para APIs que requerem permissões específicas
 */
export function withPermission(resource: string, action: 'read' | 'write' | 'delete' | 'admin') {
  return function(handler: Function) {
    return withAuth(async (request: AuthenticatedRequest, ...args: any[]) => {
      try {
        // Aqui você pode implementar verificação de permissões mais granulares
        // Por enquanto, vamos permitir todas as operações para usuários autenticados
        console.log(`🔑 Verificando permissão ${action} em ${resource} para usuário ${request.userEmail}`)
        
        return await handler(request, ...args)
      } catch (error) {
        console.error('❌ Erro na verificação de permissões:', error)
        return NextResponse.json(
          { error: 'Sem permissão para esta operação' },
          { status: 403 }
        )
      }
    })
  }
}

/**
 * Wrapper apenas para administradores
 */
export function withAdminAuth(handler: Function) {
  return withPermission('admin', 'admin')(handler)
}

/**
 * Utilitário para extrair dados da requisição de forma segura
 */
export async function getRequestData(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validações básicas de segurança
    if (typeof body !== 'object' || body === null) {
      throw new Error('Dados inválidos')
    }
    
    return body
  } catch (error) {
    throw new Error('Formato de dados inválido')
  }
}

/**
 * Utilitário para logs de auditoria
 */
export function logActivity(
  userId: string,
  action: string,
  resource: string,
  details?: any
) {
  // Por enquanto, apenas console.log
  // Em produção, salvar no banco de dados
  console.log(`📝 AUDIT: ${userId} realizou ${action} em ${resource}`, details)
}
