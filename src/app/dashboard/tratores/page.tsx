'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

import { formatDate } from '@/lib/api'
import { Truck, Plus, Search, Edit, Trash2, Wrench, Clock } from 'lucide-react'
import type { Trator, TratorFormData } from '@/types'

export default function TratoresPage() {
  const [tratores, setTratores] = useState<Trator[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<TratorFormData>({
    nome: '',
    tempo_prox_manutencao: 0,
    em_manutencao: false
  })

  // Carregar dados da API (SEGURO)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { apiGet } = await import('@/lib/api')
        const result = await apiGet('/tratores')
        
        console.log('📊 Resultado da API tratores:', result)
        if (result.success) {
          setTratores(result.data || [])
          console.log('✅ Dados carregados com sucesso:', (result.data || []).length, 'tratores')
        } else {
          console.error('❌ Erro ao buscar tratores:', result.error)
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
  const totalTratores = tratores.length
  const tratoresEmManutencao = tratores.filter(t => t.em_manutencao).length
  const tratoresAtivos = totalTratores - tratoresEmManutencao

  // Filtrar tratores
  const filteredTratores = tratores.filter(trator =>
    trator.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { apiPost, apiPut } = await import('@/lib/api')
      
      if (editingId) {
        // Atualizar trator existente
        const result = await apiPut('/tratores', { id: editingId, ...formData })
        if (result.success) {
          // Atualizar o item específico na lista
          setTratores(prev => prev.map(trator => 
            trator.id === editingId ? result.data : trator
          ))
          console.log('✅ Trator atualizado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      } else {
        // Criar novo trator
        const result = await apiPost('/tratores', formData)
        if (result.success) {
          // Adicionar o novo item no início da lista
          setTratores(prev => [result.data, ...prev])
          console.log('✅ Trator criado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      }
      
      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('❌ Erro ao salvar trator:', error)
      alert('Erro ao salvar trator. Verifique o console para mais detalhes.')
    }
  }

  const handleEdit = (trator: Trator) => {
    setFormData({
      nome: trator.nome,
      tempo_prox_manutencao: trator.tempo_prox_manutencao || 0,
      em_manutencao: trator.em_manutencao
    })
    setEditingId(trator.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este trator?')) {
      return
    }

    try {
      const { apiRequest } = await import('@/lib/api')
      const result = await apiRequest('/tratores', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      })
      
      if (result.success) {
        setTratores(prev => prev.filter(trator => trator.id !== id))
        console.log('✅ Trator excluído com sucesso:', id)
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao excluir trator:', error)
      alert('Erro ao excluir trator. Verifique o console para mais detalhes.')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      tempo_prox_manutencao: 0,
      em_manutencao: false
    })
    setEditingId(null)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const getManutencaoColor = (tempo: number) => {
    if (tempo <= 50) return 'bg-red-100 text-red-800'
    if (tempo <= 100) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getManutencaoText = (tempo: number) => {
    if (tempo <= 50) return `Crítico (${tempo}h)`
    if (tempo <= 100) return `Atenção (${tempo}h)`
    return `OK (${tempo}h)`
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tratores</h1>
              <p className="text-gray-600">Gerencie a frota de tratores da propriedade</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Trator
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Tratores</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTratores}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tratores Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{tratoresAtivos}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Em Manutenção</p>
                  <p className="text-2xl font-bold text-gray-900">{tratoresEmManutencao}</p>
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
                    placeholder="Buscar tratores..."
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Próxima Manutenção
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
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Carregando tratores...
                      </td>
                    </tr>
                  ) : filteredTratores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Nenhum trator encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredTratores.map((trator) => (
                      <tr key={trator.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trator.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            trator.em_manutencao 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {trator.em_manutencao ? 'Em Manutenção' : 'Ativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getManutencaoColor(trator.tempo_prox_manutencao || 0)}`}>
                            {getManutencaoText(trator.tempo_prox_manutencao || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(trator.created_at || '')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(trator)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(trator.id)}
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
          {showForm && (
            <div 
              className="fixed inset-0 z-50 overflow-y-auto"
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              {/* Overlay com blur */}
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={closeForm}
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
                  <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {editingId ? 'Editar Trator' : 'Novo Trator'}
                        </h2>
                        <p className="text-gray-200 text-sm mt-1">
                          Configure as informações do trator
                        </p>
                      </div>
                      <button
                        onClick={closeForm}
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
                    {/* Nome do Trator */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Truck className="w-4 h-4 inline mr-2 text-gray-600" />
                        Nome do Trator *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="Ex: Trator JD 5075E"
                      />
                    </div>

                    {/* Tempo até Próxima Manutenção */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2 text-gray-600" />
                        Tempo até Próxima Manutenção (horas)
                      </label>
                      <input
                        type="number"
                        value={formData.tempo_prox_manutencao}
                        onChange={(e) => setFormData({ ...formData, tempo_prox_manutencao: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="0"
                      />
                    </div>

                    {/* Status de Manutenção */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.em_manutencao}
                          onChange={(e) => setFormData({ ...formData, em_manutencao: e.target.checked })}
                          className="rounded border-gray-300 text-gray-600 focus:ring-gray-500 text-gray-900"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          <Wrench className="w-4 h-4 inline mr-2 text-gray-600" />
                          Em manutenção
                        </span>
                      </label>
                    </div>
                    
                    {/* Botões com design moderno */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 text-white py-3 px-6 rounded-xl hover:from-gray-700 hover:to-gray-900 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {editingId ? '✓ Atualizar Trator' : '+ Cadastrar Trator'}
                      </button>
                      <button
                        type="button"
                        onClick={closeForm}
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
