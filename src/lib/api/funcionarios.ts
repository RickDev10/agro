/**
 * API Moderna de Funcionários
 * 
 * Cliente específico para operações com funcionários usando o sistema seguro
 */

import { secureApi, type ApiError } from '@/lib/secure-api'

// Tipos
export interface Funcionario {
  id: number
  nome: string
  numero?: string
  created_by: string
  created_at: string
  updated_at?: string
  updated_by?: string
}

export interface FuncionarioFormData {
  nome: string
  numero?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * Cliente API para funcionários com segurança completa
 */
export class FuncionariosApi {
  private basePath = '/funcionarios/secure'

  /**
   * Buscar todos os funcionários
   */
  async list(): Promise<Funcionario[]> {
    try {
      const response = await secureApi.get<ApiResponse<Funcionario[]>>(this.basePath)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar funcionários')
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error)
      throw error
    }
  }

  /**
   * Buscar funcionário por ID
   */
  async getById(id: number): Promise<Funcionario> {
    try {
      const response = await secureApi.get<ApiResponse<Funcionario>>(`${this.basePath}/${id}`)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Funcionário não encontrado')
      }
      
      return response.data
    } catch (error) {
      console.error(`❌ Erro ao buscar funcionário ${id}:`, error)
      throw error
    }
  }

  /**
   * Criar novo funcionário
   */
  async create(data: FuncionarioFormData): Promise<Funcionario> {
    try {
      // Validações no frontend
      if (!data.nome || data.nome.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (data.nome.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres')
      }

      const response = await secureApi.post<ApiResponse<Funcionario>>(this.basePath, data)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao criar funcionário')
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error)
      throw error
    }
  }

  /**
   * Atualizar funcionário
   */
  async update(id: number, data: FuncionarioFormData): Promise<Funcionario> {
    try {
      // Validações no frontend
      if (!data.nome || data.nome.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (data.nome.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres')
      }

      const response = await secureApi.put<ApiResponse<Funcionario>>(this.basePath, { id, ...data })
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao atualizar funcionário')
      }
      
      return response.data
    } catch (error) {
      console.error(`❌ Erro ao atualizar funcionário ${id}:`, error)
      throw error
    }
  }

  /**
   * Excluir funcionário
   */
  async delete(id: number): Promise<void> {
    try {
      const response = await secureApi.delete<ApiResponse<void>>(this.basePath, { id })
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao excluir funcionário')
      }
    } catch (error) {
      console.error(`❌ Erro ao excluir funcionário ${id}:`, error)
      throw error
    }
  }

  /**
   * Buscar funcionários com filtros
   */
  async search(filters: { nome?: string; numero?: string }): Promise<Funcionario[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.nome) {
        queryParams.append('nome', filters.nome)
      }
      
      if (filters.numero) {
        queryParams.append('numero', filters.numero)
      }

      const url = queryParams.toString() 
        ? `${this.basePath}?${queryParams.toString()}`
        : this.basePath

      const response = await secureApi.get<ApiResponse<Funcionario[]>>(url)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar funcionários')
      }
      
      return response.data
    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error)
      throw error
    }
  }

  /**
   * Validar dados do funcionário
   */
  validateFuncionario(data: FuncionarioFormData): string[] {
    const errors: string[] = []

    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome é obrigatório')
    }

    if (data.nome && data.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres')
    }

    if (data.numero && data.numero.length > 20) {
      errors.push('Número deve ter no máximo 20 caracteres')
    }

    return errors
  }
}

// Instância singleton
export const funcionariosApi = new FuncionariosApi()

/**
 * Hook React para usar a API de funcionários
 */
export function useFuncionariosApi() {
  return {
    api: funcionariosApi,
    validateFuncionario: funcionariosApi.validateFuncionario.bind(funcionariosApi)
  }
}
