'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

interface DebugData {
  historico_plantio: {
    registros: number
    combustivel_total: number
    horas_total: number
    detalhes: any[]
  }
  historico_colheita: {
    registros: number
    combustivel_total: number
    horas_total: number
    detalhes: any[]
  }
  totais: {
    combustivel_total_historicos: number
    horas_total: number
    eficiencia_calculada: number
  }
  gastos_combustivel: {
    registros: number
    valor_total: number
    detalhes: any[]
  }
  movimentacoes: {
    registros: number
    entradas: number
    saidas: number
    saldo: number
  }
  analise: {
    problema_identificado: string
    combustivel_esperado_para_12_9_l_h: number
    diferenca: number
    possiveis_causas: string[]
  }
}

export default function DebugCombustivelPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/debug/combustivel')
        const result = await response.json()
        
        if (response.ok) {
          setData(result)
        } else {
          setError(result.error || 'Erro ao buscar dados')
        }
      } catch (err) {
        setError('Erro de conexão')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg">Carregando dados de debug...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-500">Erro: {error}</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Debug - Dados de Combustível</h1>
          
          {data && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">📊 Resumo Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-blue-600">Combustível Total (Históricos)</div>
                    <div className="text-2xl font-bold text-blue-800">{data.totais.combustivel_total_historicos} L</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600">Horas Totais</div>
                    <div className="text-2xl font-bold text-green-800">{data.totais.horas_total} h</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-purple-600">Eficiência Calculada</div>
                    <div className="text-2xl font-bold text-purple-800">{data.totais.eficiencia_calculada} L/h</div>
                  </div>
                </div>
              </div>

              {/* Análise da Inconsistência */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">🔍 Análise da Inconsistência</h2>
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded">
                    <div className="text-sm text-yellow-600">Problema Identificado</div>
                    <div className="font-semibold text-yellow-800">{data.analise.problema_identificado}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Combustível Esperado (12,9 L/h)</div>
                      <div className="font-semibold">{data.analise.combustivel_esperado_para_12_9_l_h} L</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Diferença</div>
                      <div className={`font-semibold ${data.analise.diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {data.analise.diferenca > 0 ? '+' : ''}{data.analise.diferenca} L
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Possíveis Causas:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {data.analise.possiveis_causas.map((causa, index) => (
                        <li key={index} className="text-gray-700">{causa}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Histórico de Plantio */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">🌱 Histórico de Plantio</h2>
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Total: {data.historico_plantio.combustivel_total} L / {data.historico_plantio.horas_total} h</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Trator</th>
                        <th className="px-4 py-2 text-left">Talhão</th>
                        <th className="px-4 py-2 text-left">Safra</th>
                        <th className="px-4 py-2 text-left">Combustível (L)</th>
                        <th className="px-4 py-2 text-left">Horas</th>
                        <th className="px-4 py-2 text-left">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.historico_plantio.detalhes.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{item.id}</td>
                          <td className="px-4 py-2">{item.trator_id}</td>
                          <td className="px-4 py-2">{item.talhao_id}</td>
                          <td className="px-4 py-2">{item.safra_id}</td>
                          <td className="px-4 py-2">{item.combustivel}</td>
                          <td className="px-4 py-2">{item.duracao_horas}</td>
                          <td className="px-4 py-2">{item.data_execucao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Histórico de Colheita */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">🌾 Histórico de Colheita</h2>
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Total: {data.historico_colheita.combustivel_total} L / {data.historico_colheita.horas_total} h</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Trator</th>
                        <th className="px-4 py-2 text-left">Talhão</th>
                        <th className="px-4 py-2 text-left">Safra</th>
                        <th className="px-4 py-2 text-left">Combustível (L)</th>
                        <th className="px-4 py-2 text-left">Horas</th>
                        <th className="px-4 py-2 text-left">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.historico_colheita.detalhes.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{item.id}</td>
                          <td className="px-4 py-2">{item.trator_id}</td>
                          <td className="px-4 py-2">{item.talhao_id}</td>
                          <td className="px-4 py-2">{item.safra_id}</td>
                          <td className="px-4 py-2">{item.combustivel}</td>
                          <td className="px-4 py-2">{item.duracao_horas}</td>
                          <td className="px-4 py-2">{item.data_execucao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gastos de Combustível */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">💰 Gastos de Combustível</h2>
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Total: R$ {data.gastos_combustivel.valor_total}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Valor (R$)</th>
                        <th className="px-4 py-2 text-left">Referência</th>
                        <th className="px-4 py-2 text-left">Tabela</th>
                        <th className="px-4 py-2 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.gastos_combustivel.detalhes.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{item.id}</td>
                          <td className="px-4 py-2">R$ {item.valor}</td>
                          <td className="px-4 py-2">{item.referencia_id}</td>
                          <td className="px-4 py-2">{item.referencia_tabela}</td>
                          <td className="px-4 py-2">{item.descricao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movimentações */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">🔄 Movimentações de Combustível</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600">Entradas</div>
                    <div className="text-xl font-bold text-green-800">{data.movimentacoes.entradas} L</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-sm text-red-600">Saídas</div>
                    <div className="text-xl font-bold text-red-800">{data.movimentacoes.saidas} L</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-blue-600">Saldo</div>
                    <div className="text-xl font-bold text-blue-800">{data.movimentacoes.saldo} L</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
