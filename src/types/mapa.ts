export interface Coordenada {
  lat: number
  lng: number
}

export interface Fazenda {
  id: number
  nome: string
  coordenadas: Coordenada
  area_total: number
  endereco: string
  created_at: string
  updated_at: string
}

export interface Talhao {
  id: number
  nome: string
  fazenda_id: number
  area: number
  cultura: string
  status: 'ativo' | 'inativo' | 'colheita'
  coordenadas: Coordenada[]
  cor: string
  created_at: string
  updated_at: string
}

export interface Localizacao {
  id: number
  funcionario_id: number
  funcionario_nome: string
  latitude: number
  longitude: number
  timestamp: string
  atividade: string
  talhao_id?: number
  talhao_nome?: string
  velocidade?: number
  status: 'online' | 'offline' | 'trabalhando'
  tipo: 'funcionario' | 'trator' | 'veiculo'
  created_at: string
}

export interface StatusTempoReal {
  funcionario_id: number
  funcionario_nome: string
  ultima_atualizacao: string
  status: 'online' | 'offline' | 'trabalhando'
  talhao_atual?: string
  atividade_atual?: string
  tempo_no_talhao?: number // em minutos
}

export interface FiltrosMapa {
  fazenda_id?: number
  data_inicio?: string
  data_fim?: string
  funcionario_id?: number
  tipo_atividade?: string
  status?: string
}

// Tipos para resposta da API
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface FazendasResponse extends ApiResponse<Fazenda[]> {}
export interface TalhoesResponse extends ApiResponse<Talhao[]> {}
export interface LocalizacoesResponse extends ApiResponse<Localizacao[]> {}
export interface StatusTempoRealResponse extends ApiResponse<StatusTempoReal[]> {}
