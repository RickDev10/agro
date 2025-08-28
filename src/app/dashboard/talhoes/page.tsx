'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Map, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin,
  Calendar,
  BarChart3
} from 'lucide-react'

interface Talhao {
  id: number
  nome: string
  area_hectares: number
  created_at?: string
  updated_at?: string
}

interface TalhaoFormData {
  nome: string
  area_hectares: number
}

export default function TalhoesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<TalhaoFormData>({
    nome: '',
    area_hectares: 0
  })

  const [talhoes, setTalhoes] = useState<Talhao[]>([])
  const [loading, setLoading] = useState(false)

  // Carregar dados da API (SEGURO)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { apiGet } = await import('@/lib/api')
        const result = await apiGet('/talhoes')
        
        console.log('📊 Resultado da API talhões:', result)
        if (result.success) {
          setTalhoes(result.data || [])
          console.log('✅ Dados carregados com sucesso:', (result.data || []).length, 'talhões')
        } else {
          console.error('❌ Erro ao buscar talhões:', result.error)
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
  const totalTalhoes = talhoes.length
  const areaTotal = talhoes.reduce((acc, talhao) => acc + (talhao.area_hectares || 0), 0)
  const areaMedia = totalTalhoes > 0 ? areaTotal / totalTalhoes : 0

  // Filtrar talhões
  const filteredTalhoes = talhoes.filter(talhao =>
    talhao.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Funções do formulário
  const openModal = (talhao?: Talhao) => {
    if (talhao) {
      setEditingId(talhao.id)
      setFormData({
        nome: talhao.nome,
        area_hectares: talhao.area_hectares
      })
    } else {
      setEditingId(null)
      setFormData({
        nome: '',
        area_hectares: 0
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      nome: '',
      area_hectares: 0
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const { apiPost, apiPut } = await import('@/lib/api')
      
      if (editingId) {
        // Atualizar talhão existente
        const result = await apiPut('/talhoes', { id: editingId, ...formData })
        if (result.success) {
          setTalhoes(prev => prev.map(talhao => 
            talhao.id === editingId ? result.data : talhao
          ))
          console.log('✅ Talhão atualizado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      } else {
        // Criar novo talhão
        const result = await apiPost('/talhoes', formData)
        if (result.success) {
          setTalhoes(prev => [result.data, ...prev])
          console.log('✅ Talhão criado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      }
      
      closeModal()
    } catch (error) {
      console.error('❌ Erro ao salvar talhão:', error)
      alert('Erro ao salvar talhão. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este talhão?')) {
      return
    }

    try {
      setLoading(true)
      const { apiRequest } = await import('@/lib/api')
      const result = await apiRequest('/talhoes', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      })

      if (result.success) {
        setTalhoes(prev => prev.filter(t => t.id !== id))
        console.log('✅ Talhão excluído com sucesso:', id)
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao excluir talhão:', error)
      alert('Erro ao excluir talhão. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Talhões</h1>
              <p className="text-gray-600">Gerencie as divisões da propriedade</p>
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Talhão
            </button>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Map className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Talhões
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalTalhoes}
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
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Área Total
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(areaTotal)} ha
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
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Área Média
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(areaMedia)} ha
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar talhões..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Área (hectares)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTalhoes.map((talhao) => (
                    <tr key={talhao.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {talhao.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(talhao.area_hectares)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(talhao)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(talhao.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? 'Editar Talhão' : 'Novo Talhão'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Área (hectares)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.area_hectares}
                        onChange={(e) => setFormData({ ...formData, area_hectares: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

