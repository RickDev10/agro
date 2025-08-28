'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Play, Pause, Calendar, Clock, DollarSign, Filter, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, apiPost, apiPut, apiRequest, formatDate, formatCurrency } from '@/lib/api'
import type { GastoRecorrente, GastoRecorrenteFormData, Safra, Funcionario } from '@/types'

export default function GastosRecorrentesPage() {
  const [gastosRecorrentes, setGastosRecorrentes] = useState<GastoRecorrente[]>([])
  const [filteredGastosRecorrentes, setFilteredGastosRecorrentes] = useState<GastoRecorrente[]>([])
  const [safras, setSafras] = useState<Safra[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGastoRecorrente, setEditingGastoRecorrente] = useState<GastoRecorrente | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtros
  const [filtros, setFiltros] = useState({
    status: '', // 'ativo', 'inativo', ou ''
    frequencia: '', // 'diario', 'semanal', 'mensal', etc.
    tipoGasto: '' // 'fixo', 'variavel', ou ''
  })
  
  const [formData, setFormData] = useState<GastoRecorrenteFormData>({
    nome: '',
    descricao: '',
    tipo: '',
    valor: 0,
    frequencia: 'mensal',
    dia_mes: undefined,
    dia_semana: undefined,
    data_inicio: '',
    data_fim: undefined,
    ativo: true,
    referencia_id: undefined,
    referencia_tabela: '',
    fixo: false
  })

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        console.log('🔍 Carregando dados de gastos recorrentes (SEGURO)...')
        
        const [gastosRecorrentesResult, safrasResult, funcionariosResult] = await Promise.all([
          apiGet('/gastos-recorrentes'),
          apiGet('/safras'),
          apiGet('/funcionarios')
        ])
        
        if (gastosRecorrentesResult.success) {
          console.log('✅ Gastos recorrentes carregados com sucesso (SEGUROS):', gastosRecorrentesResult.data?.length || 0)
          setGastosRecorrentes(gastosRecorrentesResult.data || [])
          setFilteredGastosRecorrentes(gastosRecorrentesResult.data || [])
        }
        
        if (safrasResult.success) {
          console.log('✅ Safras carregadas com sucesso (SEGURAS):', safrasResult.data?.length || 0)
          setSafras(safrasResult.data || [])
        }
        
        if (funcionariosResult.success) {
          console.log('✅ Funcionários carregados com sucesso (SEGUROS):', funcionariosResult.data?.length || 0)
          setFuncionarios(funcionariosResult.data || [])
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtros
  useEffect(() => {
    let filtered = gastosRecorrentes.filter(gasto => {
      const matchesSearch = 
        gasto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gasto.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gasto.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false
      
      if (filtros.status && gasto.ativo !== (filtros.status === 'ativo')) return false
      if (filtros.frequencia && gasto.frequencia !== filtros.frequencia) return false
      if (filtros.tipoGasto) {
        if (filtros.tipoGasto === 'fixo' && !gasto.fixo) return false
        if (filtros.tipoGasto === 'variavel' && gasto.fixo) return false
      }
      
      return true
    })
    
    setFilteredGastosRecorrentes(filtered)
  }, [searchTerm, gastosRecorrentes, filtros])

  // Funções
  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFiltros({
      status: '',
      frequencia: '',
      tipoGasto: ''
    })
  }

  const hasActiveFilters = () => {
    return filtros.status || filtros.frequencia || filtros.tipoGasto
  }

  const openModal = () => {
    setEditingGastoRecorrente(null)
    setFormData({
      nome: '',
      descricao: '',
      tipo: '',
      valor: 0,
      frequencia: 'mensal',
      dia_mes: undefined,
      dia_semana: undefined,
      data_inicio: '',
      data_fim: undefined,
      ativo: true,
      referencia_id: undefined,
      referencia_tabela: '',
      fixo: false
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGastoRecorrente(null)
  }

  const handleEdit = (gastoRecorrente: GastoRecorrente) => {
    setEditingGastoRecorrente(gastoRecorrente)
    setFormData({
      nome: gastoRecorrente.nome,
      descricao: gastoRecorrente.descricao || '',
      tipo: gastoRecorrente.tipo,
      valor: gastoRecorrente.valor,
      frequencia: gastoRecorrente.frequencia,
      dia_mes: gastoRecorrente.dia_mes,
      dia_semana: gastoRecorrente.dia_semana,
      data_inicio: gastoRecorrente.data_inicio,
      data_fim: gastoRecorrente.data_fim,
      ativo: gastoRecorrente.ativo,
      referencia_id: gastoRecorrente.referencia_id,
      referencia_tabela: gastoRecorrente.referencia_tabela || '',
      fixo: gastoRecorrente.fixo
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingGastoRecorrente) {
        // Atualizar
        console.log('🔍 Atualizando gasto recorrente (SEGURO):', editingGastoRecorrente.id)
        const result = await apiPut('/gastos-recorrentes', { ...formData, id: editingGastoRecorrente.id })
        
        if (result.success) {
          console.log('✅ Gasto recorrente atualizado (SEGURO):', result.data)
          setGastosRecorrentes(prev => 
            prev.map(item => 
              item.id === editingGastoRecorrente.id ? result.data : item
            )
          )
        } else {
          alert(`Erro: ${result.error}`)
        }
      } else {
        // Criar novo
        console.log('🔍 Criando novo gasto recorrente (SEGURO)...')
        const result = await apiPost('/gastos-recorrentes', formData)
        
        if (result.success) {
          console.log('✅ Gasto recorrente criado (SEGURO):', result.data)
          setGastosRecorrentes(prev => [result.data, ...prev])
        } else {
          alert(`Erro: ${result.error}`)
        }
      }
      closeModal()
    } catch (error) {
      console.error('❌ Erro ao salvar gasto recorrente:', error)
      alert('Erro ao salvar gasto recorrente')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este gasto recorrente?')) return

    try {
      console.log('🔍 Excluindo gasto recorrente (SEGURO):', id)
      
      const result = await apiRequest('/gastos-recorrentes', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      })

      if (result.success) {
        console.log('✅ Gasto recorrente excluído (SEGURO):', id)
        setGastosRecorrentes(prev => prev.filter(item => item.id !== id))
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao excluir gasto recorrente:', error)
      alert('Erro ao excluir gasto recorrente')
    }
  }

  const handleToggleStatus = async (id: number, ativo: boolean) => {
    try {
      const gastoRecorrente = gastosRecorrentes.find(g => g.id === id)
      if (!gastoRecorrente) return

      console.log('🔍 Alterando status do gasto recorrente (SEGURO):', id, !ativo)
      
      const result = await apiPut('/gastos-recorrentes', { ...gastoRecorrente, ativo: !ativo })

      if (result.success) {
        console.log('✅ Status do gasto recorrente alterado (SEGURO):', id, !ativo)
        setGastosRecorrentes(prev => 
          prev.map(item => 
            item.id === id ? { ...item, ativo: !ativo } : item
          )
        )
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error)
      alert('Erro ao alterar status')
    }
  }

  const handleExecuteRecurring = async () => {
    try {
      console.log('🔍 Executando gastos recorrentes (SEGURO)...')
      
      const result = await apiRequest('/gastos-recorrentes', {
        method: 'PATCH'
      })

      if (result.success) {
        console.log('✅ Gastos recorrentes processados (SEGURO)')
        alert('Gastos recorrentes processados com sucesso!')
        // Recarregar dados
        window.location.reload()
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao executar gastos recorrentes:', error)
      alert('Erro ao executar gastos recorrentes')
    }
  }

  const getFrequenciaText = (frequencia: string) => {
    const map: Record<string, string> = {
      diario: 'Diário',
      semanal: 'Semanal',
      mensal: 'Mensal',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    }
    return map[frequencia] || frequencia
  }

  const getFrequenciaIcon = (frequencia: string) => {
    const map: Record<string, string> = {
      diario: '📅',
      semanal: '📆',
      mensal: '🗓️',
      trimestral: '📊',
      semestral: '📈',
      anual: '📋'
    }
    return map[frequencia] || '📅'
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gastos Recorrentes</h1>
                <p className="text-gray-600 mt-2">
                  Gerencie gastos que se repetem automaticamente
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExecuteRecurring}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Executar</span>
                </button>
                <button
                  onClick={openModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Gasto Recorrente</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar gastos recorrentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Botão de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </button>
            </div>

            {/* Painel de filtros */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filtros.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  {/* Frequência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequência
                    </label>
                    <select
                      value={filtros.frequencia}
                      onChange={(e) => handleFilterChange('frequencia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Todas</option>
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {/* Tipo de Gasto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Gasto
                    </label>
                    <select
                      value={filtros.tipoGasto}
                      onChange={(e) => handleFilterChange('tipoGasto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="fixo">Fixos</option>
                      <option value="variavel">Variáveis</option>
                    </select>
                  </div>
                </div>

                {/* Indicador de filtros ativos */}
                {hasActiveFilters() && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          Filtros ativos: {filteredGastosRecorrentes.length} de {gastosRecorrentes.length} encontrados
                        </span>
                      </div>
                      <button
                        onClick={clearFilters}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Próxima Execução
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredGastosRecorrentes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum gasto recorrente encontrado
                    </td>
                  </tr>
                ) : (
                  filteredGastosRecorrentes.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{gasto.nome}</div>
                          {gasto.descricao && (
                            <div className="text-sm text-gray-500">{gasto.descricao}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            gasto.fixo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {gasto.fixo ? '📌 Fixo' : '📊 Variável'}
                          </span>
                          <span className="text-sm text-gray-900">{gasto.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(gasto.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFrequenciaIcon(gasto.frequencia)}</span>
                          <span className="text-sm text-gray-900">{getFrequenciaText(gasto.frequencia)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {gasto.proxima_execucao ? formatDate(gasto.proxima_execucao) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(gasto.id, gasto.ativo)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            gasto.ativo 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {gasto.ativo ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                          {gasto.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(gasto)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(gasto.id)}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
              
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingGastoRecorrente ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Configure o gasto que será executado automaticamente
                      </p>
                    </div>
                    <button onClick={closeModal} className="text-white/80 hover:text-white">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nome *
                    </label>
                                         <input
                       type="text"
                       value={formData.nome}
                       onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                       placeholder="Ex: Aluguel da propriedade"
                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                       required
                     />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Descrição
                    </label>
                                         <textarea
                       value={formData.descricao}
                       onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                       placeholder="Descrição detalhada do gasto"
                       rows={3}
                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                     />
                  </div>

                  {/* Tipo e Valor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Tipo *
                      </label>
                                             <select
                         value={formData.tipo}
                         onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                         required
                       >
                        <option value="">Selecione o tipo</option>
                        <option value="aluguel">Aluguel</option>
                        <option value="salario">Salário</option>
                        <option value="seguros">Seguros</option>
                        <option value="impostos">Impostos</option>
                        <option value="internet">Internet</option>
                        <option value="energia">Energia</option>
                        <option value="agua">Água</option>
                        <option value="manutencao">Manutenção</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Valor (R$) *
                      </label>
                                             <input
                         type="number"
                         value={formData.valor}
                         onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                         step="0.01"
                         min="0"
                         placeholder="0.00"
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                         required
                       />
                    </div>
                  </div>

                  {/* Frequência */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Frequência *
                    </label>
                                         <select
                       value={formData.frequencia}
                       onChange={(e) => setFormData({ ...formData, frequencia: e.target.value as any })}
                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                       required
                     >
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {/* Data de Início */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Data de Início *
                    </label>
                                         <input
                       type="date"
                       value={formData.data_inicio}
                       onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                       required
                     />
                  </div>

                  {/* Gasto Fixo */}
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <input
                      type="checkbox"
                      id="fixo"
                      checked={formData.fixo || false}
                      onChange={(e) => setFormData({ ...formData, fixo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="fixo" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Gasto Fixo
                      </label>
                      <p className="text-xs text-gray-700 mt-1">
                        Marque se este é um gasto fixo que não varia
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo || false}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-5 h-5 text-green-600 bg-white border-2 border-green-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="ativo" className="text-sm font-semibold text-gray-900 cursor-pointer">
                        Ativo
                      </label>
                      <p className="text-xs text-gray-700 mt-1">
                        Marque para ativar a execução automática
                      </p>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : (editingGastoRecorrente ? 'Atualizar' : 'Criar')}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
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
