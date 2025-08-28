'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Truck,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  Filter,
  Download,
  Upload,
  Hash,
  FileText
} from 'lucide-react'

interface Insumo {
  id: number
  insumo: string
  qnt_total: number
  valor_total: number
  valor_por_medida: number
  medida: string
  created_at?: string
  updated_at?: string
}

interface EstoqueInsumo {
  id: number
  insumo_id: number
  quantidade: number
  atualizado_em: string
  insumo?: Insumo
}

interface LoteInsumo {
  id: number
  insumo_id: number
  quantidade: number
  preco_unitario: number
  data_compra: string
  atualizado_em: string
  insumo?: Insumo
}

interface MovimentacaoInsumo {
  id: number
  insumo_id: number
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario: number
  data: string
  referencia_id?: number
  referencia_tabela?: string
  observacao?: string
  insumo?: Insumo
}

export default function InsumosPage() {
  const [activeTab, setActiveTab] = useState<'estoque' | 'lotes' | 'movimentacoes' | 'cadastrados'>('estoque')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estados para dados
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [estoque, setEstoque] = useState<EstoqueInsumo[]>([])
  const [lotes, setLotes] = useState<LoteInsumo[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoInsumo[]>([])

  // Estados para modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false)
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Estados para formulários
  const [formData, setFormData] = useState({
    insumo: '',
    medida: '',
    qnt_total: 0,
    valor_total: 0,
    valor_por_medida: 0
  })

  const [loteFormData, setLoteFormData] = useState({
    insumo_id: '',
    quantidade: 0,
    preco_unitario: 0,
    data_compra: new Date().toISOString().split('T')[0]
  })

  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    insumo_id: '',
    tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantidade: 0,
    custo_unitario: 0,
    observacao: ''
  })

  // Carregar dados (SEGURO)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const { apiGet } = await import('@/lib/api')
        
        // Carregar todas as APIs agora
        const [insumosData, estoqueData, lotesData, movimentacoesData] = await Promise.all([
          apiGet('/insumos'),
          apiGet('/estoque-insumos'),
          apiGet('/lotes-insumos'),
          apiGet('/movimentacoes-insumos')
        ])

        console.log('📊 Resultado da API insumos:', insumosData)
        if (insumosData.success && insumosData.data?.insumos) {
          setInsumos(insumosData.data.insumos || [])
          console.log('✅ Insumos carregados:', (insumosData.data.insumos || []).length)
        }
        
        if (estoqueData.success) {
          setEstoque(estoqueData.data || [])
          console.log('✅ Estoque carregado:', (estoqueData.data || []).length)
        }
        
        if (lotesData.success) {
          setLotes(lotesData.data || [])
          console.log('✅ Lotes carregados:', (lotesData.data || []).length)
        }
        
        if (movimentacoesData.success) {
          setMovimentacoes(movimentacoesData.data || [])
          console.log('✅ Movimentações carregadas:', (movimentacoesData.data || []).length)
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar dados
  const filteredInsumos = Array.isArray(insumos) ? insumos.filter(insumo =>
    insumo.insumo.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  // Enriquecer dados com informações do insumo
  const enrichedEstoque = Array.isArray(estoque) ? estoque.map(item => ({
    ...item,
    insumo: insumos.find(insumo => insumo.id === item.insumo_id)
  })) : []

  const enrichedLotes = Array.isArray(lotes) ? lotes.map(lote => ({
    ...lote,
    insumo: insumos.find(insumo => insumo.id === lote.insumo_id)
  })) : []

  const enrichedMovimentacoes = Array.isArray(movimentacoes) ? movimentacoes.map(mov => ({
    ...mov,
    insumo: insumos.find(insumo => insumo.id === mov.insumo_id)
  })) : []

  const filteredEstoque = enrichedEstoque.filter(item =>
    item.insumo?.insumo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    searchTerm === ''
  )

  const filteredLotes = enrichedLotes.filter(lote =>
    lote.insumo?.insumo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    searchTerm === ''
  )

  const filteredMovimentacoes = enrichedMovimentacoes.filter(mov =>
    mov.insumo?.insumo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    searchTerm === ''
  )

  // Calcular totais
  const totalValorEstoque = Array.isArray(insumos) ? insumos.reduce((acc, insumo) => acc + (insumo.valor_total || 0), 0) : 0
  const totalItens = Array.isArray(insumos) ? insumos.length : 0
  const insumosComBaixoEstoque = Array.isArray(insumos) ? insumos.filter(insumo => (insumo.qnt_total || 0) < 100).length : 0

  // Handlers para formulários (SEGURO)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { apiPost, apiPut } = await import('@/lib/api')
      
      if (modalMode === 'create') {
        const result = await apiPost('/insumos', formData)
        if (result.success) {
          setInsumos(prev => [result.data, ...prev])
          console.log('✅ Insumo criado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
        }
      } else {
        const result = await apiPut('/insumos', { id: selectedItem?.id, ...formData })
        if (result.success) {
          setInsumos(prev => prev.map(item => 
            item.id === selectedItem?.id ? result.data : item
          ))
          console.log('✅ Insumo atualizado com sucesso:', result.data)
        } else {
          alert(`Erro: ${result.error}`)
        }
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('❌ Erro ao salvar insumo:', error)
      alert('Erro ao salvar insumo. Verifique o console para mais detalhes.')
    }
  }

  const handleLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { apiPost } = await import('@/lib/api')
      const result = await apiPost('/lotes-insumos', loteFormData)
      
      if (result.success) {
        setLotes(prev => [result.data, ...prev])
        setIsLoteModalOpen(false)
        console.log('✅ Lote adicionado com sucesso:', result.data)
        
        // Resetar form
        setLoteFormData({
          insumo_id: '',
          quantidade: 0,
          preco_unitario: 0,
          data_compra: new Date().toISOString().split('T')[0]
        })
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar lote:', error)
      alert('Erro ao adicionar lote. Verifique o console para mais detalhes.')
    }
  }

  const handleMovimentacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { apiPost } = await import('@/lib/api')
      const result = await apiPost('/movimentacoes-insumos', movimentacaoFormData)
      
      if (result.success) {
        setMovimentacoes(prev => [result.data, ...prev])
        setIsMovimentacaoModalOpen(false)
        console.log('✅ Movimentação registrada com sucesso:', result.data)
        
        // Resetar form
        setMovimentacaoFormData({
          insumo_id: '',
          tipo: 'entrada',
          quantidade: 0,
          custo_unitario: 0,
          observacao: ''
        })
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao registrar movimentação:', error)
      alert('Erro ao registrar movimentação. Verifique o console para mais detalhes.')
    }
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setModalMode('edit')
    setFormData({
      insumo: item.insumo || '',
      medida: item.medida || '',
      qnt_total: item.qnt_total || 0,
      valor_total: item.valor_total || 0,
      valor_por_medida: item.valor_por_medida || 0
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const { apiRequest } = await import('@/lib/api')
        const result = await apiRequest('/insumos', {
          method: 'DELETE',
          body: JSON.stringify({ id })
        })

        if (result.success) {
          setInsumos(prev => prev.filter(item => item.id !== id))
          console.log('✅ Insumo excluído com sucesso:', id)
        } else {
          alert(`Erro: ${result.error}`)
        }
      } catch (error) {
        console.error('❌ Erro ao excluir insumo:', error)
        alert('Erro ao excluir insumo. Verifique o console para mais detalhes.')
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Insumos</h1>
              <p className="text-gray-600">Gerencie o estoque, lotes e movimentações de insumos agrícolas</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setModalMode('create')
                  setFormData({
                    insumo: '',
                    medida: '',
                    qnt_total: 0,
                    valor_total: 0,
                    valor_por_medida: 0
                  })
                  setIsModalOpen(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </button>
              <button
                onClick={() => {
                  setLoteFormData({
                    insumo_id: '',
                    quantidade: 0,
                    preco_unitario: 0,
                    data_compra: new Date().toISOString().split('T')[0]
                  })
                  setIsLoteModalOpen(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="h-4 w-4 mr-2" />
                Adicionar Lote
              </button>
              <button
                onClick={() => {
                  setMovimentacaoFormData({
                    insumo_id: '',
                    tipo: 'entrada',
                    quantidade: 0,
                    custo_unitario: 0,
                    observacao: ''
                  })
                  setIsMovimentacaoModalOpen(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Registrar Movimentação
              </button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Valor Total em Estoque
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(totalValorEstoque)}
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
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Insumos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalItens}
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
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Baixo Estoque
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {insumosComBaixoEstoque}
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
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Lotes Ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Array.isArray(enrichedLotes) ? enrichedLotes.filter(l => l.quantidade > 0).length : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('estoque')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'estoque'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Estoque Atual
                </button>
                <button
                  onClick={() => setActiveTab('lotes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'lotes'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lotes
                </button>
                <button
                  onClick={() => setActiveTab('movimentacoes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'movimentacoes'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Movimentações
                </button>
                <button
                  onClick={() => setActiveTab('cadastrados')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'cadastrados'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Insumos Cadastrados
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar insumos..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Conteúdo das abas */}
              {activeTab === 'estoque' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insumo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor por Medida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInsumos.map((insumo) => (
                        <tr key={insumo.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {insumo.insumo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(insumo.qnt_total)} {insumo.medida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(insumo.valor_total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(insumo.valor_por_medida)}/{insumo.medida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (insumo.qnt_total || 0) < 100 
                                ? 'bg-red-100 text-red-800'
                                : (insumo.qnt_total || 0) < 500
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {(insumo.qnt_total || 0) < 100 ? 'Baixo' : 
                               (insumo.qnt_total || 0) < 500 ? 'Médio' : 'Alto'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(insumo)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(insumo.id)}
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
              )}

              {activeTab === 'lotes' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insumo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço Unitário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data da Compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLotes.map((lote) => (
                        <tr key={lote.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {lote.insumo?.insumo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(lote.quantidade)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(lote.preco_unitario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(lote.quantidade * lote.preco_unitario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(lote.data_compra)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lote.quantidade > 0 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lote.quantidade > 0 ? 'Disponível' : 'Esgotado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'movimentacoes' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insumo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custo Unitário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMovimentacoes.map((movimentacao) => (
                        <tr key={movimentacao.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(movimentacao.data)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {movimentacao.insumo?.insumo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              movimentacao.tipo === 'entrada' 
                                ? 'bg-green-100 text-green-800'
                                : movimentacao.tipo === 'saida'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {movimentacao.tipo === 'entrada' ? 'Entrada' : 
                               movimentacao.tipo === 'saida' ? 'Saída' : 'Ajuste'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(movimentacao.quantidade)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(movimentacao.custo_unitario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(movimentacao.quantidade * movimentacao.custo_unitario)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {movimentacao.observacao || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'cadastrados' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome do Insumo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidade de Medida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor por Medida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInsumos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Nenhum insumo cadastrado
                          </td>
                        </tr>
                      ) : (
                        filteredInsumos.map((insumo) => (
                          <tr key={insumo.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {insumo.insumo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {insumo.medida}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(insumo.qnt_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(insumo.valor_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(insumo.valor_por_medida)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(insumo)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(insumo.id)}
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
              )}
            </div>
          </div>
        </div>

        {/* Modal Moderno de Insumo */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Overlay com blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsModalOpen(false)}
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
                        {modalMode === 'create' ? 'Novo Insumo' : 'Editar Insumo'}
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        Configure as informações do insumo agrícola
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
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
                      <Package className="w-4 h-4 inline mr-2 text-green-600" />
                      Nome do Insumo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.insumo}
                      onChange={(e) => setFormData({...formData, insumo: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      placeholder="Ex: Adubo NPK 20-20-20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <ArrowUpDown className="w-4 h-4 inline mr-2 text-green-600" />
                      Unidade de Medida *
                    </label>
                    <select
                      required
                      value={formData.medida}
                      onChange={(e) => setFormData({...formData, medida: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                    >
                      <option value="">Selecione a unidade...</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="L">Litro (L)</option>
                      <option value="T">Tonelada (T)</option>
                      <option value="unid">Unidade</option>
                      <option value="saca">Saca</option>
                    </select>
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {modalMode === 'create' ? '+ Criar Insumo' : '✓ Atualizar Insumo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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

        {/* Modal Moderno de Lote */}
        {isLoteModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Overlay com blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsLoteModalOpen(false)}
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
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Novo Lote de Insumo
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Registre um novo lote de insumo agrícola
                      </p>
                    </div>
                    <button
                      onClick={() => setIsLoteModalOpen(false)}
                      className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleLoteSubmit} className="px-8 py-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Package className="w-4 h-4 inline mr-2 text-blue-600" />
                      Insumo *
                    </label>
                    <select
                      required
                      value={loteFormData.insumo_id}
                      onChange={(e) => setLoteFormData({...loteFormData, insumo_id: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                    >
                      <option value="">Selecione o insumo...</option>
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.insumo} ({insumo.medida})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Hash className="w-4 h-4 inline mr-2 text-blue-600" />
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={loteFormData.quantidade}
                        onChange={(e) => setLoteFormData({...loteFormData, quantidade: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2 text-blue-600" />
                        Preço Unit. *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={loteFormData.preco_unitario}
                        onChange={(e) => setLoteFormData({...loteFormData, preco_unitario: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2 text-blue-600" />
                      Data de Compra *
                    </label>
                    <input
                      type="date"
                      required
                      value={loteFormData.data_compra}
                      onChange={(e) => setLoteFormData({...loteFormData, data_compra: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                    />
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      + Adicionar Lote
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLoteModalOpen(false)}
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

        {/* Modal Moderno de Movimentação */}
        {isMovimentacaoModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            {/* Overlay com blur */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMovimentacaoModalOpen(false)}
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
                        Nova Movimentação
                      </h2>
                      <p className="text-purple-100 text-sm mt-1">
                        Registre entrada, saída ou ajuste de estoque
                      </p>
                    </div>
                    <button
                      onClick={() => setIsMovimentacaoModalOpen(false)}
                      className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleMovimentacaoSubmit} className="px-8 py-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Insumo *
                    </label>
                    <select
                      required
                      value={movimentacaoFormData.insumo_id}
                      onChange={(e) => setMovimentacaoFormData({...movimentacaoFormData, insumo_id: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                    >
                      <option value="">Selecione o insumo...</option>
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.insumo} ({insumo.medida})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <ArrowUpDown className="w-4 h-4 inline mr-2 text-purple-600" />
                      Tipo de Movimentação *
                    </label>
                    <select
                      required
                      value={movimentacaoFormData.tipo}
                      onChange={(e) => setMovimentacaoFormData({...movimentacaoFormData, tipo: e.target.value as 'entrada' | 'saida' | 'ajuste'})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                    >
                      <option value="entrada">📥 Entrada</option>
                      <option value="saida">📤 Saída</option>
                      <option value="ajuste">⚖️ Ajuste</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Hash className="w-4 h-4 inline mr-2 text-purple-600" />
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={movimentacaoFormData.quantidade}
                        onChange={(e) => setMovimentacaoFormData({...movimentacaoFormData, quantidade: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2 text-purple-600" />
                        Custo Unit. *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={movimentacaoFormData.custo_unitario}
                        onChange={(e) => setMovimentacaoFormData({...movimentacaoFormData, custo_unitario: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-2 text-purple-600" />
                      Observação
                    </label>
                    <textarea
                      value={movimentacaoFormData.observacao}
                      onChange={(e) => setMovimentacaoFormData({...movimentacaoFormData, observacao: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50 resize-none"
                      rows={3}
                      placeholder="Descrição da movimentação (opcional)"
                    />
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      📝 Registrar Movimentação
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMovimentacaoModalOpen(false)}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}