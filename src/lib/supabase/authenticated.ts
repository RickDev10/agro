/**
 * Cliente Supabase Autenticado
 * 
 * Este módulo cria clientes Supabase que respeitam o contexto do usuário autenticado,
 * garantindo que as políticas RLS sejam aplicadas corretamente.
 */

import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cria um cliente Supabase com o token do usuário autenticado
 * Este cliente respeitará todas as políticas RLS
 */
export function createAuthenticatedClient(userToken: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas')
  }

  if (!userToken) {
    throw new Error('Token do usuário é obrigatório')
  }

  console.log('🔐 Criando cliente Supabase autenticado')

  // Criar cliente com chave anônima e definir headers personalizados
  const supabase = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  })

  return supabase
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromRequest(request: Request): string | null {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    return authHeader.substring(7)
  } catch (error) {
    console.error('❌ Erro ao extrair token:', error)
    return null
  }
}

/**
 * Cria cliente autenticado a partir de uma requisição
 */
export function createClientFromRequest(request: Request): SupabaseClient | null {
  try {
    const token = extractTokenFromRequest(request)
    
    if (!token) {
      console.log('❌ Token não encontrado na requisição')
      return null
    }

    return createAuthenticatedClient(token)
  } catch (error) {
    console.error('❌ Erro ao criar cliente autenticado:', error)
    return null
  }
}

/**
 * Utilitário para executar queries com tratamento de erro padrão
 */
export async function executeQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<any>,
  userToken: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const client = createAuthenticatedClient(userToken)
    const result = await queryFn(client)
    
    if (result.error) {
      console.error('❌ Erro na query Supabase:', result.error)
      return { data: null, error: result.error.message }
    }
    
    return { data: result.data, error: null }
  } catch (error) {
    console.error('❌ Erro ao executar query:', error)
    return { data: null, error: 'Erro interno do servidor' }
  }
}

/**
 * Tipos para melhor tipagem
 */
export interface QueryResult<T> {
  data: T | null
  error: string | null
}

/**
 * Wrapper para operações CRUD comuns
 */
export class AuthenticatedRepository<T> {
  private tableName: string
  private userToken: string

  constructor(tableName: string, userToken: string) {
    this.tableName = tableName
    this.userToken = userToken
  }

  async findAll(filters?: any): Promise<QueryResult<T[]>> {
    return executeQuery(async (client) => {
      let query = client.from(this.tableName).select('*')
      
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            query = query.eq(key, filters[key])
          }
        })
      }
      
      return query.order('created_at', { ascending: false })
    }, this.userToken)
  }

  async findAllWithOptions(options?: { orderBy?: string; ascending?: boolean; filters?: any }): Promise<QueryResult<T[]>> {
    return executeQuery(async (client) => {
      let query = client.from(this.tableName).select('*')
      
      if (options?.filters) {
        Object.keys(options.filters).forEach(key => {
          if (options.filters[key] !== undefined && options.filters[key] !== null) {
            query = query.eq(key, options.filters[key])
          }
        })
      }
      
      const orderBy = options?.orderBy || 'created_at'
      const ascending = options?.ascending || false
      
      return query.order(orderBy, { ascending })
    }, this.userToken)
  }

  async findById(id: number | string): Promise<QueryResult<T>> {
    return executeQuery(async (client) => {
      return client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    }, this.userToken)
  }

  async create(data: Partial<T>, userId: string): Promise<QueryResult<T>> {
    return executeQuery(async (client) => {
      return client
        .from(this.tableName)
        .insert({
          ...data,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }, this.userToken)
  }

  async update(id: number | string, data: Partial<T>, userId: string): Promise<QueryResult<T>> {
    return executeQuery(async (client) => {
      return client
        .from(this.tableName)
        .update({
          ...data,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    }, this.userToken)
  }

  async delete(id: number | string): Promise<QueryResult<void>> {
    return executeQuery(async (client) => {
      return client
        .from(this.tableName)
        .delete()
        .eq('id', id)
    }, this.userToken)
  }
}
