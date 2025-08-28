'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

import { formatCurrency, formatDate } from '@/lib/api'
import { Wheat, Plus, Search, Edit, Trash2, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import type { Safra, SafraFormData, TipoProducao } from '@/types'



export default function SafrasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<SafraFormData>({
    safra: '',
    data_inicio: '',
    data_fim: '',
    em_andamento: true,
    lucro_esperado: 0,
    faturamento_esperado: 0,
    faturamento_total: 0,
    total_colhido: 0,
    tipo_de_producao: 1
  })

  const [safras, setSafras] = useState<Safra[]>([])
  const [loading, setLoading] = useState(false)

  // Carregar dados da API (SEGURO)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { apiGet } = await import('@/lib/api')
        const result = await apiGet('/safras')
        
        console.log('📊 Resultado da API:', result)
        if (result.success) {
          setSafras(result.data || [])
          console.log('✅ Dados carregados com sucesso:', (result.data || []).length, 'safras')
        } else {
          console.error('Erro ao buscar safras:', result.error)
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
  const totalSafras = safras.length
  const safrasAtivas = safras.filter(s => s.em_andamento).length
  const safrasConcluidas = totalSafras - safrasAtivas
  const faturamentoTotal = safras.reduce((sum, s) => sum + (s.faturamento_total || 0), 0)

  // Filtrar safras
  const filteredSafras = safras.filter(safra =>
    safra.safra.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { apiPut, apiPost } = await import('@/lib/api')
      
      if (editingId) {
        // Atualizar safra existente
        const result = await apiPut('/safras', { id: editingId, ...formData })
        
        if (result.success) {
          // Atualizar o item específico na lista
          setSafras(prev => prev.map(safra => 
            safra.id === editingId ? result.data : safra
          ))
          console.log('✅ Safra atualizada com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
        }
      } else {
        // Criar nova safra
        const result = await apiPost('/safras', formData)
        
        if (result.success) {
          // Adicionar o novo item no início da lista
          setSafras(prev => [result.data, ...prev])
          console.log('✅ Safra criada com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
        }
      }
      
      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('❌ Erro ao salvar safra:', error)
      alert('Erro ao salvar safra. Verifique o console para mais detalhes.')
    }
  }

  const handleEdit = (safra: Safra) => {
    setFormData({
      safra: safra.safra,
      data_inicio: safra.data_inicio || '',
      data_fim: safra.data_fim || '',
      em_andamento: safra.em_andamento,
      lucro_esperado: safra.lucro_esperado || 0,
      faturamento_esperado: safra.faturamento_esperado || 0,
      faturamento_total: safra.faturamento_total || 0,
      total_colhido: safra.total_colhido || 0,
      tipo_de_producao: safra.tipo_de_producao
    })
    setEditingId(safra.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta safra?')) {
      return
    }

    try {
      const { apiRequest } = await import('@/lib/api')
      const result = await apiRequest('/safras', { 
        method: 'DELETE',
        body: JSON.stringify({ id })
      })
      
      if (result.success) {
        setSafras(prev => prev.filter(safra => safra.id !== id))
        console.log('✅ Safra excluída com sucesso:', id)
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao excluir safra:', error)
      alert('Erro ao excluir safra. Verifique o console para mais detalhes.')
    }
  }

  const resetForm = () => {
    setFormData({
      safra: '',
      data_inicio: '',
      data_fim: '',
      em_andamento: true,
      lucro_esperado: 0,
      faturamento_esperado: 0,
      faturamento_total: 0,
      total_colhido: 0,
      tipo_de_producao: 1
    })
    setEditingId(null)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safras</h1>
              <p className="text-gray-600">Gerencie as safras agrícolas da propriedade</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Safra
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Wheat className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Safras</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSafras}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Safras Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{safrasAtivas}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-900">{safrasConcluidas}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faturamento Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(faturamentoTotal)}</p>
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
                    placeholder="Buscar safras..."
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
                      Safra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faturamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produção
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Carregando safras...
                      </td>
                    </tr>
                  ) : filteredSafras.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma safra encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredSafras.map((safra) => (
                      <tr key={safra.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {safra.safra}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(safra.data_inicio)} - {formatDate(safra.data_fim)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            safra.em_andamento 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {safra.em_andamento ? 'Em Andamento' : 'Concluída'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(safra.faturamento_total || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {safra.total_colhido ? `${safra.total_colhido} kg` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(safra)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(safra.id)}
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
                  className="relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-300 w-full max-w-2xl"
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
                          {editingId ? 'Editar Safra' : 'Nova Safra'}
                        </h2>
                        <p className="text-green-100 text-sm mt-1">
                          Configure as informações da safra agrícola
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
                    {/* Nome da Safra */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Wheat className="w-4 h-4 inline mr-2 text-green-600" />
                        Nome da Safra *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.safra}
                        onChange={(e) => setFormData({ ...formData, safra: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="Ex: Soja 2024/25"
                      />
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-2 text-green-600" />
                          Data de Início *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.data_inicio}
                          onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-2 text-green-600" />
                          Data de Fim *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.data_fim}
                          onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        />
                      </div>
                    </div>

                    {/* Valores Esperados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <DollarSign className="w-4 h-4 inline mr-2 text-green-600" />
                          Faturamento Esperado (R$)
                        </label>
                        <input
                          type="number"
                          value={formData.faturamento_esperado}
                          onChange={(e) => setFormData({ ...formData, faturamento_esperado: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <TrendingUp className="w-4 h-4 inline mr-2 text-green-600" />
                          Lucro Esperado (R$)
                        </label>
                        <input
                          type="number"
                          value={formData.lucro_esperado}
                          onChange={(e) => setFormData({ ...formData, lucro_esperado: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Valores Reais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <DollarSign className="w-4 h-4 inline mr-2 text-green-600" />
                          Faturamento Total (R$)
                        </label>
                        <input
                          type="number"
                          value={formData.faturamento_total}
                          onChange={(e) => setFormData({ ...formData, faturamento_total: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Wheat className="w-4 h-4 inline mr-2 text-green-600" />
                          Total Colhido (kg)
                        </label>
                        <input
                          type="number"
                          value={formData.total_colhido}
                          onChange={(e) => setFormData({ ...formData, total_colhido: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Checkbox Em Andamento */}
                    <div className="flex items-center p-4 bg-gray-50/50 rounded-xl border-2 border-gray-200">
                      <input
                        type="checkbox"
                        checked={formData.em_andamento}
                        onChange={(e) => setFormData({ ...formData, em_andamento: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
                      />
                      <label className="ml-3 text-sm font-semibold text-gray-700">
                        Safra em andamento
                      </label>
                    </div>
                    
                    {/* Botões com design moderno */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {editingId ? '✓ Atualizar Safra' : '+ Criar Safra'}
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
