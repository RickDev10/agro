'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/debug/rentabilidade')
        const result = await response.json()
        
        if (result.success) {
          setDebugData(result.debug)
        } else {
          setError(result.error || 'Erro ao carregar dados')
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError('Erro ao carregar dados de debugging')
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Rentabilidade</h1>
        <div className="text-gray-500">Carregando dados de debugging...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Rentabilidade</h1>
        <div className="text-red-500">Erro: {error}</div>
      </div>
    )
  }

  if (!debugData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Rentabilidade</h1>
        <div className="text-gray-500">Nenhum dado disponível</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug - Rentabilidade</h1>
      
      {/* Resumo */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">📊 Resumo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Safras encontradas:</strong> {debugData.safras_count}
          </div>
          <div>
            <strong>Gastos encontrados:</strong> {debugData.gastos_count}
          </div>
        </div>
      </div>

      {/* Safras */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">🌾 Safras</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Início</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Fim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Em Andamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lucro Esperado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debugData.safras?.map((safra: any) => (
                <tr key={safra.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{safra.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{safra.safra}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safra.data_inicio}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safra.data_fim || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      safra.em_andamento ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {safra.em_andamento ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safra.faturamento_total ? `R$ ${safra.faturamento_total.toLocaleString('pt-BR')}` : 'R$ 0,00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safra.lucro_esperado ? `R$ ${safra.lucro_esperado.toLocaleString('pt-BR')}` : 'R$ 0,00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos Gerais */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">💰 Gastos Gerais</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referência Tabela</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referência ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debugData.gastos_gerais?.map((gasto: any) => (
                <tr key={gasto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gasto.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gasto.tipo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{gasto.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {gasto.valor.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.data}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.referencia_tabela || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gasto.referencia_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cálculos de Exemplo */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">📈 Cálculos de Exemplo</h2>
        <div className="space-y-4">
          {debugData.exemplo_calculo?.map((calculo: any) => (
            <div key={calculo.safra_id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Safra: {calculo.safra}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>Receita Total:</strong><br />
                  <span className="text-green-600">R$ {calculo.receita_total.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <strong>Custos Totais:</strong><br />
                  <span className="text-red-600">R$ {calculo.custos_totais.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <strong>Lucro Líquido:</strong><br />
                  <span className={calculo.lucro_liquido >= 0 ? 'text-blue-600' : 'text-red-600'}>
                    R$ {calculo.lucro_liquido.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <strong>Qtd. Gastos:</strong><br />
                  <span className="text-gray-600">{calculo.gastos_count}</span>
                </div>
              </div>
              {Object.keys(calculo.custos_por_categoria).length > 0 && (
                <div className="mt-3">
                  <strong>Custos por Categoria:</strong>
                  <div className="mt-1 space-y-1">
                    {Object.entries(calculo.custos_por_categoria).map(([categoria, valor]) => (
                      <div key={categoria} className="text-sm">
                        <span className="font-medium">{categoria}:</span> R$ {Number(valor).toLocaleString('pt-BR')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
