/**
 * Middleware de Autenticação para APIs
 * 
 * Este middleware verifica se o usuário está autenticado através do token JWT
 * enviado no header Authorization das requisições.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedUser {
  user: any
  userId: string
  userEmail: string | null
}

/**
 * Verifica se a requisição contém um token válido de autenticação
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Token não fornecido no header Authorization')
      return null
    }

    const token = authHeader.substring(7)
    
    if (!token) {
      console.log('❌ Token vazio')
      return null
    }

    // Criar cliente Supabase para verificação do token
    const supabase = createClient()
    
    // Verificar e decodificar o token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      console.log('❌ Erro ao verificar token:', error.message)
      return null
    }
    
    if (!user) {
      console.log('❌ Token inválido - usuário não encontrado')
      return null
    }

    console.log('✅ Usuário autenticado:', user.email)
    
    return {
      user,
      userId: user.id,
      userEmail: user.email || null
    }
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error)
    return null
  }
}

/**
 * Verifica se o usuário tem permissão específica para uma operação
 */
export async function checkUserPermission(
  userId: string, 
  resource: string, 
  action: 'read' | 'write' | 'delete' | 'admin'
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Verificar se o usuário tem permissão específica
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('table_name', resource)
      .eq('permission', action)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erro ao verificar permissões:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error)
    return false
  }
}

/**
 * Middleware para rate limiting básico
 */
export async function checkRateLimit(request: NextRequest, limit: number = 100): Promise<boolean> {
  try {
    // Por enquanto, implementação simples baseada em memória
    // Em produção, usar Redis ou similar
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Aqui você implementaria a lógica de rate limiting
    // Por enquanto, sempre permitir para não bloquear desenvolvimento
    console.log(`⚡ Rate limit check para IP: ${ip}`)
    return true
  } catch (error) {
    console.error('❌ Erro no rate limiting:', error)
    return true // Em caso de erro, permitir a requisição
  }
}
