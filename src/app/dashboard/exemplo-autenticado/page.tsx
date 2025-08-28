'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'

export default function ExemploAutenticadoPage() {
  const { user, loading } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !loading) {
      fetchData()
    }
  }, [user, loading])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      setError(null)
      
      // Exemplo de GET autenticado
      const result = await apiGet('/analytics/dashboard-financeiro')
      setData(result)
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateData = async () => {
    try {
      setError(null)
      
      // Exemplo de POST autenticado
      const newData = {
        nome: 'Exemplo',
        valor: 100,
        data: new Date().toISOString()
      }
      
      const result = await apiPost('/exemplo-endpoint', newData)
      console.log('Dados criados:', result)
      
      // Recarregar dados
      await fetchData()
      
    } catch (error) {
      console.error('Erro ao criar dados:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Não autorizado</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Exemplo de Página Autenticada
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Último login:</strong> {new Date(user.last_sign_in_at || '').toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dados da API</h2>
            <button
              onClick={handleCreateData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Criar Dados
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700">Total Receita</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {data.totalReceita?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700">Total Custos</h3>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {data.totalCustos?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700">Margem de Lucro</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.margemLucro?.toFixed(1) || '0'}%
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Dados Completos</h3>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              Nenhum dado encontrado
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Como usar o utilitário de API autenticada:
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>GET:</strong> <code>const data = await apiGet('/endpoint')</code></p>
            <p><strong>POST:</strong> <code>const result = await apiPost('/endpoint', data)</code></p>
            <p><strong>PUT:</strong> <code>const result = await apiPut('/endpoint', data)</code></p>
            <p><strong>DELETE:</strong> <code>const result = await apiDelete('/endpoint')</code></p>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            O token de autenticação é automaticamente incluído em todas as requisições.
          </p>
        </div>
      </div>
    </div>
  )
}
