'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, apiPost, apiPut, apiRequest, formatDate } from '@/lib/api'
import type { TipoProducao, TipoProducaoFormData } from '@/types'

export default function TiposProducaoPage() {
  const [tiposProducao, setTiposProducao] = useState<TipoProducao[]>([])
  const [filteredTiposProducao, setFilteredTiposProducao] = useState<TipoProducao[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoProducao | null>(null)
  const [formData, setFormData] = useState<TipoProducaoFormData>({
    nome_producao: ''
  })

  // Mock data
  const mockTiposProducao: TipoProducao[] = [
    { id: 1, nome_producao: 'Soja', created_at: '2024-01-15' },
    { id: 2, nome_producao: 'Milho', created_at: '2024-01-15' },
    { id: 3, nome_producao: 'Feijão', created_at: '2024-01-15' },
    { id: 4, nome_producao: 'Arroz', created_at: '2024-01-15' },
    { id: 5, nome_producao: 'Trigo', created_at: '2024-01-15' },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('🔍 Carregando tipos de produção (SEGURO)...')
        
        const result = await apiGet('/tipos-producao')
        
        if (result.success) {
          console.log('✅ Tipos de produção carregados (SEGUROS):', result.data?.length || 0)
          setTiposProducao(result.data || [])
          setFilteredTiposProducao(result.data || [])
        } else {
          console.error('❌ Erro ao buscar tipos de produção:', result.error)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const filtered = tiposProducao.filter(tipo =>
      tipo.nome_producao.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTiposProducao(filtered)
  }, [searchTerm, tiposProducao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTipo) {
        // Atualizar tipo de produção existente
        console.log('🔍 Atualizando tipo de produção (SEGURO):', editingTipo.id)
        
        const result = await apiPut('/tipos-producao', { 
          id: editingTipo.id, 
          ...formData 
        })
        
        if (result.success) {
          console.log('✅ Tipo de produção atualizado (SEGURO):', result.data)
          // Atualizar o item específico na lista
          setTiposProducao(prev => prev.map(tipo => 
            tipo.id === editingTipo.id ? result.data : tipo
          ))
        } else {
          alert(`Erro: ${result.error}`)
        }
      } else {
        // Criar novo tipo de produção
        console.log('🔍 Criando novo tipo de produção (SEGURO)...')
        
        const result = await apiPost('/tipos-producao', formData)
        
        if (result.success) {
          console.log('✅ Tipo de produção criado (SEGURO):', result.data)
          // Adicionar o novo item no início da lista
          setTiposProducao(prev => [result.data, ...prev])
        } else {
          alert(`Erro: ${result.error}`)
        }
      }
      
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Erro ao salvar tipo de produção:', error)
      alert('Erro ao salvar tipo de produção. Verifique o console para mais detalhes.')
    }
  }

  const handleEdit = (tipo: TipoProducao) => {
    setEditingTipo(tipo)
    setFormData({
      nome_producao: tipo.nome_producao
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este tipo de produção?')) {
      try {
        console.log('🔍 Excluindo tipo de produção (SEGURO):', id)
        
        const result = await apiRequest(`/tipos-producao`, {
          method: 'DELETE',
          body: JSON.stringify({ id })
        })
        
        if (result.success) {
          console.log('✅ Tipo de produção excluído (SEGURO):', id)
          setTiposProducao(prev => prev.filter(tipo => tipo.id !== id))
        } else {
          alert(`Erro: ${result.error}`)
        }
      } catch (error) {
        console.error('❌ Erro ao excluir tipo de produção:', error)
        alert('Erro ao excluir tipo de produção. Verifique o console para mais detalhes.')
      }
    }
  }

  const resetForm = () => {
    setFormData({ nome_producao: '' })
    setEditingTipo(null)
  }

  const openModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  // Métricas
  const totalTipos = tiposProducao.length
  const tiposAtivos = tiposProducao.length
  const tiposRecentes = tiposProducao.filter(tipo => {
    const createdDate = new Date(tipo.created_at || '')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return createdDate > thirtyDaysAgo
  }).length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Tipos de Produção</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie os tipos de produção disponíveis no sistema.
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">TP</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Tipos</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalTipos}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tipos Ativos</dt>
                      <dd className="text-lg font-medium text-gray-900">{tiposAtivos}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Adicionados (30d)</dt>
                      <dd className="text-lg font-medium text-gray-900">{tiposRecentes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações e Filtros */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar tipos de produção..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>
            <div>
              <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tipo
              </button>
            </div>
          </div>

          {/* Tabela */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome da Produção
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            Carregando tipos de produção...
                          </td>
                        </tr>
                      ) : filteredTiposProducao.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            Nenhum tipo de produção encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredTiposProducao.map((tipo) => (
                        <tr key={tipo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{tipo.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tipo.nome_producao}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(tipo.created_at || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(tipo)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(tipo.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Moderno com Fundo Borrado */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Overlay com blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={closeModal}
              style={{ backdropFilter: 'blur(8px)' }}
            />
            
            {/* Modal container */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className="relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-300 w-full max-w-lg"
                style={{ 
                  animation: 'slideUp 0.3s ease-out',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingTipo ? 'Editar Tipo de Produção' : 'Novo Tipo de Produção'}
                      </h2>
                      <p className="text-purple-100 text-sm mt-1">
                        Configure as informações do tipo de produção
                      </p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                  {/* Nome da Produção */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-purple-600">🌾</span>
                      Nome da Produção *
                    </label>
                    <input
                      type="text"
                      id="nome_producao"
                      value={formData.nome_producao}
                      onChange={(e) => setFormData({ ...formData, nome_producao: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      placeholder="Ex: Soja, Milho, Feijão..."
                      required
                    />
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {editingTipo ? '✓ Atualizar Tipo' : '+ Cadastrar Tipo'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Estilos CSS para animações */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
