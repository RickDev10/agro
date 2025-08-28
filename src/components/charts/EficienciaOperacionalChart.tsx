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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Truck, TrendingUp, Target, Calculator, BarChart3, Filter, Calendar, Crop } from 'lucide-react'
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

export default function EficienciaOperacionalChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    safraId: '',
    talhaoId: '',
    tratorId: '',
    funcionarioId: '',
    periodo: ''
  })
  const [opcoesFiltros, setOpcoesFiltros] = useState({
    safras: [],
    tratores: []
  })

  // Carregar opções dos filtros
  useEffect(() => {
    const carregarOpcoesFiltros = async () => {
      try {
        console.log('🔍 Carregando opções de filtros (SEGURO)...')
        
        const [safrasRes, tratoresRes] = await Promise.all([
          apiGet('/safras'),
          apiGet('/tratores')
        ])

        setOpcoesFiltros({
          safras: safrasRes.success ? safrasRes.data : [],
          tratores: tratoresRes.success ? tratoresRes.data : []
        })
        
        console.log('✅ Opções de filtros carregadas (SEGURO):', {
          safras: safrasRes.success ? safrasRes.data.length : 0,
          tratores: tratoresRes.success ? tratoresRes.data.length : 0
        })
      } catch (error) {
        console.error('❌ Erro ao carregar opções dos filtros:', error)
      }
    }

    carregarOpcoesFiltros()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Carregando dados de Eficiência Operacional (SEGURO)...')
        setLoading(true)
        
        const params = new URLSearchParams()
        if (filtros.safraId) params.append('safraId', filtros.safraId)
        if (filtros.talhaoId) params.append('talhaoId', filtros.talhaoId)
        if (filtros.tratorId) params.append('tratorId', filtros.tratorId)
        if (filtros.funcionarioId) params.append('funcionarioId', filtros.funcionarioId)
        if (filtros.periodo) params.append('periodo', filtros.periodo)

        const result = await apiGet(`/analytics/eficiencia-operacional?${params}`)
        
        if (result.success) {
          console.log('✅ Eficiência Operacional carregada (SEGURO):', result.data)
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

  // KPIs de Eficiência
  const kpisEficiencia = [
    {
      title: 'Eficiência Média',
      value: `${(data.resumoGeral?.eficiencia_media || 0).toFixed(1)} l/h`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total de Horas',
      value: formatNumber(data.resumoGeral?.total_horas || 0),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Combustível',
      value: `${formatNumber(data.resumoGeral?.total_combustivel || 0)} l`,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Custo Operacional',
      value: formatCurrency(data.resumoGeral?.custo_operacional_total || 0),
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  // Preparar dados para gráficos
  const performancePorTratorData = data.performancePorTrator?.map((trator: any) => ({
    trator: trator.trator_nome,
    eficiencia: trator.eficiencia_combustivel,
    horas: trator.horas_trabalhadas,
    custo: trator.custo_por_hora
  })) || []

  const produtividadePorSafraData = data.produtividadePorSafra?.map((safra: any) => ({
    safra: safra.safra_nome,
    eficiencia: safra.eficiencia_combustivel,
    horas: safra.horas_trabalhadas,
    combustivel: safra.combustivel_consumido
  })) || []

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Safra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Crop className="h-4 w-4 inline mr-1" />
              Safra
            </label>
            <select
              value={filtros.safraId}
              onChange={(e) => setFiltros(prev => ({ ...prev, safraId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todas as Safras</option>
              {opcoesFiltros.safras.map((safra: any) => (
                <option key={safra.id} value={safra.id}>
                  {safra.safra}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Trator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Truck className="h-4 w-4 inline mr-1" />
              Trator
            </label>
            <select
              value={filtros.tratorId}
              onChange={(e) => setFiltros(prev => ({ ...prev, tratorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todos os Tratores</option>
              {opcoesFiltros.tratores.map((trator: any) => (
                <option key={trator.id} value={trator.id}>
                  {trator.nome}
                </option>
              ))}
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
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {Object.values(filtros).some(valor => valor !== '') && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filtros ativos
              </span>
            )}
          </div>
          <button
            onClick={() => setFiltros({ safraId: '', talhaoId: '', tratorId: '', funcionarioId: '', periodo: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisEficiencia.map((kpi, index) => {
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
        {/* Performance por Trator */}
        {performancePorTratorData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Eficiência por Trator
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performancePorTratorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trator" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)} l/h`, 'Eficiência']} />
                <Bar dataKey="eficiencia" fill="#10B981" name="Eficiência (l/h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Horas Trabalhadas por Trator */}
        {performancePorTratorData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Horas Trabalhadas por Trator
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performancePorTratorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trator" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)} h`, 'Horas']} />
                <Bar dataKey="horas" fill="#F59E0B" name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Produtividade por Safra */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Produtividade por Safra
        </h3>
        {produtividadePorSafraData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={produtividadePorSafraData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)} l/h`, 'Eficiência']} />
              <Legend />
              <Line type="monotone" dataKey="eficiencia" stroke="#3B82F6" strokeWidth={3} name="Eficiência (l/h)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum dado de produtividade por safra disponível</p>
            <p className="text-sm mt-2">Verifique se existem operações registradas para as safras</p>
          </div>
        )}
      </div>

      {/* Tabela Detalhada */}
      {data.performancePorTrator && data.performancePorTrator.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Performance Detalhada por Trator
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Trabalhadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Combustível (l)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eficiência (l/h)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custo por Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.performancePorTrator.map((trator: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trator.trator_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(trator.horas_trabalhadas || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(trator.combustivel_consumido || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(trator.eficiencia_combustivel || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(trator.custo_por_hora || 0)}
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
