// Tipos baseados na estrutura real do banco de dados

export interface TipoProducao {
  id: number
  nome_producao: string
  created_at?: string
  updated_at?: string
}

export interface Funcionario {
  id: number
  nome: string
  numero?: string
  created_at?: string
  updated_at?: string
}

export interface Talhao {
  id: number
  nome: string
  area_hectares?: number
  created_at?: string
  updated_at?: string
}

export interface Trator {
  id: number
  nome: string
  tempo_prox_manutencao?: number
  em_manutencao: boolean
  created_at?: string
  updated_at?: string
}

export interface Safra {
  id: number
  safra: string
  data_inicio: string
  data_fim?: string
  em_andamento: boolean
  lucro_esperado?: number
  faturamento_esperado?: number
  faturamento_total?: number
  total_colhido?: number
  tipo_de_producao: number
  created_at?: string
  updated_at?: string
  tipo_producao?: TipoProducao // Para exibição
}

export interface Insumo {
  id: number
  insumo: string
  qnt_total?: number
  valor_total?: number
  valor_por_medida?: number
  medida?: string
  created_at?: string
  updated_at?: string
}

export interface HistoricoPlantio {
  id: number
  tipo_de_producao: number
  data_execucao: string
  safra_id: number
  talhao_id: number
  trator_id: number
  funcionario_id: number
  duracao_horas?: number
  combustivel?: number
  foto_combustivel?: string
  foto_orimetro_inicio?: string
  foto_orimetro_fim?: string
  insumos?: Record<string, any> // JSONB
  status_execucao?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos para exibição
  tipo_producao?: TipoProducao
  safra?: Safra
  talhao?: Talhao
  trator?: Trator
  funcionario?: Funcionario
}

export interface HistoricoColheita {
  id: number
  tipo_de_producao: number
  data_execucao: string
  safra_id: number
  talhao_id: number
  trator_id: number
  funcionario_id: number
  duracao_horas?: number
  combustivel?: number
  foto_combustivel?: string
  foto_orimetro_inicio?: string
  foto_orimetro_fim?: string
  insumos?: Record<string, any> // JSONB
  status_execucao?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos para exibição
  tipo_producao?: TipoProducao
  safra?: Safra
  talhao?: Talhao
  trator?: Trator
  funcionario?: Funcionario
}

export interface Manutencao {
  id: number
  tipo_manutencao: string
  trator_id: number
  valor_total?: number
  data_manutencao: string
  created_at?: string
  updated_at?: string
  trator?: Trator // Para exibição
}

export interface GastoFuncionario {
  id: number
  funcionario_id: number
  valor_pago?: number
  data_pgmto: string
  tipo?: string
  created_at?: string
  updated_at?: string
  funcionario?: Funcionario // Para exibição
}

// Tipos para formulários
export interface TipoProducaoFormData {
  nome_producao: string
}

export interface FuncionarioFormData {
  nome: string
  numero?: string
}

export interface TalhaoFormData {
  nome: string
  area_hectares?: number
}

export interface TratorFormData {
  nome: string
  tempo_prox_manutencao?: number
  em_manutencao: boolean
}

export interface SafraFormData {
  safra: string
  data_inicio: string
  data_fim?: string
  em_andamento: boolean
  lucro_esperado?: number
  faturamento_esperado?: number
  faturamento_total?: number
  total_colhido?: number
  tipo_de_producao: number
}

export interface InsumoFormData {
  insumo: string
  qnt_total?: number
  medida?: string
}

export interface EstoqueInsumo {
  id: number
  insumo_id: number
  quantidade: number
  atualizado_em: string
  insumo?: Insumo
}

export interface LoteInsumo {
  id: number
  insumo_id: number
  quantidade: number
  preco_unitario: number
  data_compra: string
  atualizado_em: string
  insumo?: Insumo
}

export interface MovimentacaoInsumo {
  id: number
  insumo_id: number
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario?: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  observacao?: string
  insumo?: Insumo
}

export interface EstoqueCombustivel {
  id: number
  nome: string
  qnt_total: number
  valor_total: number
  valor_por_medida: number
  medida: string
  created_at?: string
  updated_at?: string
}

export interface LoteCombustivel {
  id: number
  quantidade: number
  preco_unitario: number
  data_compra: string
  atualizado_em?: string
}

export interface MovimentacaoCombustivel {
  id: number
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario?: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  observacao?: string
  created_at?: string
  updated_at?: string
}

export interface CompraCombustivel {
  id: number
  quantidade: number
  preco_unitario: number
  data_compra: string
  observacao?: string
  created_at?: string
  updated_at?: string
}

export interface GastoGeral {
  id: number
  tipo: string
  descricao: string
  valor: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  fixo?: boolean
  gasto_recorrente_id?: number
  recorrente?: boolean
  created_at?: string
  updated_at?: string
}

export interface HistoricoPlantioFormData {
  tipo_de_producao: number
  data_execucao: string
  safra_id: number
  talhao_id: number
  trator_id: number
  funcionario_id: number
  duracao_horas?: number
  combustivel?: number
  foto_combustivel?: string
  foto_orimetro_inicio?: string
  foto_orimetro_fim?: string
  insumos?: Record<string, any>
  status_execucao?: string
}

export interface HistoricoColheitaFormData {
  tipo_de_producao: number
  data_execucao: string
  safra_id: number
  talhao_id: number
  trator_id: number
  funcionario_id: number
  duracao_horas?: number
  combustivel?: number
  foto_combustivel?: string
  foto_orimetro_inicio?: string
  foto_orimetro_fim?: string
  insumos?: Record<string, any>
  status_execucao?: string
}

export interface ManutencaoFormData {
  tipo_manutencao: string
  trator_id: number
  valor_total?: number
  data_manutencao: string
}

export interface GastoFuncionarioFormData {
  funcionario_id: number
  valor_pago?: number
  data_pgmto: string
  tipo?: string
}

export interface EstoqueInsumoFormData {
  insumo_id: number
  quantidade: number
}

export interface LoteInsumoFormData {
  insumo_id: number
  quantidade: number
  preco_unitario: number
  data_compra: string
}

export interface MovimentacaoInsumoFormData {
  insumo_id: number
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario?: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  observacao?: string
}

export interface EstoqueCombustivelFormData {
  nome: string
  medida: string
}

export interface LoteCombustivelFormData {
  quantidade: number
  preco_unitario: number
  data_compra: string
}

export interface MovimentacaoCombustivelFormData {
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario?: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  observacao?: string
}

export interface CompraCombustivelFormData {
  quantidade: number
  preco_unitario: number
  data_compra: string
  observacao?: string
}

export interface GastoGeralFormData {
  tipo: string
  descricao: string
  valor: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  fixo?: boolean
}

export interface GastoRecorrente {
  id: number
  nome: string
  descricao?: string
  tipo: string
  valor: number
  frequencia: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'
  dia_mes?: number
  dia_semana?: number
  data_inicio: string
  data_fim?: string
  ativo: boolean
  proxima_execucao?: string
  referencia_id?: number
  referencia_tabela?: string
  fixo: boolean
  created_at?: string
  updated_at?: string
}

export interface GastoRecorrenteFormData {
  nome: string
  descricao?: string
  tipo: string
  valor: number
  frequencia: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual'
  dia_mes?: number
  dia_semana?: number
  data_inicio: string
  data_fim?: string
  ativo?: boolean
  referencia_id?: number
  referencia_tabela?: string
  fixo?: boolean
}

// Tipos para dashboard e relatórios
export interface DashboardMetrics {
  total_funcionarios: number
  safras_ativas: number
  insumos_baixo_estoque: number
  tratores_ativos: number
  gastos_mes_atual: number
  receita_mes_atual: number
  produtividade_media: number
  eficiencia_operacional: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface FinancialData {
  mes: string
  receita: number
  gastos: number
  lucro: number
}

export interface ProductivityData {
  safra: string
  esperada: number
  real: number
}

export interface ExpenseDistribution {
  name: string
  value: number
  color: string
}

export interface OperationalData {
  periodo: string
  horas_trabalhadas: number
  eficiencia: number
  manutencoes: number
}
