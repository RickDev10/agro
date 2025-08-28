'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { DollarSign, TrendingUp, Target, Calculator, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { apiGet } from '@/lib/api'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function DashboardFinanceiroChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Carregando dados do Dashboard Financeiro (SEGURO)...')
        setError(null)
        
        const result = await apiGet('/analytics/dashboard-financeiro')
        
        if (result.success) {
          console.log('✅ Dashboard Financeiro carregado (SEGURO):', result.data)
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
  }, [])

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

  if (!data || !data.kpis) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  // KPIs detalhados
  const kpisDetalhados = [
    {
      title: 'Receita Total',
      value: formatCurrency(data.kpis?.receita || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Vendas',
      value: formatCurrency(data.kpis?.vendas || 0),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Custos',
      value: formatCurrency(data.kpis?.custos || 0),
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Margem de Lucro',
      value: formatPercentage(data.kpis?.margem || 0),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'ROI',
      value: formatPercentage(data.kpis?.roi || 0),
      icon: PieChartIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Custo por Hectare',
      value: formatCurrency(data.kpis?.custoPorHectare || 0),
      icon: Calculator,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  // Preparar dados para gráficos
  const receitaGastosData = data.margemPorCultura?.map((item: any) => ({
    safra: item.safra,
    receita: item.receita,
    custos: item.custos,
    lucro: item.lucro
  })) || []

  const sensibilidadeData = data.sensibilidade?.map((item: any) => ({
    variacao: `${item.variacao}%`,
    faturamento: item.faturamento,
    lucro: item.lucro,
    margem: item.margem
  })) || []

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpisDetalhados.map((kpi, index) => {
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

      {/* Gráfico Receita vs Gastos - Largura Total */}
      {receitaGastosData.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Receita vs Gastos por Safra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitaGastosData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
              <Legend />
              <Bar dataKey="receita" fill="#10B981" name="Receita" />
              <Bar dataKey="custos" fill="#EF4444" name="Custos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Break-even e Análise de Sensibilidade - Grid 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Break-even Analysis */}
        {data.breakEven && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Análise Break-even
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Ponto de Equilíbrio</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(data.breakEven.ponto_equilibrio || 0)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Receita mínima para cobrir custos
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Margem de Segurança</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatPercentage(data.breakEven.margem_seguranca || 0)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Quanto pode cair antes do prejuízo
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Margem de Contribuição</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatPercentage(data.breakEven.margem_contribuicao || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Calculator className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  Percentual que contribui para lucro
                </p>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Como interpretar:</strong> O ponto de equilíbrio mostra a receita mínima necessária para cobrir todos os custos. 
                A margem de segurança indica quanto a receita pode cair antes de gerar prejuízo. 
                A margem de contribuição mostra o percentual da receita que contribui para o lucro após cobrir custos variáveis.
              </p>
            </div>
          </div>
        )}

        {/* Análise de Sensibilidade */}
        {sensibilidadeData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Análise de Sensibilidade
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensibilidadeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variacao" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                <Legend />
                <Line type="monotone" dataKey="faturamento" stroke="#3B82F6" strokeWidth={3} name="Faturamento" />
                <Line type="monotone" dataKey="lucro" stroke="#10B981" strokeWidth={3} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela Detalhada */}
      {data.margemPorCultura && data.margemPorCultura.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Margem por Cultura
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Safra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lucro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.margemPorCultura.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.safra}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.receita || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.custos || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.lucro || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(item.margem || 0)}
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
