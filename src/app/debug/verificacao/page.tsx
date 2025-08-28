'use client'

import { useState, useEffect } from 'react'
import { 
  Database, 
  TrendingUp, 
  Truck, 
  Package, 
  Map, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface VerificacaoData {
  resumo_dados: {
    safras: {
      total: number
      em_andamento: number
      concluidas: number
      com_faturamento: number
    }
    tratores: {
      total: number
      em_manutencao: number
    }
    talhoes: {
      total: number
      com_area: number
      sem_area: number
    }
    operacoes: {
      plantios: number
      colheitas: number
      total: number
    }
    gastos: {
      total: number
      por_tipo: {
        insumo: number
        combustivel: number
        manutencao: number
        outros: number
      }
    }
    movimentacoes: {
      combustivel: {
        total: number
        entradas: number
        saidas: number
      }
      insumos: {
        total: number
        entradas: number
        saidas: number
      }
    }
  }
  rentabilidade_manual: any[]
  performance_manual: any[]
  estoque_sobra_manual: {
    combustivel: {
      total_comprado: number
      total_utilizado: number
      sobra: number
      percentual_utilizacao: number
    }
    insumos: {
      total_comprado: number
      total_utilizado: number
      sobra: number
      percentual_utilizacao: number
    }
  }
  produtividade_manual: any[]
  dados_brutos: {
    safras: any[]
    tratores: any[]
    talhoes: any[]
    historico_plantio: any[]
    historico_colheita: any[]
    gastos_gerais: any[]
    movimentacoes_combustivel: any[]
    movimentacoes_insumos: any[]
  }
}

export default function VerificacaoPage() {
  const [data, setData] = useState<VerificacaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resumo')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/debug/verificacao-analytics')
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Erro ao carregar dados')
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError('Erro ao carregar dados de verificação')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando verificação...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Erro: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Nenhum dado disponível</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Verificação Completa das Análises
          </h1>
          <p className="text-gray-600">
            Comparação entre dados reais do banco e cálculos das análises
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'resumo', label: 'Resumo Geral', icon: Database },
              { id: 'rentabilidade', label: 'Rentabilidade', icon: TrendingUp },
              { id: 'performance', label: 'Performance', icon: Truck },
              { id: 'estoque', label: 'Estoque & Sobra', icon: Package },
              { id: 'produtividade', label: 'Produtividade', icon: Map },
              { id: 'dados', label: 'Dados Brutos', icon: Calculator }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Resumo Geral */}
          {activeTab === 'resumo' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Resumo Geral dos Dados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Safras */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Safras</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Total: <strong>{data.resumo_dados.safras.total}</strong></div>
                    <div>Em Andamento: <strong>{data.resumo_dados.safras.em_andamento}</strong></div>
                    <div>Concluídas: <strong>{data.resumo_dados.safras.concluidas}</strong></div>
                    <div>Com Faturamento: <strong>{data.resumo_dados.safras.com_faturamento}</strong></div>
                  </div>
                </div>

                {/* Tratores */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Tratores</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Total: <strong>{data.resumo_dados.tratores.total}</strong></div>
                    <div>Em Manutenção: <strong>{data.resumo_dados.tratores.em_manutencao}</strong></div>
                  </div>
                </div>

                {/* Talhões */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Map className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Talhões</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Total: <strong>{data.resumo_dados.talhoes.total}</strong></div>
                    <div>Com Área: <strong>{data.resumo_dados.talhoes.com_area}</strong></div>
                    <div>Sem Área: <strong>{data.resumo_dados.talhoes.sem_area}</strong></div>
                  </div>
                </div>

                {/* Operações */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Operações</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>Plantios: <strong>{data.resumo_dados.operacoes.plantios}</strong></div>
                    <div>Colheitas: <strong>{data.resumo_dados.operacoes.colheitas}</strong></div>
                    <div>Total: <strong>{data.resumo_dados.operacoes.total}</strong></div>
                  </div>
                </div>
              </div>

              {/* Gastos e Movimentações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Gastos */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-3">Gastos Gerais</h3>
                  <div className="space-y-2 text-sm">
                    <div>Total: <strong>{data.resumo_dados.gastos.total}</strong></div>
                    <div>Insumos: <strong>{data.resumo_dados.gastos.por_tipo.insumo}</strong></div>
                    <div>Combustível: <strong>{data.resumo_dados.gastos.por_tipo.combustivel}</strong></div>
                    <div>Manutenção: <strong>{data.resumo_dados.gastos.por_tipo.manutencao}</strong></div>
                    <div>Outros: <strong>{data.resumo_dados.gastos.por_tipo.outros}</strong></div>
                  </div>
                </div>

                {/* Movimentações */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">Movimentações</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Combustível:</strong>
                      <div className="ml-2">Total: {data.resumo_dados.movimentacoes.combustivel.total}</div>
                      <div className="ml-2">Entradas: {data.resumo_dados.movimentacoes.combustivel.entradas}</div>
                      <div className="ml-2">Saídas: {data.resumo_dados.movimentacoes.combustivel.saidas}</div>
                    </div>
                    <div>
                      <strong>Insumos:</strong>
                      <div className="ml-2">Total: {data.resumo_dados.movimentacoes.insumos.total}</div>
                      <div className="ml-2">Entradas: {data.resumo_dados.movimentacoes.insumos.entradas}</div>
                      <div className="ml-2">Saídas: {data.resumo_dados.movimentacoes.insumos.saidas}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rentabilidade */}
          {activeTab === 'rentabilidade' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Rentabilidade (Cálculo Manual)
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safra</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receita</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lucro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.rentabilidade_manual.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.safra_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(item.receita_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(item.custo_total)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          item.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(item.lucro)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.margem_lucro.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.operacoes_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance */}
          {activeTab === 'performance' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Performance Operacional (Cálculo Manual)
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combustível</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operações</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eficiência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.performance_manual.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.trator_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.horas_trabalhadas}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.combustivel_consumido}L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.operacoes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.eficiencia_combustivel} L/h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.custo_por_hora)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estoque e Sobra */}
          {activeTab === 'estoque' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque e Sobra (Cálculo Manual)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Combustível */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Combustível</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Comprado:</span>
                      <strong>{formatCurrency(data.estoque_sobra_manual.combustivel.total_comprado)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Utilizado:</span>
                      <strong>{formatCurrency(data.estoque_sobra_manual.combustivel.total_utilizado)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sobra:</span>
                      <strong className={data.estoque_sobra_manual.combustivel.sobra >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(data.estoque_sobra_manual.combustivel.sobra)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Utilização:</span>
                      <strong>{data.estoque_sobra_manual.combustivel.percentual_utilizacao.toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>

                {/* Insumos */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Insumos</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Comprado:</span>
                      <strong>{formatCurrency(data.estoque_sobra_manual.insumos.total_comprado)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Utilizado:</span>
                      <strong>{formatCurrency(data.estoque_sobra_manual.insumos.total_utilizado)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sobra:</span>
                      <strong className={data.estoque_sobra_manual.insumos.sobra >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(data.estoque_sobra_manual.insumos.sobra)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Utilização:</span>
                      <strong>{data.estoque_sobra_manual.insumos.percentual_utilizacao.toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Produtividade */}
          {activeTab === 'produtividade' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Map className="h-5 w-5" />
                Produtividade por Hectare (Cálculo Manual)
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talhão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área (ha)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combustível</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas/ha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo/ha</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.produtividade_manual.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.talhao_nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.area_hectares}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.horas_trabalhadas}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.combustivel_consumido}L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.custo_operacional)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.horas_por_hectare}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.custo_por_hectare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dados Brutos */}
          {activeTab === 'dados' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Dados Brutos do Banco
              </h2>
              
              <div className="space-y-6">
                {/* Safras */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Safras ({data.dados_brutos.safras.length})</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(data.dados_brutos.safras, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Gastos Gerais */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Gastos Gerais ({data.dados_brutos.gastos_gerais.length})</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(data.dados_brutos.gastos_gerais, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Movimentações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Movimentações Combustível ({data.dados_brutos.movimentacoes_combustivel.length})</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(data.dados_brutos.movimentacoes_combustivel, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-3">Movimentações Insumos ({data.dados_brutos.movimentacoes_insumos.length})</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(data.dados_brutos.movimentacoes_insumos, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
