'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function TestAuthPage() {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    try {
      console.log('🧪 Testando API com usuário logado...')
      
      // Obter o token
      const supabase = (await import('@/lib/supabase')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Não há token de acesso')
      }

      console.log('✅ Token encontrado, fazendo requisição...')

      // Fazer requisição com token
      const response = await fetch('/api/test-auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      setTestResult(result)
      
      if (response.ok) {
        console.log('🎉 Teste bem-sucedido!', result)
      } else {
        console.error('❌ Teste falhou:', result)
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setTestResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
        <p className="text-red-600">❌ Você precisa estar logado para testar</p>
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Fazer login
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">🧪 Teste de Autenticação da API</h1>
      
      <div className="bg-green-50 p-4 rounded mb-4">
        <h2 className="font-semibold text-green-800">✅ Usuário Logado:</h2>
        <p>Email: {user.email}</p>
        <p>ID: {user.id}</p>
      </div>

      <button
        onClick={testApi}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Testando...' : '🚀 Testar API Protegida'}
      </button>

      {testResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Resultado do Teste:</h3>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
          
          {testResult.success ? (
            <div className="mt-2 text-green-600 font-semibold">
              🎉 SUCESSO! A autenticação está funcionando!
            </div>
          ) : (
            <div className="mt-2 text-red-600 font-semibold">
              ❌ FALHOU! Há algo errado com a autenticação.
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Como funciona este teste:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Verifica se você está logado</li>
          <li>Obtém seu token de autenticação</li>
          <li>Faz uma requisição para /api/test-auth com o token</li>
          <li>Mostra o resultado da API protegida</li>
        </ol>
      </div>
    </div>
  )
}