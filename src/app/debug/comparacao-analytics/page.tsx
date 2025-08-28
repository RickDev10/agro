'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Truck, 
  Package, 
  Map, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react'

interface ComparacaoData {
  rentabilidade: {
    api: any
    manual: any
    diferencas: any[]
  }
  performance: {
    api: any
    manual: any
    diferencas: any[]
  }
  estoque: {
    api: any
    manual: any
    diferencas: any[]
  }
  produtividade: {
    api: any
    manual: any
    diferencas: any[]
  }
}

export default function ComparacaoPage() {
  const [data, setData] = useState<ComparacaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('rentabilidade')

  useEffect(() => {
    fetchComparacao()
  }, [])

  const fetchComparacao = async () => {
    try {
      setLoading(true)
      
      // Buscar dados manuais
      const manualResponse = await fetch('/api/debug/verificacao-analytics')
      const manualResult = await manualResponse.json()
      
      if (!manualResult.success) {
        throw new Error('Erro ao carregar dados manuais')
      }

      // Buscar dados das APIs de analytics
      const [rentabilidadeApi, performanceApi, estoqueApi, produtividadeApi] = await Promise.all([
        fetch('/api/analytics/rentabilidade').then(r => r.json()),
        fetch('/api/analytics/performance-operacional').then(r => r.json()),
        fetch('/api/analytics/estoque-sobra').then(r => r.json()),
        fetch('/api/analytics/produtividade-hectare').then(r => r.json())
      ])

      // Comparar dados
      const comparacao: ComparacaoData = {
        rentabilidade: {
          api: rentabilidadeApi.success ? rentabilidadeApi.data : null,
          manual: manualResult.data.rentabilidade_manual,
          diferencas: compararRentabilidade(
            rentabilidadeApi.success ? rentabilidadeApi.data : null,
            manualResult.data.rentabilidade_manual
          )
        },
        performance: {
          api: performanceApi.success ? performanceApi.data : null,
          manual: manualResult.data.performance_manual,
          diferencas: compararPerformance(
            performanceApi.success ? performanceApi.data : null,
            manualResult.data.performance_manual
          )
        },
        estoque: {
          api: estoqueApi.success ? estoqueApi.data : null,
          manual: manualResult.data.estoque_sobra_manual,
          diferencas: compararEstoque(
            estoqueApi.success ? estoqueApi.data : null,
            manualResult.data.estoque_sobra_manual
          )
        },
        produtividade: {
          api: produtividadeApi.success ? produtividadeApi.data : null,
          manual: manualResult.data.produtividade_manual,
          diferencas: compararProdutividade(
            produtividadeApi.success ? produtividadeApi.data : null,
            manualResult.data.produtividade_manual
          )
        }
      }

      setData(comparacao)
    } catch (error) {
      console.error('Erro na comparação:', error)
      setError('Erro ao carregar dados de comparação')
    } finally {
      setLoading(false)
    }
  }

  const compararRentabilidade = (api: any, manual: any[]) => {
    if (!api || !manual) return []
    
    const diferencas = []
    
    // Comparar por safra
    api.por_safra?.forEach((safraApi: any) => {
      const safraManual = manual.find((s: any) => s.safra_id === safraApi.safra_id)
      if (safraManual) {
        const diffReceita = Math.abs(safraApi.receita_total - safraManual.receita_total)
        const diffCusto = Math.abs(safraApi.custo_total - safraManual.custo_total)
        const diffLucro = Math.abs(safraApi.lucro - safraManual.lucro)
        
        if (diffReceita > 0.01 || diffCusto > 0.01 || diffLucro > 0.01) {
          diferencas.push({
            tipo: 'rentabilidade_safra',
            safra_id: safraApi.safra_id,
            safra_nome: safraApi.safra_nome,
            campo: 'valores',
            api: {
              receita: safraApi.receita_total,
              custo: safraApi.custo_total,
              lucro: safraApi.lucro
            },
            manual: {
              receita: safraManual.receita_total,
              custo: safraManual.custo_total,
              lucro: safraManual.lucro
            },
            diferenca: {
              receita: diffReceita,
              custo: diffCusto,
              lucro: diffLucro
            }
          })
        }
      }
    })
    
    return diferencas
  }

  const compararPerformance = (api: any, manual: any[]) => {
    if (!api || !manual) return []
    
    const diferencas = []
    
    api.por_trator?.forEach((tratorApi: any) => {
      const tratorManual = manual.find((t: any) => t.trator_id === tratorApi.trator_id)
      if (tratorManual) {
        const diffHoras = Math.abs(tratorApi.horas_trabalhadas - tratorManual.horas_trabalhadas)
        const diffCombustivel = Math.abs(tratorApi.combustivel_consumido - tratorManual.combustivel_consumido)
        const diffCustoHora = Math.abs(tratorApi.custo_por_hora - tratorManual.custo_por_hora)
        
        if (diffHoras > 0.01 || diffCombustivel > 0.01 || diffCustoHora > 0.01) {
          diferencas.push({
            tipo: 'performance_trator',
            trator_id: tratorApi.trator_id,
            trator_nome: tratorApi.trator_nome,
            campo: 'metricas',
            api: {
              horas: tratorApi.horas_trabalhadas,
              combustivel: tratorApi.combustivel_consumido,
              custo_hora: tratorApi.custo_por_hora
            },
            manual: {
              horas: tratorManual.horas_trabalhadas,
              combustivel: tratorManual.combustivel_consumido,
              custo_hora: tratorManual.custo_por_hora
            },
            diferenca: {
              horas: diffHoras,
              combustivel: diffCombustivel,
              custo_hora: diffCustoHora
            }
          })
        }
      }
    })
    
    return diferencas
  }

  const compararEstoque = (api: any, manual: any) => {
    if (!api || !manual) return []
    
    const diferencas = []
    
    // Comparar combustível
    const combustivelApi = api.resumo_geral?.find((item: any) => item.tipo === 'combustivel')
    if (combustivelApi && manual.combustivel) {
      const diffComprado = Math.abs(combustivelApi.total_comprado - manual.combustivel.total_comprado)
      const diffUtilizado = Math.abs(combustivelApi.total_utilizado - manual.combustivel.total_utilizado)
      const diffSobra = Math.abs(combustivelApi.sobra - manual.combustivel.sobra)
      
      if (diffComprado > 0.01 || diffUtilizado > 0.01 || diffSobra > 0.01) {
        diferencas.push({
          tipo: 'estoque_combustivel',
          campo: 'valores',
          api: {
            comprado: combustivelApi.total_comprado,
            utilizado: combustivelApi.total_utilizado,
            sobra: combustivelApi.sobra
          },
          manual: {
            comprado: manual.combustivel.total_comprado,
            utilizado: manual.combustivel.total_utilizado,
            sobra: manual.combustivel.sobra
          },
          diferenca: {
            comprado: diffComprado,
            utilizado: diffUtilizado,
            sobra: diffSobra
          }
        })
      }
    }
    
    // Comparar insumos
    const insumosApi = api.resumo_geral?.find((item: any) => item.tipo === 'insumos')
    if (insumosApi && manual.insumos) {
      const diffComprado = Math.abs(insumosApi.total_comprado - manual.insumos.total_comprado)
      const diffUtilizado = Math.abs(insumosApi.total_utilizado - manual.insumos.total_utilizado)
      const diffSobra = Math.abs(insumosApi.sobra - manual.insumos.sobra)
      
      if (diffComprado > 0.01 || diffUtilizado > 0.01 || diffSobra > 0.01) {
        diferencas.push({
          tipo: 'estoque_insumos',
          campo: 'valores',
          api: {
            comprado: insumosApi.total_comprado,
            utilizado: insumosApi.total_utilizado,
            sobra: insumosApi.sobra
          },
          manual: {
            comprado: manual.insumos.total_comprado,
            utilizado: manual.insumos.total_utilizado,
            sobra: manual.insumos.sobra
          },
          diferenca: {
            comprado: diffComprado,
            utilizado: diffUtilizado,
            sobra: diffSobra
          }
        })
      }
    }
    
    return diferencas
  }

  const compararProdutividade = (api: any, manual: any[]) => {
    if (!api || !manual) return []
    
    const diferencas = []
    
    // Comparar por talhão
    api.por_talhao?.forEach((talhaoApi: any) => {
      const talhaoManual = manual.find((t: any) => t.talhao_id === talhaoApi.talhao_id)
      if (talhaoManual) {
        const diffHoras = Math.abs(talhaoApi.horas_trabalhadas - talhaoManual.horas_trabalhadas)
        const diffCombustivel = Math.abs(talhaoApi.combustivel_consumido - talhaoManual.combustivel_consumido)
        const diffCusto = Math.abs(talhaoApi.custo_operacional - talhaoManual.custo_operacional)
        
        if (diffHoras > 0.01 || diffCombustivel > 0.01 || diffCusto > 0.01) {
          diferencas.push({
            tipo: 'produtividade_talhao',
            talhao_id: talhaoApi.talhao_id,
            talhao_nome: talhaoApi.talhao_nome,
            campo: 'metricas',
            api: {
              horas: talhaoApi.horas_trabalhadas,
              combustivel: talhaoApi.combustivel_consumido,
              custo: talhaoApi.custo_operacional
            },
            manual: {
              horas: talhaoManual.horas_trabalhadas,
              combustivel: talhaoManual.combustivel_consumido,
              custo: talhaoManual.custo_operacional
            },
            diferenca: {
              horas: diffHoras,
              combustivel: diffCombustivel,
              custo: diffCusto
            }
          })
        }
      }
    })
    
    return diferencas
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusIcon = (diferencas: any[]) => {
    if (diferencas.length === 0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (diferencas.length <= 3) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (diferencas: any[]) => {
    if (diferencas.length === 0) {
      return '✅ Dados Corretos'
    } else if (diferencas.length <= 3) {
      return '⚠️ Pequenas Diferenças'
    } else {
      return '❌ Diferenças Significativas'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando comparação...</div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔍 Comparação das Análises
              </h1>
              <p className="text-gray-600">
                Comparação entre APIs de analytics e cálculos manuais
              </p>
            </div>
            <button
              onClick={fetchComparacao}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              id: 'rentabilidade', 
              label: 'Rentabilidade', 
              icon: TrendingUp, 
              diferencas: data.rentabilidade.diferencas 
            },
            { 
              id: 'performance', 
              label: 'Performance', 
              icon: Truck, 
              diferencas: data.performance.diferencas 
            },
            { 
              id: 'estoque', 
              label: 'Estoque & Sobra', 
              icon: Package, 
              diferencas: data.estoque.diferencas 
            },
            { 
              id: 'produtividade', 
              label: 'Produtividade', 
              icon: Map, 
              diferencas: data.produtividade.diferencas 
            }
          ].map((analise) => {
            const Icon = analise.icon
            return (
              <div key={analise.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{analise.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(analise.diferencas)}
                  <span className="text-sm">{getStatusText(analise.diferencas)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analise.diferencas.length} diferença(s) encontrada(s)
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'rentabilidade', label: 'Rentabilidade', icon: TrendingUp },
              { id: 'performance', label: 'Performance', icon: Truck },
              { id: 'estoque', label: 'Estoque & Sobra', icon: Package },
              { id: 'produtividade', label: 'Produtividade', icon: Map }
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
          {/* Rentabilidade */}
          {activeTab === 'rentabilidade' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Comparação - Rentabilidade
              </h2>
              
              {data.rentabilidade.diferencas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">✅ Todos os dados de rentabilidade estão corretos!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.rentabilidade.diferencas.map((diff, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Diferença na Safra: {diff.safra_nome}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Receita:</strong>
                          <div>API: {formatCurrency(diff.api.receita)}</div>
                          <div>Manual: {formatCurrency(diff.manual.receita)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.receita)}</div>
                        </div>
                        <div>
                          <strong>Custo:</strong>
                          <div>API: {formatCurrency(diff.api.custo)}</div>
                          <div>Manual: {formatCurrency(diff.manual.custo)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.custo)}</div>
                        </div>
                        <div>
                          <strong>Lucro:</strong>
                          <div>API: {formatCurrency(diff.api.lucro)}</div>
                          <div>Manual: {formatCurrency(diff.manual.lucro)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.lucro)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance */}
          {activeTab === 'performance' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Comparação - Performance Operacional
              </h2>
              
              {data.performance.diferencas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">✅ Todos os dados de performance estão corretos!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.performance.diferencas.map((diff, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Diferença no Trator: {diff.trator_nome}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Horas Trabalhadas:</strong>
                          <div>API: {diff.api.horas}h</div>
                          <div>Manual: {diff.manual.horas}h</div>
                          <div className="text-red-600">Diferença: {diff.diferenca.horas}h</div>
                        </div>
                        <div>
                          <strong>Combustível:</strong>
                          <div>API: {diff.api.combustivel}L</div>
                          <div>Manual: {diff.manual.combustivel}L</div>
                          <div className="text-red-600">Diferença: {diff.diferenca.combustivel}L</div>
                        </div>
                        <div>
                          <strong>Custo/Hora:</strong>
                          <div>API: {formatCurrency(diff.api.custo_hora)}</div>
                          <div>Manual: {formatCurrency(diff.manual.custo_hora)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.custo_hora)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estoque */}
          {activeTab === 'estoque' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Comparação - Estoque e Sobra
              </h2>
              
              {data.estoque.diferencas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">✅ Todos os dados de estoque estão corretos!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.estoque.diferencas.map((diff, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Diferença em {diff.tipo === 'estoque_combustivel' ? 'Combustível' : 'Insumos'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Total Comprado:</strong>
                          <div>API: {formatCurrency(diff.api.comprado)}</div>
                          <div>Manual: {formatCurrency(diff.manual.comprado)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.comprado)}</div>
                        </div>
                        <div>
                          <strong>Total Utilizado:</strong>
                          <div>API: {formatCurrency(diff.api.utilizado)}</div>
                          <div>Manual: {formatCurrency(diff.manual.utilizado)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.utilizado)}</div>
                        </div>
                        <div>
                          <strong>Sobra:</strong>
                          <div>API: {formatCurrency(diff.api.sobra)}</div>
                          <div>Manual: {formatCurrency(diff.manual.sobra)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.sobra)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Produtividade */}
          {activeTab === 'produtividade' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Map className="h-5 w-5" />
                Comparação - Produtividade por Hectare
              </h2>
              
              {data.produtividade.diferencas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">✅ Todos os dados de produtividade estão corretos!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.produtividade.diferencas.map((diff, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Diferença no Talhão: {diff.talhao_nome}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Horas Trabalhadas:</strong>
                          <div>API: {diff.api.horas}h</div>
                          <div>Manual: {diff.manual.horas}h</div>
                          <div className="text-red-600">Diferença: {diff.diferenca.horas}h</div>
                        </div>
                        <div>
                          <strong>Combustível:</strong>
                          <div>API: {diff.api.combustivel}L</div>
                          <div>Manual: {diff.manual.combustivel}L</div>
                          <div className="text-red-600">Diferença: {diff.diferenca.combustivel}L</div>
                        </div>
                        <div>
                          <strong>Custo Operacional:</strong>
                          <div>API: {formatCurrency(diff.api.custo)}</div>
                          <div>Manual: {formatCurrency(diff.manual.custo)}</div>
                          <div className="text-red-600">Diferença: {formatCurrency(diff.diferenca.custo)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
