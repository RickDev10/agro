'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { formatCurrency, formatDate } from '@/lib/api'
import { 
  Fuel, 
  Plus, 
  Search, 
  Edit, 
  DollarSign, 
  TrendingUp,
  Calendar
} from 'lucide-react'
import type { MovimentacaoCombustivel, MovimentacaoCombustivelFormData } from '@/types'

export default function CombustivelPage() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCombustivel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MovimentacaoCombustivel | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<MovimentacaoCombustivelFormData>({
    tipo: 'entrada',
    quantidade: 0,
    custo_unitario: 0,
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  })

  // Buscar dados da API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { apiGet } = await import('@/lib/api')
      const result = await apiGet('/combustivel')

      console.log('📊 Resultado da API combustível:', result)
      if (result.success) {
        setMovimentacoes(result.data.movimentacoes || [])
        setEstoqueData(result.data.estoque || {
          qnt_total: 0,
          valor_total: 0,
          valor_por_medida: 0
        })
        console.log('✅ Dados carregados com sucesso:', (result.data.movimentacoes || []).length, 'movimentações')
      } else {
        console.error('❌ Erro ao buscar combustível:', result.error)
        setMovimentacoes([])
        setEstoqueData({
          qnt_total: 0,
          valor_total: 0,
          valor_por_medida: 0
        })
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error)
      setMovimentacoes([])
      setEstoqueData({
        qnt_total: 0,
        valor_total: 0,
        valor_por_medida: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular métricas
  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').length
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').length
  
  // Usar dados do estoque (vindos da API)
  const [estoqueData, setEstoqueData] = useState<any>(null)
  
  const totalLitros = estoqueData?.qnt_total || 0
  const valorTotal = estoqueData?.valor_total || 0
  const precoMedio = estoqueData?.valor_por_medida || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { apiPost, apiPut } = await import('@/lib/api')
      
      if (editingItem) {
        const result = await apiPut('/combustivel', { ...formData, id: editingItem.id })
        if (result.success) {
          setMovimentacoes(prev => prev.map(item => 
            item.id === editingItem.id ? result.data : item
          ))
          console.log('✅ Movimentação atualizada com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      } else {
        const result = await apiPost('/combustivel', formData)
        if (result.success) {
          setMovimentacoes(prev => [result.data, ...prev])
          console.log('✅ Movimentação criada com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
          return
        }
      }

      handleCloseModal()
    } catch (error) {
      console.error('❌ Erro ao salvar movimentação:', error)
      alert('Erro ao salvar movimentação. Verifique o console para mais detalhes.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return

    try {
      const { apiRequest } = await import('@/lib/api')
      const result = await apiRequest(`/combustivel?id=${id}`, { method: 'DELETE' })

      if (result.success) {
        setMovimentacoes(prev => prev.filter(item => item.id !== id))
        console.log('✅ Movimentação excluída com sucesso:', id)
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao excluir movimentação:', error)
      alert('Erro ao excluir movimentação. Verifique o console para mais detalhes.')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      tipo: 'entrada',
      quantidade: 0,
      custo_unitario: 0,
      data: new Date().toISOString().split('T')[0],
      observacao: ''
    })
  }

  const openEditModal = (movimentacao: MovimentacaoCombustivel) => {
    setEditingItem(movimentacao)
    setFormData({
      tipo: movimentacao.tipo,
      quantidade: movimentacao.quantidade,
      custo_unitario: movimentacao.custo_unitario || 0,
      data: movimentacao.data,
      observacao: movimentacao.observacao || ''
    })
    setIsModalOpen(true)
  }

  // Filtros
  const filteredMovimentacoes = movimentacoes.filter(movimentacao => 
    movimentacao.observacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movimentacao.data.includes(searchTerm)
  )

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Gestão de Combustível</h1>
              <p className="text-sm text-gray-600">Controle de compras e consumo de combustível</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
                             <Plus className="h-4 w-4" />
               Nova Entrada
            </button>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Fuel className="h-6 w-6 text-blue-600" />
                </div>
                                 <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Total de Entradas</p>
                   <p className="text-2xl font-semibold text-gray-900">{totalEntradas}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                                 <div className="ml-4">
                   <p className="text-sm font-medium text-gray-600">Estoque Atual</p>
                   <p className="text-2xl font-semibold text-gray-900">{totalLitros.toFixed(2)} L</p>
                 </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(valorTotal)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(precoMedio)}/L</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por observação ou data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Tipo
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Data
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Quantidade (L)
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Preço Unitário
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Valor Total
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Observação
                     </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                     {loading ? (
                     <tr>
                       <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                         Carregando movimentações...
                       </td>
                     </tr>
                   ) : filteredMovimentacoes.length === 0 ? (
                     <tr>
                       <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                         Nenhuma movimentação encontrada
                       </td>
                     </tr>
                   ) : (
                     filteredMovimentacoes.map((movimentacao) => (
                       <tr key={movimentacao.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className={`text-sm font-medium ${
                             movimentacao.tipo === 'entrada' ? 'text-green-600' : 
                             movimentacao.tipo === 'saida' ? 'text-red-600' : 'text-yellow-600'
                           }`}>
                             {movimentacao.tipo === 'entrada' ? 'Entrada' : 
                              movimentacao.tipo === 'saida' ? 'Saída' : 'Ajuste'}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">
                             {formatDate(movimentacao.data)}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">
                             {movimentacao.quantidade} L
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">
                             {movimentacao.custo_unitario ? formatCurrency(movimentacao.custo_unitario) : '-'}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900">
                             {movimentacao.custo_unitario ? formatCurrency(movimentacao.quantidade * movimentacao.custo_unitario) : '-'}
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="text-sm text-gray-500 max-w-xs truncate">
                             {movimentacao.observacao || '-'}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <div className="flex justify-end space-x-2">
                             <button
                               onClick={() => openEditModal(movimentacao)}
                               className="text-indigo-600 hover:text-indigo-900"
                               title="Editar"
                             >
                               <Edit className="h-4 w-4" />
                             </button>
                             <button
                               onClick={() => handleDelete(movimentacao.id)}
                               className="text-red-600 hover:text-red-900"
                               title="Excluir"
                             >
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
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

        {/* Modal Moderno com Fundo Borrado */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Overlay com blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleCloseModal}
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
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingItem ? 'Editar Movimentação' : 'Nova Entrada de Combustível'}
                      </h2>
                      <p className="text-orange-100 text-sm mt-1">
                        Registre entrada, saída ou ajuste de combustível
                      </p>
                    </div>
                    <button
                      onClick={handleCloseModal}
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
                  {/* Data da Movimentação */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2 text-orange-600" />
                      Data da Movimentação *
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({...formData, data: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    />
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Fuel className="w-4 h-4 inline mr-2 text-orange-600" />
                      Quantidade (Litros) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({...formData, quantidade: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Preço Unitário */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2 text-orange-600" />
                      Preço Unitário (R$/L) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.custo_unitario}
                      onChange={(e) => setFormData({...formData, custo_unitario: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-2 text-orange-600" />
                      Observação
                    </label>
                    <textarea
                      value={formData.observacao}
                      onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      rows={3}
                      placeholder="Ex: Posto Central, BR-101"
                    />
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {editingItem ? '✓ Atualizar Movimentação' : '+ Criar Movimentação'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
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
