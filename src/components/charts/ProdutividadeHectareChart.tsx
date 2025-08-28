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

interface ProdutividadeTalhao {
  talhao_id: number
  talhao_nome: string
  area_hectares: number
  horas_trabalhadas: number
  combustivel_consumido: number
  custo_operacional: number
  horas_por_hectare: number
  combustivel_por_hectare: number
  custo_por_hectare: number
  operacoes: number
}

interface ProdutividadeSafra {
  safra_id: number
  safra_nome: string
  area_total_utilizada: number
  producao_total: number
  receita_total: number
  horas_trabalhadas: number
  combustivel_consumido: number
  custo_operacional: number
  producao_por_hectare: number
  receita_por_hectare: number
  horas_por_hectare: number
  combustivel_por_hectare: number
  custo_por_hectare: number
  lucro_por_hectare: number
  status: string
  data_inicio: string
  data_fim?: string
}

interface ResumoGeral {
  area_total: number
  horas_trabalhadas_total: number
  combustivel_consumido_total: number
  custo_operacional_total: number
  horas_media_por_hectare: number
  combustivel_medio_por_hectare: number
  custo_medio_por_hectare: number
}

interface ProdutividadeData {
  por_talhao: ProdutividadeTalhao[]
  por_safra: ProdutividadeSafra[]
  resumo_geral: ResumoGeral
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

export default function ProdutividadeHectareChart() {
  const [data, setData] = useState<ProdutividadeData | null>(null)
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

        const response = await fetch(`/api/analytics/produtividade-hectare?${params}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Erro ao carregar dados')
        }
      } catch (err) {
        setError('Erro ao carregar dados de produtividade')
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
        <div className="text-gray-500">Carregando dados de produtividade...</div>
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
          <h3 className="text-sm font-medium text-gray-500">Área Total</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(data.resumo_geral.area_total)} ha
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Horas Média/ha</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(data.resumo_geral.horas_media_por_hectare)} h/ha
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Combustível Médio/ha</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatNumber(data.resumo_geral.combustivel_medio_por_hectare)} L/ha
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Custo Médio/ha</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(data.resumo_geral.custo_medio_por_hectare)}
          </p>
        </div>
      </div>

      {/* Gráficos por Talhão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtividade por Talhão */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Produtividade por Talhão
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_talhao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="talhao_nome" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'horas_por_hectare' ? `${value} h/ha` :
                  name === 'combustivel_por_hectare' ? `${value} L/ha` :
                  name === 'custo_por_hectare' ? formatCurrency(value) : value,
                  name === 'horas_por_hectare' ? 'Horas/ha' :
                  name === 'combustivel_por_hectare' ? 'Combustível/ha' :
                  name === 'custo_por_hectare' ? 'Custo/ha' : name
                ]}
              />
              <Legend />
              <Bar dataKey="horas_por_hectare" fill="#0088FE" name="Horas/ha" />
              <Bar dataKey="combustivel_por_hectare" fill="#FFBB28" name="Combustível/ha" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Custo por Hectare por Talhão */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Custo por Hectare por Talhão
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_talhao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="talhao_nome" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Custo/ha']}
              />
              <Bar dataKey="custo_por_hectare" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos por Safra */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por Hectare por Safra */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Produção por Hectare por Safra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.por_safra}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra_nome" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value} ton/ha`, 'Produção/ha']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="producao_por_hectare"
                stroke="#00C49F"
                strokeWidth={2}
                name="Produção/ha"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rentabilidade por Hectare por Safra */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rentabilidade por Hectare por Safra
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.por_safra}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra_nome" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'receita_por_hectare' ? 'Receita/ha' :
                  name === 'custo_por_hectare' ? 'Custo/ha' :
                  name === 'lucro_por_hectare' ? 'Lucro/ha' : name
                ]}
              />
              <Legend />
              <Bar dataKey="receita_por_hectare" fill="#82CA9D" name="Receita/ha" />
              <Bar dataKey="custo_por_hectare" fill="#FF8042" name="Custo/ha" />
              <Bar dataKey="lucro_por_hectare" fill="#8884D8" name="Lucro/ha" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela por Talhão */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhes por Talhão
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talhão
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área (ha)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas/ha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo/ha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.por_talhao.map((talhao) => (
                  <tr key={talhao.talhao_id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {talhao.talhao_nome}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(talhao.area_hectares)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(talhao.horas_por_hectare)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(talhao.custo_por_hectare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela por Safra */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhes por Safra
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safra
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produção/ha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lucro/ha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.por_safra.map((safra) => (
                  <tr key={safra.safra_id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {safra.safra_nome}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(safra.producao_por_hectare)} ton/ha
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(safra.lucro_por_hectare)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        safra.status === 'Em Andamento' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {safra.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
