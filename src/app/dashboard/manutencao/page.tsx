'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, apiPost, apiPut, apiRequest, formatDate, formatCurrency } from '@/lib/api'
import type { Manutencao, ManutencaoFormData } from '@/types'

export default function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [filteredManutencoes, setFilteredManutencoes] = useState<Manutencao[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManutencao, setEditingManutencao] = useState<Manutencao | null>(null)
  const [loading, setLoading] = useState(false)
  const [referenceData, setReferenceData] = useState({
    tratores: []
  })
  const [formData, setFormData] = useState<ManutencaoFormData>({
    tipo_manutencao: '',
    trator_id: 1,
    valor_total: 0,
    data_manutencao: ''
  })

  // Mock data
  const mockManutencoes: Manutencao[] = [
    {
      id: 1,
      tipo_manutencao: 'Preventiva',
      trator_id: 1,
      valor_total: 2500.00,
      data_manutencao: '2024-01-15',
      created_at: '2024-01-15T08:00:00Z',
      trator: { id: 1, nome: 'Trator 01', em_manutencao: false }
    },
    {
      id: 2,
      tipo_manutencao: 'Corretiva',
      trator_id: 2,
      valor_total: 5000.00,
      data_manutencao: '2024-02-20',
      created_at: '2024-02-20T10:00:00Z',
      trator: { id: 2, nome: 'Trator 02', em_manutencao: true }
    },
    {
      id: 3,
      tipo_manutencao: 'Preventiva',
      trator_id: 3,
      valor_total: 1800.00,
      data_manutencao: '2024-03-10',
      created_at: '2024-03-10T14:00:00Z',
      trator: { id: 3, nome: 'Trator 03', em_manutencao: false }
    }
  ]

  // Carregar dados de referência
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const response = await fetch('/api/reference-data')
        const result = await response.json()
        
        if (result.success) {
          setReferenceData(result.data)
          // Atualizar formData com o primeiro ID disponível
          if (result.data.tratores.length > 0) {
            setFormData(prev => ({
              ...prev,
              trator_id: result.data.tratores[0].id
            }))
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de referência:', error)
      }
    }
    
    loadReferenceData()
  }, [])

  useEffect(() => {
    // Carregar dados reais do Supabase
    const loadData = async () => {
      setLoading(true)
      try {
        console.log('🔍 Carregando dados de manutenção (SEGURO)...')
        const result = await apiGet('/manutencao')
        
        if (result.success) {
          console.log('✅ Dados carregados com sucesso (SEGUROS):', result.data?.length || 0)
          setManutencoes(result.data || [])
          setFilteredManutencoes(result.data || [])
        } else {
          console.log('❌ Erro na API:', result.error)
          // Fallback para dados mockados em caso de erro
          setManutencoes(mockManutencoes)
          setFilteredManutencoes(mockManutencoes)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados de manutenção:', error)
        // Fallback para dados mockados em caso de erro
        setManutencoes(mockManutencoes)
        setFilteredManutencoes(mockManutencoes)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const filtered = manutencoes.filter(manutencao =>
      manutencao.tipo_manutencao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manutencao.trator?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manutencao.data_manutencao.includes(searchTerm)
    )
    setFilteredManutencoes(filtered)
  }, [searchTerm, manutencoes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingManutencao) {
        // Atualizar
        console.log('🔍 Atualizando manutenção (SEGURO):', editingManutencao.id)
        const result = await apiPut('/manutencao', { id: editingManutencao.id, ...formData })
        
        if (result.success) {
          console.log('✅ Manutenção atualizada (SEGURO):', result.data)
          // Atualizar o item específico na lista
          setManutencoes(prev => prev.map(manutencao => 
            manutencao.id === editingManutencao.id ? result.data : manutencao
          ))
          setFilteredManutencoes(prev => prev.map(manutencao => 
            manutencao.id === editingManutencao.id ? result.data : manutencao
          ))
        }
      } else {
        // Criar novo
        console.log('🔍 Criando nova manutenção (SEGURO)...')
        const result = await apiPost('/manutencao', formData)
        
        if (result.success) {
          console.log('✅ Manutenção criada (SEGURO):', result.data)
          // Adicionar o novo item no início da lista
          setManutencoes(prev => [result.data, ...prev])
          setFilteredManutencoes(prev => [result.data, ...prev])
        }
      }
      
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar manutenção:', error)
    }
  }

  const handleEdit = (manutencao: Manutencao) => {
    setEditingManutencao(manutencao)
    setFormData({
      tipo_manutencao: manutencao.tipo_manutencao,
      trator_id: manutencao.trator_id,
      valor_total: manutencao.valor_total || 0,
      data_manutencao: manutencao.data_manutencao
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este registro de manutenção?')) {
      try {
        console.log('🔍 Excluindo manutenção (SEGURO):', id)
        
        const result = await apiRequest('/manutencao', {
          method: 'DELETE',
          body: JSON.stringify({ id })
        })
        
        if (result.success) {
          console.log('✅ Manutenção excluída (SEGURO):', id)
          setManutencoes(prev => prev.filter(manutencao => manutencao.id !== id))
          setFilteredManutencoes(prev => prev.filter(manutencao => manutencao.id !== id))
        }
      } catch (error) {
        console.error('❌ Erro ao excluir manutenção:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_manutencao: '',
      trator_id: 1,
      valor_total: 0,
      data_manutencao: ''
    })
    setEditingManutencao(null)
  }

  const openModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'preventiva':
        return 'bg-blue-100 text-blue-800'
      case 'corretiva':
        return 'bg-red-100 text-red-800'
      case 'emergencial':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Métricas
  const totalManutencoes = manutencoes.length
  const manutencoesPreventivas = manutencoes.filter(m => m.tipo_manutencao.toLowerCase() === 'preventiva').length
  const manutencoesCorretivas = manutencoes.filter(m => m.tipo_manutencao.toLowerCase() === 'corretiva').length
  const totalGasto = manutencoes.reduce((sum, m) => sum + (m.valor_total || 0), 0)
  const manutencoesMes = manutencoes.filter(m => {
    const manutencaoDate = new Date(m.data_manutencao)
    const now = new Date()
    return manutencaoDate.getMonth() === now.getMonth() && manutencaoDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Manutenções</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie o histórico de manutenções dos tratores.
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Manutenções</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalManutencoes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Preventivas</dt>
                      <dd className="text-lg font-medium text-gray-900">{manutencoesPreventivas}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Corretivas</dt>
                      <dd className="text-lg font-medium text-gray-900">{manutencoesCorretivas}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">R$</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Gasto</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalGasto)}</dd>
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
                  placeholder="Buscar manutenções..."
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
                Nova Manutenção
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
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trator
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredManutencoes.map((manutencao) => (
                        <tr key={manutencao.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{manutencao.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(manutencao.tipo_manutencao)}`}>
                              {manutencao.tipo_manutencao}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {manutencao.trator?.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(manutencao.data_manutencao)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(manutencao.valor_total || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(manutencao)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(manutencao.id)}
                                className="text-red-600 hover:text-red-900"
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
                <div className="bg-gradient-to-r from-red-500 to-pink-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingManutencao ? 'Editar Manutenção' : 'Nova Manutenção'}
                      </h2>
                      <p className="text-red-100 text-sm mt-1">
                        Configure as informações da manutenção
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
                  {/* Tipo de Manutenção */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-red-600">🔧</span>
                      Tipo de Manutenção *
                    </label>
                    <select
                      value={formData.tipo_manutencao}
                      onChange={(e) => setFormData({ ...formData, tipo_manutencao: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Preventiva">Preventiva</option>
                      <option value="Corretiva">Corretiva</option>
                      <option value="Emergencial">Emergencial</option>
                    </select>
                  </div>

                  {/* Trator */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-red-600">🚜</span>
                      Trator *
                    </label>
                    <select
                      value={formData.trator_id}
                      onChange={(e) => setFormData({ ...formData, trator_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    >
                      {referenceData.tratores.map((trator: any) => (
                        <option key={trator.id} value={trator.id}>{trator.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data da Manutenção */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-red-600">📅</span>
                      Data da Manutenção *
                    </label>
                    <input
                      type="date"
                      value={formData.data_manutencao}
                      onChange={(e) => setFormData({ ...formData, data_manutencao: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    />
                  </div>

                  {/* Valor Total */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-red-600">💰</span>
                      Valor Total (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.valor_total}
                      onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {editingManutencao ? '✓ Atualizar Manutenção' : '+ Cadastrar Manutenção'}
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
