'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Users, 
  Wheat, 
  Package, 
  Truck, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Plus,
  ShoppingCart,
  Clock,
  Play,
  MapPin,
  User
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'



interface AtividadeAndamento {
  id: number
  tipo: 'plantio' | 'colheita'
  tipo_producao?: { nome_producao: string }
  talhao?: { nome: string }
  funcionario?: { nome: string }
  trator?: { nome: string }
  data_execucao: string
  duracao_horas?: number
}

export default function DashboardPage() {
  const [atividadesAndamento, setAtividadesAndamento] = useState<AtividadeAndamento[]>([])
  const [metrics, setMetrics] = useState({
    total_funcionarios: 0,
    safras_ativas: 0,
    insumos_baixo_estoque: 0,
    tratores_ativos: 0,
    gastos_mes_atual: 0,
    receita_mes_atual: 0,
    produtividade_media: 0,
    eficiencia_operacional: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Estados para dados dos gráficos
  const [receitaGastosData, setReceitaGastosData] = useState<any[]>([])
  const [produtividadeData, setProdutividadeData] = useState<any[]>([])
  const [gastosPorCategoria, setGastosPorCategoria] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  // Verificar se está no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Carregar métricas
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const { apiGet } = await import('@/lib/api')
        const result = await apiGet('/dashboard/metrics')
        
        if (result.success) {
          setMetrics(result.data)
        } else {
          console.error('Erro ao buscar métricas:', result.error)
        }
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  // Buscar atividades em andamento
  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const { apiGet } = await import('@/lib/api')
        const [plantio, colheita] = await Promise.all([
          apiGet('/historico-plantio'),
          apiGet('/historico-colheita')
        ])

        const atividadesPlantio = plantio.success ? 
          plantio.data.filter((p: any) => p.status === 'EXECUTANDO').map((p: any) => ({
            ...p,
            tipo: 'plantio' as const
          })) : []

        const atividadesColheita = colheita.success ? 
          colheita.data.filter((c: any) => c.status === 'EXECUTANDO').map((c: any) => ({
            ...c,
            tipo: 'colheita' as const
          })) : []

        setAtividadesAndamento([...atividadesPlantio, ...atividadesColheita])
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        setAtividadesAndamento([])
      }
    }

    fetchAtividades()
  }, [])

  // Carregar dados dos gráficos
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const { apiGet } = await import('@/lib/api')
        const [receitaGastos, produtividade, gastosCategoria] = await Promise.all([
          apiGet('/dashboard/receita-gastos'),
          apiGet('/dashboard/produtividade'),
          apiGet('/dashboard/gastos-categoria')
        ])

        if (receitaGastos.success && receitaGastos.data) {
          setReceitaGastosData(receitaGastos.data)
        }

        if (produtividade.success && produtividade.data) {
          setProdutividadeData(produtividade.data)
        }

        if (gastosCategoria.success && gastosCategoria.data) {
          setGastosPorCategoria(gastosCategoria.data)
        }
      } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error)
        setReceitaGastosData([])
        setProdutividadeData([])
        setGastosPorCategoria([])
      }
    }

    fetchChartData()
  }, [])

  // Renderizar gráficos apenas no cliente
  const renderChart = (chartComponent: React.ReactNode) => {
    if (!isClient) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p>Carregando gráficos...</p>
          </div>
        </div>
      )
    }
    return chartComponent
  }

  // KPIs detalhados (dependem do estado metrics)
  const kpisDetalhados = [
    {
      title: 'Produtividade Média',
              value: `${metrics.produtividade_media || 0}%`,
      change: '+2.3%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Eficiência Operacional',
              value: `${metrics.eficiencia_operacional || 0}%`,
      change: '+1.8%',
      changeType: 'positive',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Custos Operacionais',
              value: `R$ ${((metrics.gastos_mes_atual || 0) / 1000).toFixed(1)}k`,
      change: '-3.1%',
      changeType: 'negative',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Receita Mensal',
              value: `R$ ${((metrics.receita_mes_atual || 0) / 1000).toFixed(1)}k`,
      change: '+5.2%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ]

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Visão geral da sua propriedade agrícola</p>
            </div>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Funcionários
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.total_funcionarios || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Wheat className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Safras Ativas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.safras_ativas || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Baixo Estoque
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.insumos_baixo_estoque || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tratores Ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.tratores_ativos || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Detalhados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpisDetalhados.map((kpi, index) => {
              const Icon = kpi.icon
              return (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                          <Icon className={`h-6 w-6 ${kpi.color}`} />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {kpi.title}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {kpi.value}
                          </dd>
                          <dd className={`text-sm font-medium ${
                            kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {kpi.change}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Receita vs Gastos */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Receita vs Gastos
                </h3>
                {renderChart(
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={receitaGastosData || []} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="mes" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
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
                          paddingTop: '10px'
                        }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#10B981" 
                        fill="url(#colorReceita)" 
                        strokeWidth={2}
                        name="Receita" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="gastos" 
                        stroke="#EF4444" 
                        fill="url(#colorGastos)" 
                        strokeWidth={2}
                        name="Gastos" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Produtividade por Safra */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Produtividade por Safra
                </h3>
                {renderChart(
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={produtividadeData || []} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="safra" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, '']}
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
                          paddingTop: '10px'
                        }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar 
                        dataKey="produtividade" 
                        fill="#3B82F6" 
                        name="Produtividade"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="meta" 
                        fill="#10B981" 
                        name="Meta"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

                    {/* Gastos por Categoria */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Gastos por Categoria
              </h3>
              {gastosPorCategoria.length > 0 ? (
                renderChart(
                  <ResponsiveContainer width="100%" height={320}>
                    <RechartsPieChart>
                      <Pie
                        data={gastosPorCategoria}
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
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey="name"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {gastosPorCategoria.map((entry, index) => (
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p>Carregando dados...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Atividades em Andamento */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Atividades em Andamento
              </h3>
              {atividadesAndamento.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nenhuma atividade em andamento
                </div>
              ) : (
                <div className="space-y-4">
                  {atividadesAndamento.slice(0, 5).map((atividade) => (
                    <div key={atividade.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          atividade.tipo === 'plantio' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {atividade.tipo === 'plantio' ? (
                            <Play className="h-4 w-4 text-green-600" />
                          ) : (
                            <MapPin className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {atividade.tipo === 'plantio' ? 'Plantio' : 'Colheita'} - {atividade.tipo_producao?.nome_producao}
                          </p>
                          <p className="text-sm text-gray-500">
                            Talhão: {atividade.talhao?.nome} • Funcionário: {atividade.funcionario?.nome}
                          </p>
                          <p className="text-sm text-gray-500">
                            Trator: {atividade.trator?.nome}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(atividade.data_execucao).toLocaleDateString('pt-BR')}
                        </p>
                        {atividade.duracao_horas && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {atividade.duracao_horas}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
