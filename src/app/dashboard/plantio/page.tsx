'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, ChevronDown, ChevronUp, Calendar, Clock, Fuel, MapPin, User, Truck, Package } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, apiPost, apiPut, apiRequest, formatDate, formatDateTime } from '@/lib/api'
import type { HistoricoPlantio, HistoricoPlantioFormData } from '@/types'

export default function PlantioPage() {
  const [historicoPlantio, setHistoricoPlantio] = useState<HistoricoPlantio[]>([])
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoPlantio[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlantio, setEditingPlantio] = useState<HistoricoPlantio | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [referenceData, setReferenceData] = useState({
    tiposProducao: [],
    safras: [],
    funcionarios: [],
    talhoes: [],
    tratores: [],
    insumos: []
  })
  const [formData, setFormData] = useState<HistoricoPlantioFormData>({
    tipo_de_producao: 1,
    data_execucao: '',
    safra_id: 1,
    talhao_id: 1,
    trator_id: 1,
    funcionario_id: 1,
    duracao_horas: 0,
    combustivel: 0,
    foto_combustivel: '',
    foto_orimetro_inicio: '',
    foto_orimetro_fim: '',
    insumos: {},
    status_execucao: 'pendente'
  })

  // Mock data
  const mockHistoricoPlantio: HistoricoPlantio[] = [
    {
      id: 1,
      tipo_de_producao: 1,
      data_execucao: '2024-01-15',
      safra_id: 1,
      talhao_id: 1,
      trator_id: 1,
      funcionario_id: 1,
      duracao_horas: 8,
      combustivel: 50,
      foto_combustivel: '',
      foto_orimetro_inicio: '',
      foto_orimetro_fim: '',
      insumos: { semente: '100kg', adubo: '200kg' },
      status_execucao: 'concluido',
      created_at: '2024-01-15T08:00:00Z',
      tipo_producao: { id: 1, nome_producao: 'Soja' },
      safra: { id: 1, safra: '2023/2024', data_inicio: '2023-09-01', em_andamento: true, tipo_de_producao: 1 },
      talhao: { id: 1, nome: 'Talhão A' },
      trator: { id: 1, nome: 'Trator 01', em_manutencao: false },
      funcionario: { id: 1, nome: 'João Silva' }
    },
    {
      id: 2,
      tipo_de_producao: 2,
      data_execucao: '2024-01-20',
      safra_id: 1,
      talhao_id: 2,
      trator_id: 2,
      funcionario_id: 2,
      duracao_horas: 6,
      combustivel: 40,
      foto_combustivel: '',
      foto_orimetro_inicio: '',
      foto_orimetro_fim: '',
      insumos: { semente: '80kg', adubo: '150kg' },
      status_execucao: 'em_andamento',
      created_at: '2024-01-20T07:00:00Z',
      tipo_producao: { id: 2, nome_producao: 'Milho' },
      safra: { id: 1, safra: '2023/2024', data_inicio: '2023-09-01', em_andamento: true, tipo_de_producao: 1 },
      talhao: { id: 2, nome: 'Talhão B' },
      trator: { id: 2, nome: 'Trator 02', em_manutencao: false },
      funcionario: { id: 2, nome: 'Maria Santos' }
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
          // Atualizar formData com os primeiros IDs disponíveis
          if (result.data.tiposProducao.length > 0) {
            setFormData(prev => ({
              ...prev,
              tipo_de_producao: result.data.tiposProducao[0].id,
              safra_id: result.data.safras[0]?.id || 1,
              talhao_id: result.data.talhoes[0]?.id || 1,
              trator_id: result.data.tratores[0]?.id || 1,
              funcionario_id: result.data.funcionarios[0]?.id || 1
            }))
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de referência:', error)
      }
    }
    
    loadReferenceData()
  }, [])

  // Carregar dados de plantio
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        console.log('🔍 Carregando dados de plantio (SEGURO)...')
        const result = await apiGet('/plantio')
        
        console.log('📊 Resposta da API:', result)
        
        if (result.success) {
          console.log('✅ Dados carregados com sucesso (SEGUROS):', result.data?.length || 0)
          setHistoricoPlantio(result.data || [])
          setFilteredHistorico(result.data || [])
          console.log('✅ Estado atualizado!')
        } else {
          console.log('❌ Erro na API:', result.error)
          setHistoricoPlantio([])
          setFilteredHistorico([])
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados de plantio:', error)
        setHistoricoPlantio([])
        setFilteredHistorico([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    const filtered = historicoPlantio.filter(plantio =>
      plantio.tipo_producao?.nome_producao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plantio.talhao?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plantio.funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plantio.status_execucao?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredHistorico(filtered)
  }, [searchTerm, historicoPlantio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPlantio) {
        // Atualizar
        console.log('🔍 Atualizando plantio (SEGURO):', editingPlantio.id)
        const result = await apiPut('/plantio', { id: editingPlantio.id, ...formData })
        
        if (result.success) {
          console.log('✅ Plantio atualizado (SEGURO):', result.data)
          // Atualizar o item específico na lista
          setHistoricoPlantio(prev => prev.map(plantio => 
            plantio.id === editingPlantio.id ? result.data : plantio
          ))
          setFilteredHistorico(prev => prev.map(plantio => 
            plantio.id === editingPlantio.id ? result.data : plantio
          ))
        }
      } else {
        // Criar novo
        console.log('🔍 Criando novo plantio (SEGURO)...')
        const result = await apiPost('/plantio', formData)
        
        if (result.success) {
          console.log('✅ Plantio criado (SEGURO):', result.data)
          // Adicionar o novo item no início da lista
          setHistoricoPlantio(prev => [result.data, ...prev])
          setFilteredHistorico(prev => [result.data, ...prev])
        }
      }
      
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar plantio:', error)
    }
  }

  const handleEdit = (plantio: HistoricoPlantio) => {
    setEditingPlantio(plantio)
    setFormData({
      tipo_de_producao: plantio.tipo_de_producao,
      data_execucao: plantio.data_execucao,
      safra_id: plantio.safra_id,
      talhao_id: plantio.talhao_id,
      trator_id: plantio.trator_id,
      funcionario_id: plantio.funcionario_id,
      duracao_horas: plantio.duracao_horas || 0,
      combustivel: plantio.combustivel || 0,
      foto_combustivel: plantio.foto_combustivel || '',
      foto_orimetro_inicio: plantio.foto_orimetro_inicio || '',
      foto_orimetro_fim: plantio.foto_orimetro_fim || '',
      insumos: plantio.insumos || {},
      status_execucao: plantio.status_execucao || 'pendente'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este registro de plantio?')) {
      try {
        console.log('🔍 Excluindo plantio (SEGURO):', id)
        
        const result = await apiRequest('/plantio', {
          method: 'DELETE',
          body: JSON.stringify({ id })
        })
        
        if (result.success) {
          console.log('✅ Plantio excluído (SEGURO):', id)
          setHistoricoPlantio(prev => prev.filter(plantio => plantio.id !== id))
          setFilteredHistorico(prev => prev.filter(plantio => plantio.id !== id))
        }
      } catch (error) {
        console.error('❌ Erro ao excluir plantio:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      tipo_de_producao: 1,
      data_execucao: '',
      safra_id: 1,
      talhao_id: 1,
      trator_id: 1,
      funcionario_id: 1,
      duracao_horas: 0,
      combustivel: 0,
      foto_combustivel: '',
      foto_orimetro_inicio: '',
      foto_orimetro_fim: '',
      insumos: {},
      status_execucao: 'pendente'
    })
    setEditingPlantio(null)
  }

  const openModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isExpanded = (id: number) => expandedItems.has(id)

  const renderInsumoValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'object') {
      // Se for um objeto com insumo_id e quantidade
      if (value.insumo_id && value.quantidade) {
        return `${value.quantidade}`
      }
      // Se for um objeto com outras propriedades
      return JSON.stringify(value)
    }
    return String(value)
  }

  const getHorimetroDisplayValue = (url: string): string => {
    if (!url) return 'Ver Foto'
    
    // Extrair o nome do arquivo da URL
    const fileName = url.split('/').pop()
    if (fileName) {
      // Remover extensão e caracteres especiais
      const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      return cleanName || 'Ver Foto'
    }
    
    return 'Ver Foto'
  }

  const getInsumoName = (insumoId: string | number): string => {
    // Se insumoId for 0 ou null/undefined, retornar uma mensagem específica
    if (!insumoId || insumoId === 0) {
      return 'Insumo não especificado'
    }
    
    const id = typeof insumoId === 'string' ? parseInt(insumoId) : insumoId
    
    // Se o ID for NaN após conversão, retornar o valor original
    if (isNaN(id)) {
      return String(insumoId)
    }
    
    const insumo = (referenceData.insumos as any[]).find((i: any) => i.id === id)
    
    return insumo ? insumo.insumo : `Insumo ${id}`
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '_')
    switch (normalizedStatus) {
      case 'concluido':
        return 'bg-green-100 text-green-800'
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800'
      case 'pendente':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Métricas
  const totalPlantios = historicoPlantio.length
  const plantiosConcluidos = historicoPlantio.filter(p => {
    const normalized = p.status_execucao?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
    return normalized === 'concluido'
  }).length
  const plantiosEmAndamento = historicoPlantio.filter(p => {
    const normalized = p.status_execucao?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '_')
    return normalized === 'em_andamento'
  }).length
  const totalHoras = historicoPlantio.reduce((sum, p) => sum + (p.duracao_horas || 0), 0)
  const totalCombustivel = historicoPlantio.reduce((sum, p) => sum + (p.combustivel || 0), 0)

  // Debug logs
  console.log('Plantios:', historicoPlantio.map(p => ({ id: p.id, status: p.status_execucao })))
  console.log('Métricas:', { totalPlantios, plantiosConcluidos, plantiosEmAndamento })
  console.log('Status encontrados:', [...new Set(historicoPlantio.map(p => p.status_execucao))])
  console.log('Status normalizados:', [...new Set(historicoPlantio.map(p => 
    p.status_execucao?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
  ))])
  console.log('Filtro concluidos:', historicoPlantio.filter(p => {
    const normalized = p.status_execucao?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
    return normalized === 'concluido'
  }))
  console.log('Filtro em_andamento:', historicoPlantio.filter(p => {
    const normalized = p.status_execucao?.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '_')
    return normalized === 'em_andamento'
  }))

  // Debug: Monitorar mudanças no estado
  useEffect(() => {
    console.log('Estado historicoPlantio atualizado:', historicoPlantio)
    console.log('Tamanho do array:', historicoPlantio.length)
    if (historicoPlantio.length > 0) {
      console.log('Primeiro item:', historicoPlantio[0])
    }
  }, [historicoPlantio])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Histórico de Plantio</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie o histórico de plantio das safras.
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Plantios</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalPlantios}</dd>
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
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Concluídos</dt>
                      <dd className="text-lg font-medium text-gray-900">{plantiosConcluidos}</dd>
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
                      <span className="text-white text-sm font-medium">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Em Andamento</dt>
                      <dd className="text-lg font-medium text-gray-900">{plantiosEmAndamento}</dd>
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
                      <span className="text-white text-sm font-medium">H</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Horas</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalHoras}h</dd>
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
                  placeholder="Buscar plantios..."
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
                Novo Plantio
              </button>
            </div>
          </div>

          {/* Cards de Plantio */}
          <div className="mt-8 grid grid-cols-1 gap-6">
            {filteredHistorico.map((plantio) => (
              <div key={plantio.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header do Card */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpanded(plantio.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            #{plantio.id} - {plantio.tipo_producao?.nome_producao}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plantio.status_execucao || '')}`}>
                            {plantio.status_execucao === 'concluido' ? 'Concluído' : 
                             plantio.status_execucao === 'em_andamento' ? 'Em Andamento' : 
                             plantio.status_execucao === 'pendente' ? 'Pendente' : 
                             plantio.status_execucao || 'N/A'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(plantio.data_execucao)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {plantio.talhao?.nome}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {plantio.funcionario?.nome}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {plantio.duracao_horas}h
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(plantio)
                          }}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(plantio.id)
                          }}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        {isExpanded(plantio.id) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido */}
                {isExpanded(plantio.id) && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Informações Básicas */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Informações Básicas</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">ID:</span>
                              <span className="text-sm font-medium text-gray-900">#{plantio.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Tipo de Produção:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.tipo_producao?.nome_producao}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Data de Execução:</span>
                              <span className="text-sm font-medium text-gray-900">{formatDate(plantio.data_execucao)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Status:</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plantio.status_execucao || '')}`}>
                                {plantio.status_execucao === 'concluido' ? 'Concluído' : 
                                 plantio.status_execucao === 'em_andamento' ? 'Em Andamento' : 
                                 plantio.status_execucao === 'pendente' ? 'Pendente' : 
                                 plantio.status_execucao || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recursos Utilizados */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recursos Utilizados</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Safra:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.safra?.safra}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Talhão:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.talhao?.nome}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Funcionário:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.funcionario?.nome}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Trator:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.trator?.nome}</span>
                            </div>
                          </div>
                        </div>

                        {/* Métricas Operacionais */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Métricas Operacionais</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Duração:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.duracao_horas}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Combustível:</span>
                              <span className="text-sm font-medium text-gray-900">{plantio.combustivel}L</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Horímetro Início:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {plantio.foto_orimetro_inicio ? (
                                  <a 
                                    href={plantio.foto_orimetro_inicio} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {getHorimetroDisplayValue(plantio.foto_orimetro_inicio)}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Não informado</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Horímetro Fim:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {plantio.foto_orimetro_fim ? (
                                  <a 
                                    href={plantio.foto_orimetro_fim} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {getHorimetroDisplayValue(plantio.foto_orimetro_fim)}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Não informado</span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Criado em:</span>
                              <span className="text-sm font-medium text-gray-900">{formatDateTime(plantio.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insumos Utilizados */}
                      {plantio.insumos && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Insumos Utilizados</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.isArray(plantio.insumos) ? (
                              // Se for um array de objetos
                              plantio.insumos.map((item: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                      {getInsumoName(item.insumo_id)}:
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {item.quantidade}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              // Se for um objeto (formato antigo)
                              Object.entries(plantio.insumos).map(([insumo, quantidade]) => (
                                <div key={insumo} className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900 capitalize">{getInsumoName(insumo)}:</span>
                                    <span className="text-sm text-gray-600">
                                      {renderInsumoValue(quantidade)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fotos (se houver) */}
                      {(plantio.foto_combustivel || plantio.foto_orimetro_inicio || plantio.foto_orimetro_fim) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Fotos</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plantio.foto_combustivel && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium text-gray-900 mb-2">Combustível</div>
                                <div className="text-sm text-gray-500">Foto disponível</div>
                              </div>
                            )}
                            {plantio.foto_orimetro_inicio && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium text-gray-900 mb-2">Horímetro Início</div>
                                <div className="text-sm text-gray-500">Foto disponível</div>
                              </div>
                            )}
                            {plantio.foto_orimetro_fim && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium text-gray-900 mb-2">Horímetro Fim</div>
                                <div className="text-sm text-gray-500">Foto disponível</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                className="relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-300 w-full max-w-2xl"
                style={{ 
                  animation: 'slideUp 0.3s ease-out',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {editingPlantio ? 'Editar Plantio' : 'Novo Plantio'}
                      </h2>
                      <p className="text-emerald-100 text-sm mt-1">
                        Configure as informações do plantio
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Produção */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="w-4 h-4 inline mr-2 text-emerald-600">🌾</span>
                        Tipo de Produção *
                      </label>
                      <select
                        value={formData.tipo_de_producao}
                        onChange={(e) => setFormData({ ...formData, tipo_de_producao: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        {referenceData.tiposProducao.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.nome_producao}</option>
                        ))}
                      </select>
                    </div>

                    {/* Data de Execução */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Data de Execução *
                      </label>
                      <input
                        type="date"
                        value={formData.data_execucao}
                        onChange={(e) => setFormData({ ...formData, data_execucao: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      />
                    </div>

                    {/* Talhão */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Talhão *
                      </label>
                      <select
                        value={formData.talhao_id}
                        onChange={(e) => setFormData({ ...formData, talhao_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        {referenceData.talhoes.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Funcionário */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Funcionário *
                      </label>
                      <select
                        value={formData.funcionario_id}
                        onChange={(e) => setFormData({ ...formData, funcionario_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        {referenceData.funcionarios.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Safra */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="w-4 h-4 inline mr-2 text-emerald-600">📅</span>
                        Safra *
                      </label>
                      <select
                        value={formData.safra_id}
                        onChange={(e) => setFormData({ ...formData, safra_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        {referenceData.safras.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.safra}</option>
                        ))}
                      </select>
                    </div>

                    {/* Trator */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Truck className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Trator *
                      </label>
                      <select
                        value={formData.trator_id}
                        onChange={(e) => setFormData({ ...formData, trator_id: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        {referenceData.tratores.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duração */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Duração (horas)
                      </label>
                      <input
                        type="number"
                        value={formData.duracao_horas}
                        onChange={(e) => setFormData({ ...formData, duracao_horas: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="0"
                      />
                    </div>

                    {/* Combustível */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Fuel className="w-4 h-4 inline mr-2 text-emerald-600" />
                        Combustível (L)
                      </label>
                      <input
                        type="number"
                        value={formData.combustivel}
                        onChange={(e) => setFormData({ ...formData, combustivel: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        placeholder="0"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="w-4 h-4 inline mr-2 text-emerald-600">📊</span>
                        Status *
                      </label>
                      <select
                        value={formData.status_execucao}
                        onChange={(e) => setFormData({ ...formData, status_execucao: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                        required
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {editingPlantio ? '✓ Atualizar Plantio' : '+ Cadastrar Plantio'}
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
