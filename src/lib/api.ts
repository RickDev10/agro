import axios from 'axios'
import type {
  Funcionario,
  FuncionarioFormData,
  Safra,
  SafraFormData,
  Insumo,
  InsumoFormData,
  Trator,
  TratorFormData,
  Talhao,
  TalhaoFormData,
  TipoProducao,
  TipoProducaoFormData,
  HistoricoPlantio,
  HistoricoPlantioFormData,
  HistoricoColheita,
  HistoricoColheitaFormData,
  Manutencao,
  ManutencaoFormData,
  GastoFuncionario,
  GastoFuncionarioFormData
} from '@/types'
import { createClient } from '@/lib/supabase'

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    console.log('🔍 Debug API Request SEGURA para:', endpoint)
    
    // Obter token de autenticação
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      console.log('❌ Token não encontrado, redirecionando para login')
      window.location.href = '/auth/login'
      throw new Error('Usuário não autenticado')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // ✅ Token incluso
      ...(options.headers as Record<string, string>),
    }

    console.log('✅ Fazendo requisição COM autenticação para usuário:', session.user.email)

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    })

    // Tratar diferentes códigos de status
    if (response.status === 401) {
      console.log('❌ Token expirado, redirecionando para login')
      // Token expirado ou inválido
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
      throw new Error('Sessão expirada')
    }

    if (response.status === 403) {
      throw new Error('Sem permissão para esta operação')
    }

    if (response.status === 429) {
      throw new Error('Muitas requisições. Tente novamente mais tarde.')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('❌ Erro no apiRequest:', error)
    throw error
  }
}

// Função para fazer requests GET autenticados
export async function apiGet(endpoint: string) {
  return apiRequest(endpoint, { method: 'GET' })
}

// Função para fazer requests POST autenticados
export async function apiPost(endpoint: string, data: any) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Função para fazer requests PUT autenticados
export async function apiPut(endpoint: string, data: any) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// Função para fazer requests DELETE autenticados
export async function apiDelete(endpoint: string) {
  return apiRequest(endpoint, { method: 'DELETE' })
}

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptors para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Helper functions
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  
  try {
    // Se a data já estiver no formato brasileiro, retorna como está
    if (date.includes('/')) return date
    
    // Para datas do PostgreSQL/Supabase que podem vir como '2024-01-15' ou '2024-01-15T00:00:00.000Z'
    let dateString = date
    
    // Remove timezone se presente
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0]
    }
    
    // Verifica se é um formato de data válido (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Tenta converter com Date() como fallback
    const dateObj = new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      return date // Retorna a string original se não conseguir converter
    }
    
    return dateObj.toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data original:', date)
    return date || '-'
  }
}

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-'
  
  try {
    // Se a data já estiver no formato brasileiro, retorna como está
    if (date.includes('/')) return date
    
    // Para datas do PostgreSQL/Supabase que podem vir como '2024-01-15' ou '2024-01-15T00:00:00.000Z'
    let dateString = date
    
    // Remove timezone se presente mas mantém a hora
    if (dateString.includes('T') && dateString.includes('Z')) {
      dateString = dateString.replace('Z', '')
    }
    
    // Tenta converter com Date() como fallback
    const dateObj = new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      return date // Retorna a string original se não conseguir converter
    }
    
    return dateObj.toLocaleString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error, 'Data original:', date)
    return date || '-'
  }
}

// API functions para cada entidade
export const funcionariosApi = {
  list: () => apiClient.get<Funcionario[]>('/funcionarios'),
  get: (id: number) => apiClient.get<Funcionario>(`/funcionarios/${id}`),
  create: (data: FuncionarioFormData) => apiClient.post<Funcionario>('/funcionarios', data),
  update: (id: number, data: FuncionarioFormData) => apiClient.put<Funcionario>(`/funcionarios/${id}`, data),
  delete: (id: number) => apiClient.delete(`/funcionarios/${id}`),
}

export const safrasApi = {
  list: () => apiClient.get<Safra[]>('/safras'),
  get: (id: number) => apiClient.get<Safra>(`/safras/${id}`),
  create: (data: SafraFormData) => apiClient.post<Safra>('/safras', data),
  update: (id: number, data: SafraFormData) => apiClient.put<Safra>(`/safras/${id}`, data),
  delete: (id: number) => apiClient.delete(`/safras/${id}`),
}

export const insumosApi = {
  list: () => apiClient.get<Insumo[]>('/insumos'),
  get: (id: number) => apiClient.get<Insumo>(`/insumos/${id}`),
  create: (data: InsumoFormData) => apiClient.post<Insumo>('/insumos', data),
  update: (id: number, data: InsumoFormData) => apiClient.put<Insumo>(`/insumos/${id}`, data),
  delete: (id: number) => apiClient.delete(`/insumos/${id}`),
}

export const tratoresApi = {
  list: () => apiClient.get<Trator[]>('/tratores'),
  get: (id: number) => apiClient.get<Trator>(`/tratores/${id}`),
  create: (data: TratorFormData) => apiClient.post<Trator>('/tratores', data),
  update: (id: number, data: TratorFormData) => apiClient.put<Trator>(`/tratores/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tratores/${id}`),
}

export const talhoesApi = {
  list: () => apiClient.get<Talhao[]>('/talhoes'),
  get: (id: number) => apiClient.get<Talhao>(`/talhoes/${id}`),
  create: (data: TalhaoFormData) => apiClient.post<Talhao>('/talhoes', data),
  update: (id: number, data: TalhaoFormData) => apiClient.put<Talhao>(`/talhoes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/talhoes/${id}`),
}

export const tiposProducaoApi = {
  list: () => apiClient.get<TipoProducao[]>('/tipos-producao'),
  get: (id: number) => apiClient.get<TipoProducao>(`/tipos-producao/${id}`),
  create: (data: TipoProducaoFormData) => apiClient.post<TipoProducao>('/tipos-producao', data),
  update: (id: number, data: TipoProducaoFormData) => apiClient.put<TipoProducao>(`/tipos-producao/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tipos-producao/${id}`),
}

export const historicoPlantioApi = {
  list: () => apiClient.get<HistoricoPlantio[]>('/historico-plantio'),
  get: (id: number) => apiClient.get<HistoricoPlantio>(`/historico-plantio/${id}`),
  create: (data: HistoricoPlantioFormData) => apiClient.post<HistoricoPlantio>('/historico-plantio', data),
  update: (id: number, data: HistoricoPlantioFormData) => apiClient.put<HistoricoPlantio>(`/historico-plantio/${id}`, data),
  delete: (id: number) => apiClient.delete(`/historico-plantio/${id}`),
}

export const historicoColheitaApi = {
  list: () => apiClient.get<HistoricoColheita[]>('/historico-colheita'),
  get: (id: number) => apiClient.get<HistoricoColheita>(`/historico-colheita/${id}`),
  create: (data: HistoricoColheitaFormData) => apiClient.post<HistoricoColheita>('/historico-colheita', data),
  update: (id: number, data: HistoricoColheitaFormData) => apiClient.put<HistoricoColheita>(`/historico-colheita/${id}`, data),
  delete: (id: number) => apiClient.delete(`/historico-colheita/${id}`),
}

export const manutencaoApi = {
  list: () => apiClient.get<Manutencao[]>('/manutencao'),
  get: (id: number) => apiClient.get<Manutencao>(`/manutencao/${id}`),
  create: (data: ManutencaoFormData) => apiClient.post<Manutencao>('/manutencao', data),
  update: (id: number, data: ManutencaoFormData) => apiClient.put<Manutencao>(`/manutencao/${id}`, data),
  delete: (id: number) => apiClient.delete(`/manutencao/${id}`),
}

export const gastosFuncionarioApi = {
  list: () => apiClient.get<GastoFuncionario[]>('/gastos-funcionario'),
  get: (id: number) => apiClient.get<GastoFuncionario>(`/gastos-funcionario/${id}`),
  create: (data: GastoFuncionarioFormData) => apiClient.post<GastoFuncionario>('/gastos-funcionario', data),
  update: (id: number, data: GastoFuncionarioFormData) => apiClient.put<GastoFuncionario>(`/gastos-funcionario/${id}`, data),
  delete: (id: number) => apiClient.delete(`/gastos-funcionario/${id}`),
}

// Dashboard API
export const dashboardApi = {
  getMetrics: () => apiClient.get('/dashboard/metrics'),
  getFinancialData: () => apiClient.get('/dashboard/financial'),
  getProductivityData: () => apiClient.get('/dashboard/productivity'),
  getExpenseDistribution: () => apiClient.get('/dashboard/expenses'),
  getOperationalData: () => apiClient.get('/dashboard/operational'),
}

// Relatórios API
export const relatoriosApi = {
  getFinancialReport: (period: string) => apiClient.get(`/relatorios/financeiro?period=${period}`),
  getProductivityReport: (period: string) => apiClient.get(`/relatorios/produtividade?period=${period}`),
  getOperationalReport: (period: string) => apiClient.get(`/relatorios/operacional?period=${period}`),
  exportReport: (type: string, period: string) => apiClient.get(`/relatorios/export/${type}?period=${period}`),
}
