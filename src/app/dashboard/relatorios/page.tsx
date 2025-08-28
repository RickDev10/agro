'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, formatCurrency, formatDate } from '@/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Truck,
  Download,
  Filter,
  Calendar,
  Search,
  X,
  RefreshCw
} from 'lucide-react'

// Função para formatar horas em formato legível
const formatHours = (hours: number) => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}min`
  }
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}min`
}

interface FilterState {
  dataInicio: string
  dataFim: string
  safraId: string
  tipoProducaoId: string
  funcionarioId: string
  talhaoId: string
  tratorId: string
  statusExecucao: string
  tipoManutencao: string
  tipoGasto: string
  tipoInsumo: string
  insumoId: string
  valorMinimo: string
  valorMaximo: string
}

interface ReferenceData {
  safras: Array<{ id: number; safra: string }>
  tiposProducao: Array<{ id: number; nome_producao: string }>
  funcionarios: Array<{ id: number; nome: string }>
  talhoes: Array<{ id: number; nome: string }>
  tratores: Array<{ id: number; nome: string }>
}

interface ReportData {
  plantio: any[]
  colheita: any[]
  manutencoes: any[]
  gastos: any[]
  comprasCombustivel: any[]
  insumos: any[]
  combustivel: any[]
}

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState('overview')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData>({
    plantio: [],
    colheita: [],
    manutencoes: [],
    gastos: [],
    comprasCombustivel: [],
    insumos: [],
    combustivel: []
  })
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    safras: [],
    tiposProducao: [],
    funcionarios: [],
    talhoes: [],
    tratores: []
  })
  const [filters, setFilters] = useState<FilterState>({
    dataInicio: '',
    dataFim: '',
    safraId: '',
    tipoProducaoId: '',
    funcionarioId: '',
    talhaoId: '',
    tratorId: '',
    statusExecucao: '',
    tipoManutencao: '',
    tipoGasto: '',
    tipoInsumo: '',
    insumoId: '',
    valorMinimo: '',
    valorMaximo: ''
  })

  // Carregar dados de referência
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        console.log('🔍 Carregando dados de referência (SEGURO)...')
        const result = await apiGet('/reference-data')
        if (result.success) {
          console.log('✅ Dados de referência carregados (SEGUROS):', result.data)
          setReferenceData(result.data)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados de referência:', error)
      }
    }
    
    loadReferenceData()
  }, [])

  // Carregar dados dos relatórios
  const loadReportData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Carregando dados dos relatórios (SEGURO)...')
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const [plantioResult, colheitaResult, manutencoesResult, gastosGeraisResult, insumosResult] = await Promise.all([
        apiGet(`/reports/plantio?${params}`),
        apiGet(`/reports/colheita?${params}`),
        apiGet(`/reports/manutencoes?${params}`),
        apiGet(`/reports/gastos-gerais?${params}`),
        apiGet(`/reports/insumos?${params}`)
      ])

      console.log('✅ Relatórios carregados (SEGUROS):', {
        plantio: plantioResult.success ? plantioResult.data?.length : 0,
        colheita: colheitaResult.success ? colheitaResult.data?.length : 0,
        manutencoes: manutencoesResult.success ? manutencoesResult.data?.length : 0,
        gastosGerais: gastosGeraisResult.success ? gastosGeraisResult.data?.length : 0,
        insumos: insumosResult.success ? insumosResult.data?.length : 0
      })

      setReportData({
        plantio: plantioResult.success ? plantioResult.data : [],
        colheita: colheitaResult.success ? colheitaResult.data : [],
        manutencoes: manutencoesResult.success ? manutencoesResult.data : [],
        gastos: gastosGeraisResult.success ? gastosGeraisResult.data : [],
        comprasCombustivel: [],
        insumos: insumosResult.success ? insumosResult.data : [],
        combustivel: []
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    console.log('🔍 Aplicando filtros (SEGURO)...')
    loadReportData()
    setShowFilters(false)
  }

  const clearFilters = () => {
    console.log('🔍 Limpando filtros (SEGURO)...')
    setFilters({
      dataInicio: '',
      dataFim: '',
      safraId: '',
      tipoProducaoId: '',
      funcionarioId: '',
      talhaoId: '',
      tratorId: '',
      statusExecucao: '',
      tipoManutencao: '',
      tipoGasto: '',
      tipoInsumo: '',
      insumoId: '',
      valorMinimo: '',
      valorMaximo: ''
    })
  }

  // Cálculos das métricas
  const totalGastos = reportData.gastos.reduce((sum, g) => sum + (g.valor || 0), 0)
  const totalManutencoes = reportData.manutencoes.reduce((sum, m) => sum + (m.valor_total || 0), 0)
  const totalHorasPlantio = reportData.plantio.reduce((sum, p) => sum + (p.duracao_horas || 0), 0)
  const totalHorasColheita = reportData.colheita.reduce((sum, c) => sum + (c.duracao_horas || 0), 0)
  const totalCombustivel = reportData.plantio.reduce((sum, p) => sum + (p.combustivel || 0), 0) + 
                          reportData.colheita.reduce((sum, c) => sum + (c.combustivel || 0), 0)

  // Dados para gráficos
  const getMonthlyData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months.map((mes, index) => {
      const monthGastos = reportData.gastos.filter(g => {
        const date = new Date(g.data)
        return date.getMonth() === index
      }).reduce((sum, g) => sum + (g.valor || 0), 0)

      const monthManutencoes = reportData.manutencoes.filter(m => {
        const date = new Date(m.data_manutencao)
        return date.getMonth() === index
      }).reduce((sum, m) => sum + (m.valor_total || 0), 0)

      return {
        mes,
        gastos: monthGastos,
        manutencoes: monthManutencoes,
        total: monthGastos + monthManutencoes
      }
    })
  }

  const getOperationalData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return months.map((mes, index) => {
      const monthPlantio = reportData.plantio.filter(p => {
        const date = new Date(p.data_execucao)
        return date.getMonth() === index
      })

      const monthColheita = reportData.colheita.filter(c => {
        const date = new Date(c.data_execucao)
        return date.getMonth() === index
      })

      return {
        mes,
        horasPlantio: monthPlantio.reduce((sum, p) => sum + (p.duracao_horas || 0), 0),
        horasColheita: monthColheita.reduce((sum, c) => sum + (c.duracao_horas || 0), 0),
        operacoes: monthPlantio.length + monthColheita.length
      }
    })
  }

  const getExpenseDistribution = () => {
    const gastosPorTipo = reportData.gastos.reduce((acc: any, gasto) => {
      const tipo = gasto.tipo || 'Outros'
      acc[tipo] = (acc[tipo] || 0) + (gasto.valor || 0)
      return acc
    }, {})

    const total = Object.values(gastosPorTipo).reduce((sum: number, value: any) => sum + (value as number), 0)
    
    // Agrupar categorias com menos de 5% em "Outros"
    const categoriasAgrupadas: any = {}
    let outrosTotal = 0

    Object.entries(gastosPorTipo).forEach(([tipo, valor]) => {
      const percentual = (valor as number / total) * 100
      if (percentual >= 5) {
        categoriasAgrupadas[tipo] = valor
      } else {
        outrosTotal += valor as number
      }
    })

    // Adicionar "Outros" se houver categorias pequenas
    if (outrosTotal > 0) {
      categoriasAgrupadas['Outros'] = outrosTotal
    }

    return Object.entries(categoriasAgrupadas).map(([name, value]) => ({
      name,
      value: value as number
    }))
  }

  const getStatusDistribution = () => {
    const allOperations = [...reportData.plantio, ...reportData.colheita]
    const statusCounts = allOperations.reduce((acc: any, op) => {
      const status = op.status_execucao || 'Não definido'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const total = Object.values(statusCounts).reduce((sum: number, value: any) => sum + (value as number), 0)
    
    // Agrupar status com menos de 5% em "Outros"
    const statusAgrupados: any = {}
    let outrosTotal = 0

    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentual = (count as number / total) * 100
      if (percentual >= 5) {
        statusAgrupados[status] = count
      } else {
        outrosTotal += count as number
      }
    })

    // Adicionar "Outros" se houver status pequenos
    if (outrosTotal > 0) {
      statusAgrupados['Outros'] = outrosTotal
    }

    return Object.entries(statusAgrupados).map(([name, value]) => ({
      name,
      value: value as number
    }))
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
              <p className="mt-2 text-sm text-gray-600">
                Análises e relatórios detalhados das operações da fazenda.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button
                onClick={loadReportData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Início</label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Safra</label>
                  <select
                    value={filters.safraId}
                    onChange={(e) => handleFilterChange('safraId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todas as safras</option>
                    {referenceData.safras.map((safra) => (
                      <option key={safra.id} value={safra.id}>
                        {safra.safra}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Produção</label>
                  <select
                    value={filters.tipoProducaoId}
                    onChange={(e) => handleFilterChange('tipoProducaoId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os tipos</option>
                    {referenceData.tiposProducao.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome_producao}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                  <select
                    value={filters.funcionarioId}
                    onChange={(e) => handleFilterChange('funcionarioId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os funcionários</option>
                    {referenceData.funcionarios.map((funcionario) => (
                      <option key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Talhão</label>
                  <select
                    value={filters.talhaoId}
                    onChange={(e) => handleFilterChange('talhaoId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os talhões</option>
                    {referenceData.talhoes.map((talhao) => (
                      <option key={talhao.id} value={talhao.id}>
                        {talhao.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trator</label>
                  <select
                    value={filters.tratorId}
                    onChange={(e) => handleFilterChange('tratorId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os tratores</option>
                    {referenceData.tratores.map((trator) => (
                      <option key={trator.id} value={trator.id}>
                        {trator.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={filters.statusExecucao}
                    onChange={(e) => handleFilterChange('statusExecucao', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Mínimo</label>
                  <input
                    type="number"
                    value={filters.valorMinimo}
                    onChange={(e) => handleFilterChange('valorMinimo', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Máximo</label>
                  <input
                    type="number"
                    value={filters.valorMaximo}
                    onChange={(e) => handleFilterChange('valorMaximo', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Insumo</label>
                  <select
                    value={filters.tipoInsumo}
                    onChange={(e) => handleFilterChange('tipoInsumo', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpar
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gastos Totais</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalGastos)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Manutenções</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalManutencoes)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Horas</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatHours(totalHorasPlantio + totalHorasColheita)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Combustível</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalCombustivel.toFixed(1)}L</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos Mensais */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos Mensais</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
                  <Bar dataKey="manutencoes" fill="#f97316" name="Manutenções" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição de Gastos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição de Gastos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getExpenseDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const percentValue = (percent || 0) * 100
                      // Mostrar nome apenas para categorias com mais de 10%
                      if (percentValue > 10) {
                        return `${name} ${percentValue.toFixed(0)}%`
                      }
                      return `${percentValue.toFixed(0)}%`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {getExpenseDistribution().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
                          '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
                          '#A855F7', '#22C55E', '#EAB308', '#06B6D4', '#F59E0B', '#EF4444'
                        ][index % 18]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString('pt-BR')}`, 
                      name
                    ]}
                    labelFormatter={(label) => `${label} - Gastos`}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '15px'
                    }}
                    iconType="circle"
                    iconSize={8}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Operações Mensais */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Horas de Operação</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getOperationalData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatHours(value), 
                      name
                    ]}
                    labelFormatter={(label) => `${label} - Horas`}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="horasPlantio" stroke="#22c55e" name="Plantio" />
                  <Line type="monotone" dataKey="horasColheita" stroke="#3b82f6" name="Colheita" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status das Operações */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status das Operações</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const percentValue = (percent || 0) * 100
                      // Mostrar nome apenas para categorias com mais de 10%
                      if (percentValue > 10) {
                        return `${name} ${percentValue.toFixed(0)}%`
                      }
                      return `${percentValue.toFixed(0)}%`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
                          '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
                          '#A855F7', '#22C55E', '#EAB308', '#06B6D4', '#F59E0B', '#EF4444'
                        ][index % 18]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} operações`, 
                      name
                    ]}
                    labelFormatter={(label) => `${label} - Status`}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '12px',
                      paddingTop: '15px'
                    }}
                    iconType="circle"
                    iconSize={8}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabelas de Dados */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo dos Dados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Plantio</h4>
                  <p className="text-gray-600">{reportData.plantio.length} operações</p>
                  <p className="text-gray-600">{formatHours(totalHorasPlantio)} trabalhadas</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Colheita</h4>
                  <p className="text-gray-600">{reportData.colheita.length} operações</p>
                  <p className="text-gray-600">{formatHours(totalHorasColheita)} trabalhadas</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Manutenções</h4>
                  <p className="text-gray-600">{reportData.manutencoes.length} manutenções</p>
                  <p className="text-gray-600">{formatCurrency(totalManutencoes)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Gastos</h4>
                  <p className="text-gray-600">{reportData.gastos.length} registros</p>
                  <p className="text-gray-600">{formatCurrency(totalGastos)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}