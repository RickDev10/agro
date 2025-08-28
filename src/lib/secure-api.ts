/**
 * Sistema de Requisições Seguras
 * 
 * Cliente HTTP que automaticamente inclui tokens de autenticação
 * e trata erros de forma consistente.
 */

import { createClient } from '@/lib/supabase'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Cliente HTTP seguro que inclui automaticamente o token de autenticação
 */
class SecureApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Obtém o token de autenticação atual
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erro ao obter sessão:', error)
        return null
      }
      
      if (!session?.access_token) {
        console.log('❌ Nenhum token de acesso encontrado')
        return null
      }
      
      return session.access_token
    } catch (error) {
      console.error('❌ Erro ao obter token:', error)
      return null
    }
  }

  /**
   * Faz uma requisição HTTP segura
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log(`🔍 Fazendo requisição segura: ${options.method || 'GET'} ${endpoint}`)
      
      // Obter token de autenticação
      const token = await this.getAuthToken()
      
      if (!token) {
        // Redirecionar para login se não há token
        console.log('❌ Token não encontrado, redirecionando para login')
        window.location.href = '/auth/login'
        throw new ApiError('Usuário não autenticado', 401, 'UNAUTHORIZED')
      }

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      }

      // Fazer requisição
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      // Tratar diferentes códigos de status
      if (response.status === 401) {
        console.log('❌ Token expirado, redirecionando para login')
        // Token expirado ou inválido
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/auth/login'
        throw new ApiError('Sessão expirada', 401, 'TOKEN_EXPIRED')
      }

      if (response.status === 403) {
        throw new ApiError('Sem permissão para esta operação', 403, 'FORBIDDEN')
      }

      if (response.status === 429) {
        throw new ApiError('Muitas requisições. Tente novamente mais tarde.', 429, 'RATE_LIMITED')
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error || errorData.message || `Erro HTTP: ${response.status}`
        throw new ApiError(message, response.status, errorData.code)
      }

      // Parse da resposta
      const data = await response.json()
      console.log(`✅ Requisição bem-sucedida: ${options.method || 'GET'} ${endpoint}`)
      
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      console.error('❌ Erro na requisição:', error)
      throw new ApiError(
        'Erro de conexão. Verifique sua internet.',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * Requisição GET
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * Requisição POST
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Requisição PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Requisição DELETE
   */
  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Upload de arquivo
   */
  async upload<T>(endpoint: string, file: File, additionalData?: any): Promise<T> {
    try {
      const token = await this.getAuthToken()
      
      if (!token) {
        throw new ApiError('Usuário não autenticado', 401, 'UNAUTHORIZED')
      }

      const formData = new FormData()
      formData.append('file', file)
      
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key])
        })
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || 'Erro no upload',
          response.status,
          errorData.code
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Erro no upload', 500, 'UPLOAD_ERROR')
    }
  }
}

// Instância singleton do cliente
export const secureApi = new SecureApiClient()

/**
 * Hook React para usar o cliente API com tratamento de erros
 */
export function useSecureApi() {
  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      // Aqui você pode integrar com um sistema de notificações
      console.error(`API Error [${error.statusCode}]:`, error.message)
      
      // Exemplos de tratamento específico
      switch (error.code) {
        case 'UNAUTHORIZED':
        case 'TOKEN_EXPIRED':
          // Já tratado automaticamente pelo cliente
          break
        case 'FORBIDDEN':
          alert('Você não tem permissão para esta operação')
          break
        case 'RATE_LIMITED':
          alert('Muitas requisições. Aguarde um momento.')
          break
        default:
          alert(error.message)
      }
    } else {
      console.error('Erro desconhecido:', error)
      alert('Erro inesperado. Tente novamente.')
    }
  }

  return {
    api: secureApi,
    handleApiError,
    ApiError
  }
}

// Exportar cliente para uso direto
export default secureApi
