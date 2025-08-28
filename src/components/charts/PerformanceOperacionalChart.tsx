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
import { Filter, Calendar, Truck, Crop } from 'lucide-react'

interface PerformanceTrator {
  trator_id: number
  trator_nome: string
  horas_trabalhadas: number
  combustivel_consumido: number
  operacoes: number
  eficiencia_combustivel: number
  custo_por_hora: number
  produtividade_operacoes: number
}

interface PerformanceData {
  por_trator: PerformanceTrator[]
  resumo_geral: {
    total_horas: number
    total_combustivel: number
    total_operacoes: number
    eficiencia_media: number
    custo_medio_por_hora: number
  }
}

interface Safra {
  id: number
  safra: string
  data_inicio: string
  data_fim?: string
}

interface Trator {
  id: number
  nome: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function PerformanceOperacionalChart() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [safras, setSafras] = useState<Safra[]>([])
  const [tratores, setTratores] = useState<Trator[]>([])
  
  // Filtros
  const [filtros, setFiltros] = useState({
    safraId: '',
    dataInicio: '',
    dataFim: '',
    tratorId: ''
  })

  useEffect(() => {
    const fetchSafras = async () => {
      try {
        const response = await fetch('/api/safras')
        const result = await response.json()
        if (result.success) {
          setSafras(result.data || [])
        }
      } catch (err) {
        console.error('Erro ao carregar safras:', err)
      }
    }

    const fetchTratores = async () => {
      try {
        const response = await fetch('/api/tratores')
        const result = await response.json()
        if (result.success) {
          setTratores(result.data || [])
        }
      } catch (err) {
        console.error('Erro ao carregar tratores:', err)
      }
    }

    fetchSafras()
    fetchTratores()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (filtros.safraId) params.append('safraId', filtros.safraId)
        if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
        if (filtros.dataFim) params.append('dataFim', filtros.dataFim)
        if (filtros.tratorId) params.append('tratorId', filtros.tratorId)

        const response = await fetch(`/api/analytics/performance-operacional?${params}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Erro ao carregar dados')
        }
      } catch (err) {
        setError('Erro ao carregar dados de performance')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [filtros])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const limparFiltros = () => {
    setFiltros({
      safraId: '',
      dataInicio: '',
      dataFim: '',
      tratorId: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dados de performance...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Erro: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800">Nenhum dado disponível</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Safra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Crop className="h-4 w-4 inline mr-1" />
              Safra
            </label>
            <select
              value={filtros.safraId}
              onChange={(e) => setFiltros({ ...filtros, safraId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todas as safras</option>
              {safras.map((safra) => (
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
              onChange={(e) => setFiltros({ ...filtros, tratorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              <option value="">Todos os tratores</option>
              {tratores.map((trator) => (
                <option key={trator.id} value={trator.id}>
                  {trator.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>

          {/* Filtro por Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={limparFiltros}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Total de Horas</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(data.resumo_geral.total_horas)} h
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Combustível Total</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatNumber(data.resumo_geral.total_combustivel)} L
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Total de Operações</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(data.resumo_geral.total_operacoes)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Eficiência Média</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatNumber(data.resumo_geral.eficiencia_media)} L/h
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas Trabalhadas por Trator */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Horas Trabalhadas por Trator
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_trator}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trator_nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} h`, 'Horas']} />
              <Bar dataKey="horas_trabalhadas" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Combustível Consumido por Trator */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Combustível Consumido por Trator
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_trator}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trator_nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} L`, 'Combustível']} />
              <Bar dataKey="combustivel_consumido" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos de Eficiência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eficiência de Combustível */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Eficiência de Combustível (L/h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.por_trator}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trator_nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} L/h`, 'Eficiência']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="eficiencia_combustivel"
                stroke="#00C49F"
                strokeWidth={2}
                name="Eficiência"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Custo por Hora */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Custo por Hora por Trator
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_trator}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trator_nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Custo/h']} />
              <Bar dataKey="custo_por_hora" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalhes por Trator
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trator
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Trabalhadas
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combustível (L)
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operações
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eficiência (L/h)
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custo/h
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.por_trator.map((trator) => (
                <tr key={trator.trator_id}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trator.trator_nome}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(trator.horas_trabalhadas)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(trator.combustivel_consumido)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(trator.operacoes)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(trator.eficiencia_combustivel)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(trator.custo_por_hora)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
