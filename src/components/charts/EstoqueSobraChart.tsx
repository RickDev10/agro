'use client'

import { useState, useEffect } from 'react'
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
  Line
} from 'recharts'
import { Package, TrendingUp, Target, Calculator, BarChart3, Filter, Calendar } from 'lucide-react'
import { apiGet } from '@/lib/api'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function EstoqueSobraChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    safraId: '',
    periodo: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Carregando dados de Estoque e Sobra (SEGURO)...')
        setLoading(true)
        
        const params = new URLSearchParams()
        if (filtros.safraId) params.append('safraId', filtros.safraId)
        if (filtros.periodo) params.append('periodo', filtros.periodo)

        const result = await apiGet(`/analytics/estoque-sobra?${params}`)
        
        if (result.success) {
          console.log('✅ Estoque e Sobra carregado (SEGURO):', result.data)
          setData(result.data)
        } else {
          throw new Error(result.error || 'Erro ao carregar dados')
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filtros])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-red-600">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  // KPIs de Estoque
  const kpisEstoque = [
    {
      title: 'Estoque Total',
      value: formatCurrency((data.resumo_geral?.[0]?.total_comprado || 0) + (data.resumo_geral?.[1]?.total_comprado || 0)),
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Sobra Total',
      value: formatCurrency((data.resumo_geral?.[0]?.sobra || 0) + (data.resumo_geral?.[1]?.sobra || 0)),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Utilização Média',
      value: `${(((data.resumo_geral?.[0]?.percentual_utilizacao || 0) + (data.resumo_geral?.[1]?.percentual_utilizacao || 0)) / 2).toFixed(1)}%`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Custo de Estoque',
      value: formatCurrency((data.resumo_geral?.[0]?.total_comprado || 0) + (data.resumo_geral?.[1]?.total_comprado || 0)),
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  // Preparar dados para gráficos
  const estoquePorCategoriaData = data.resumo_geral?.map((categoria: any) => ({
    categoria: categoria.tipo === 'combustivel' ? 'Combustível' : 'Insumos',
    estoque: categoria.total_comprado,
    sobra: categoria.sobra,
    utilizacao: categoria.percentual_utilizacao
  })) || []

  const utilizacaoPorSafraData = data.utilizacao_por_safra?.map((safra: any) => ({
    safra: safra.safra_nome,
    utilizacao: safra.percentual_insumos,
    estoque: safra.insumos_utilizados,
    sobra: safra.combustivel_utilizado
  })) || []

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por Safra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safra
            </label>
            <select
              value={filtros.safraId}
              onChange={(e) => setFiltros(prev => ({ ...prev, safraId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todas as Safras</option>
              {/* Opções seriam carregadas dinamicamente */}
            </select>
          </div>

          {/* Filtro por Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período
            </label>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todo Período</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="90dias">Últimos 90 dias</option>
              <option value="6meses">Últimos 6 meses</option>
              <option value="1ano">Último ano</option>
            </select>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFiltros({ safraId: '', periodo: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisEstoque.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {kpi.title}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {kpi.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estoque vs Sobra por Categoria */}
        {estoquePorCategoriaData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estoque vs Sobra por Categoria
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estoquePorCategoriaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                <Legend />
                <Bar dataKey="estoque" fill="#10B981" name="Estoque" />
                <Bar dataKey="sobra" fill="#F59E0B" name="Sobra" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Utilização por Categoria */}
        {estoquePorCategoriaData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Utilização por Categoria
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estoquePorCategoriaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilização']} />
                <Bar dataKey="utilizacao" fill="#3B82F6" name="Utilização (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Utilização por Safra */}
      {utilizacaoPorSafraData.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Utilização por Safra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizacaoPorSafraData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilização']} />
              <Legend />
              <Line type="monotone" dataKey="utilizacao" stroke="#8B5CF6" strokeWidth={3} name="Utilização (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela Detalhada */}
      {data.resumo_geral && data.resumo_geral.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Estoque e Sobra por Categoria
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Comprado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Utilizado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sobra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilização
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.resumo_geral.map((categoria: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {categoria.tipo === 'combustivel' ? 'Combustível' : 'Insumos'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(categoria.total_comprado || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(categoria.total_utilizado || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(categoria.sobra || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(categoria.percentual_utilizacao || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
