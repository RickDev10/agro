'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Users, Plus, Search, Edit, Trash2, Phone } from 'lucide-react'
import type { Funcionario, FuncionarioFormData } from '@/types'
import { apiGet, apiPost, apiPut, apiDelete, apiRequest } from '@/lib/api'

export default function FuncionariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FuncionarioFormData>({
    nome: '',
    numero: ''
  })

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(false)

  // Carregar dados da API
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Carregando dados de funcionários...')
        setLoading(true)
        const result = await apiGet('/funcionarios')
        
        console.log('📊 Resultado da API:', result)
        
        if (result.success) {
          console.log('✅ Dados carregados com sucesso:', result.data?.length || 0, 'funcionários')
          setFuncionarios(result.data || [])
        } else {
          console.error('❌ Erro ao buscar funcionários:', result.error)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Estatísticas
  const totalFuncionarios = funcionarios.length

  // Filtrar funcionários
  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    funcionario.numero?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Atualizar funcionário existente
        const result = await apiPut('/funcionarios', { id: editingId, ...formData })
        
        if (result.success) {
          // Atualizar o item específico na lista
          setFuncionarios(prev => prev.map(funcionario => 
            funcionario.id === editingId ? result.data : funcionario
          ))
        } else {
          alert(`Erro: ${result.error}`)
        }
      } else {
        // Criar novo funcionário
        const result = await apiPost('/funcionarios', formData)
        
        if (result.success) {
          // Adicionar o novo item no início da lista
          setFuncionarios(prev => [result.data, ...prev])
        } else {
          alert(`Erro: ${result.error}`)
        }
      }
      
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error)
      alert('Erro ao salvar funcionário. Verifique o console para mais detalhes.')
    }
  }

  const handleEdit = (funcionario: Funcionario) => {
    setFormData({
      nome: funcionario.nome,
      numero: funcionario.numero || ''
    })
    setEditingId(funcionario.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return
    }

    try {
      const result = await apiRequest('/funcionarios', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      })
      
      if (result.success) {
        setFuncionarios(prev => prev.filter(funcionario => funcionario.id !== id))
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error)
      alert('Erro ao excluir funcionário. Verifique o console para mais detalhes.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      numero: ''
    })
    setEditingId(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
              <p className="text-gray-600">Gerencie os funcionários da propriedade</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Funcionário
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Funcionários</p>
                  <p className="text-2xl font-bold text-gray-900">{totalFuncionarios}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar funcionários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Carregando funcionários...
                      </td>
                    </tr>
                  ) : filteredFuncionarios.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Nenhum funcionário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredFuncionarios.map((funcionario) => (
                      <tr key={funcionario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {funcionario.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {funcionario.numero || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(funcionario.created_at || '').toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(funcionario)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(funcionario.id)}
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
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
                        </h2>
                        <p className="text-green-100 text-sm mt-1">
                          Preencha as informações abaixo
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
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Users className="w-4 h-4 inline mr-2 text-green-600" />
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2 text-green-600" />
                        Número de Telefone
                      </label>
                      <input
                        type="text"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      />
                    </div>
                    
                    {/* Botões com design moderno */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {editingId ? '✓ Atualizar' : '+ Cadastrar'}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
