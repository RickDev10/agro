'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, DollarSign, Calendar, Tag, Filter, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { apiGet, apiPost, apiPut, apiRequest, formatDate, formatCurrency } from '@/lib/api'
import type { GastoGeral, GastoGeralFormData, Safra, Funcionario } from '@/types'

export default function GastosPage() {
  const [gastos, setGastos] = useState<GastoGeral[]>([])
  const [filteredGastos, setFilteredGastos] = useState<GastoGeral[]>([])
  const [safras, setSafras] = useState<Safra[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoGeral | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [gastosRelacoes, setGastosRelacoes] = useState<{[key: number]: {safra_id?: number, trator_id?: number, talhao_id?: number}}>({})
  
  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    categoria: '',
    safraId: '',
    tipoGasto: '' // 'fixo', 'variavel', ou ''
  })
  
  const [formData, setFormData] = useState<GastoGeralFormData>({
    tipo: '',
    descricao: '',
    valor: 0,
    data: '',
    referencia_id: undefined,
    referencia_tabela: '',
    fixo: false
  })

  // Carregar dados reais do Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        console.log('🔍 Carregando dados de gastos (SEGURO)...')
        
        // Carregar gastos, safras e funcionários em paralelo
        const [gastosResult, safrasResult, funcionariosResult] = await Promise.all([
          apiGet('/gastos-gerais'),
          apiGet('/safras'),
          apiGet('/funcionarios')
        ])
        
        if (gastosResult.success) {
          console.log('✅ Gastos carregados com sucesso (SEGUROS):', gastosResult.data?.length || 0)
          setGastos(gastosResult.data || [])
          setFilteredGastos(gastosResult.data || [])
          
          // Carregar relações para gastos que referenciam historico_plantio ou historico_colheita
          await loadGastosRelacoes(gastosResult.data || [])
        } else {
          console.error('❌ Erro ao carregar gastos:', gastosResult.error)
          setGastos([])
          setFilteredGastos([])
        }
        
        if (safrasResult.success) {
          console.log('✅ Safras carregadas com sucesso (SEGURAS):', safrasResult.data?.length || 0)
          setSafras(safrasResult.data || [])
        } else {
          console.error('❌ Erro ao carregar safras:', safrasResult.error)
          setSafras([])
        }
        
        if (funcionariosResult.success) {
          console.log('✅ Funcionários carregados com sucesso (SEGUROS):', funcionariosResult.data?.length || 0)
          setFuncionarios(funcionariosResult.data || [])
        } else {
          console.error('❌ Erro ao carregar funcionários:', funcionariosResult.error)
          setFuncionarios([])
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
        setGastos([])
        setFilteredGastos([])
        setSafras([])
        setFuncionarios([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Função para carregar as relações entre historico_plantio/colheita e safras
  const loadGastosRelacoes = async (gastos: GastoGeral[]) => {
    try {
      // Identificar gastos que referenciam historico_plantio ou historico_colheita
      const gastosComRelacao = gastos.filter(gasto => 
        gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita'
      )

      console.log('Gastos com relação:', gastosComRelacao.length)
      console.log('Gastos com relação:', gastosComRelacao.map(g => ({ 
        id: g.id, 
        tipo: g.tipo, 
        referencia_tabela: g.referencia_tabela, 
        referencia_id: g.referencia_id 
      })))

      if (gastosComRelacao.length === 0) return

      // Buscar relações usando a nova API
      const response = await fetch('/api/gastos-relacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gastos })
      })

      const result = await response.json()
      
      console.log('Resultado das relações:', result)
      
      if (result.success) {
        setGastosRelacoes(result.data)
        console.log('Relações carregadas:', result.data)
      } else {
        console.error('Erro ao carregar relações dos gastos:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar relações dos gastos:', error)
    }
  }

  useEffect(() => {
    let filtered = gastos.filter(gasto => {
      // Filtro por busca
      const matchesSearch = 
        gasto.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gasto.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gasto.data?.includes(searchTerm) ||
        gasto.valor?.toString().includes(searchTerm)
      
      if (!matchesSearch) return false
      
      // Filtro por período
      if (filtros.dataInicio && gasto.data < filtros.dataInicio) return false
      if (filtros.dataFim && gasto.data > filtros.dataFim) return false
      
      // Filtro por categoria
      if (filtros.categoria && gasto.tipo !== filtros.categoria) return false
      
      // Filtro especial: sem filtros ativos, não mostrar gastos que referenciam historico_plantio ou historico_colheita
      if (!filtros.safraId && (gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita')) {
        return false
      }
      
      // Filtro por safra (baseado na referência)
      if (filtros.safraId) {
        // Não mostrar gastos de compra quando filtrar por safra
        if (gasto.tipo?.toLowerCase() === 'compra_combustivel' || gasto.tipo?.toLowerCase() === 'compra_insumo') {
          return false
        }
        
        // Se a referência for diretamente uma safra
        if (gasto.referencia_tabela === 'safras') {
          if (gasto.referencia_id !== parseInt(filtros.safraId)) return false
        }
        // Se a referência for plantio ou colheita, verificar se está relacionada à safra
        else if (gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita') {
          const relacao = gastosRelacoes[gasto.referencia_id || 0]
          console.log(`Verificando gasto ${gasto.id} (${gasto.tipo}):`, {
            referencia_id: gasto.referencia_id,
            relacao,
            safraId: filtros.safraId,
            safraIdInt: parseInt(filtros.safraId),
            matches: relacao && relacao.safra_id === parseInt(filtros.safraId)
          })
          if (!relacao || relacao.safra_id !== parseInt(filtros.safraId)) return false
        }
        // Para outros tipos de referência, não mostrar
        else {
          return false
        }
      }
      
      // Filtro por tipo de gasto (fixo/variável)
      if (filtros.tipoGasto) {
        if (filtros.tipoGasto === 'fixo' && !gasto.fixo) return false
        if (filtros.tipoGasto === 'variavel' && gasto.fixo) return false
      }
      
      return true
    })
    
    console.log('Filtros aplicados:', filtros)
    console.log('Gastos filtrados:', filtered.length)
    console.log('GastosRelacoes:', gastosRelacoes)
    
    setFilteredGastos(filtered)
  }, [searchTerm, gastos, filtros, gastosRelacoes])

  // Limpar referências quando o tipo de gasto mudar
  useEffect(() => {
    if (formData.tipo && !shouldReferenceSafras(formData.tipo) && !shouldReferenceFuncionarios(formData.tipo)) {
      setFormData(prev => ({
        ...prev,
        referencia_tabela: '',
        referencia_id: undefined
      }))
    }
  }, [formData.tipo])
  
  // Função para obter o ID da safra baseado na referência do gasto
  const getSafraIdFromReference = async (gasto: GastoGeral): Promise<number | null> => {
    if (!gasto.referencia_tabela || !gasto.referencia_id) return null
    
    // Se a referência for diretamente uma safra
    if (gasto.referencia_tabela === 'safras') {
      return gasto.referencia_id
    }
    
    // Se a referência for plantio ou colheita, buscar a safra relacionada
    if (gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita') {
      try {
        const response = await fetch(`/api/${gasto.referencia_tabela}/${gasto.referencia_id}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          return result.data.safra_id || null
        }
      } catch (error) {
        console.error('Erro ao buscar referência:', error)
      }
    }
    
    return null
  }

  // Função para verificar se um gasto está relacionado ao filtro selecionado
  const isGastoRelatedToFilter = async (gasto: GastoGeral): Promise<boolean> => {
    if (!filtros.safraId) return false
    
    // Se a referência for diretamente uma safra
    if (gasto.referencia_tabela === 'safras') {
      return gasto.referencia_id === parseInt(filtros.safraId)
    }
    
    // Se a referência for plantio ou colheita, buscar e verificar
    if (gasto.referencia_tabela === 'historico_plantio' || gasto.referencia_tabela === 'historico_colheita') {
      try {
        const response = await fetch(`/api/${gasto.referencia_tabela}/${gasto.referencia_id}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          const historico = result.data
          return historico.safra_id === parseInt(filtros.safraId)
        }
      } catch (error) {
        console.error('Erro ao verificar relação do gasto:', error)
      }
    }
    
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingGasto) {
        // Atualizar
        console.log('🔍 Atualizando gasto (SEGURO):', editingGasto.id)
        const result = await apiPut('/gastos-gerais', { id: editingGasto.id, ...formData })
        
        if (result.success) {
          console.log('✅ Gasto atualizado (SEGURO):', result.data)
          // Atualizar o item específico na lista
          setGastos(prev => prev.map(gasto => 
            gasto.id === editingGasto.id ? result.data : gasto
          ))
          setFilteredGastos(prev => prev.map(gasto => 
            gasto.id === editingGasto.id ? result.data : gasto
          ))
        }
      } else {
        // Criar novo
        console.log('🔍 Criando novo gasto (SEGURO)...')
        const result = await apiPost('/gastos-gerais', formData)
        
        if (result.success) {
          console.log('✅ Gasto criado (SEGURO):', result.data)
          // Adicionar o novo item no início da lista
          setGastos(prev => [result.data, ...prev])
          setFilteredGastos(prev => [result.data, ...prev])
        }
      }
      
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar gasto:', error)
    }
  }

  const handleEdit = (gasto: GastoGeral) => {
    setEditingGasto(gasto)
    setFormData({
      tipo: gasto.tipo || '',
      descricao: gasto.descricao || '',
      valor: gasto.valor || 0,
      data: gasto.data || '',
      referencia_id: gasto.referencia_id,
      referencia_tabela: gasto.referencia_tabela || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este registro de gasto?')) {
      try {
        console.log('🔍 Excluindo gasto (SEGURO):', id)
        
        const result = await apiRequest('/gastos-gerais', {
          method: 'DELETE',
          body: JSON.stringify({ id })
        })
        
        if (result.success) {
          console.log('✅ Gasto excluído (SEGURO):', id)
          setGastos(prev => prev.filter(gasto => gasto.id !== id))
          setFilteredGastos(prev => prev.filter(gasto => gasto.id !== id))
        }
      } catch (error) {
        console.error('❌ Erro ao excluir gasto:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: '',
      descricao: '',
      valor: 0,
      data: '',
      referencia_id: undefined,
      referencia_tabela: ''
    })
    setEditingGasto(null)
  }

  const openModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }
  
  // Funções para gerenciar filtros
  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }))
  }
  
  const clearFilters = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      categoria: '',
      safraId: '',
      tipoGasto: ''
    })
  }
  
  const hasActiveFilters = () => {
    return filtros.dataInicio || filtros.dataFim || filtros.categoria || filtros.safraId || filtros.tipoGasto
  }

  // Função para determinar se o tipo de gasto deve referenciar safras
  const shouldReferenceSafras = (tipo: string) => {
    const safraTypes = [
      'equipamentos', 'materiais', 'servicos_agricolas', 'analise_solo',
      'veiculos', 'transporte', 'combustivel_veiculos', 'comunicacao',
      'internet', 'tecnologia', 'administrativo', 'contabilidade',
      'juridico', 'impostos', 'taxas', 'licencas', 'seguros',
      'seguro_propriedade', 'seguro_maquinas', 'outros', 'emergencia', 'diversos'
    ]
    return safraTypes.includes(tipo.toLowerCase())
  }

  // Função para determinar se o tipo de gasto deve referenciar funcionários
  const shouldReferenceFuncionarios = (tipo: string) => {
    const funcionarioTypes = ['salario', 'beneficios', 'treinamento']
    return funcionarioTypes.includes(tipo.toLowerCase())
  }

  // Função para obter o texto da referência baseado no tipo
  const getReferenceText = (tipo: string) => {
    if (shouldReferenceSafras(tipo)) {
      return 'Safra'
    } else if (shouldReferenceFuncionarios(tipo)) {
      return 'Funcionário'
    }
    return 'Referência'
  }

  // Função para formatar valor de gastos automáticos (insumos e combustível)
  const formatGastoValue = (gasto: GastoGeral) => {
    if (gasto.tipo?.toLowerCase() === 'insumos' || gasto.tipo?.toLowerCase() === 'combustivel') {
      return (
        <span className="text-sm text-gray-600">
          <span className="font-medium">Uso: </span>
          {formatCurrency(gasto.valor || 0)}
        </span>
      )
    }
    if (gasto.tipo?.toLowerCase() === 'compra_insumo' || gasto.tipo?.toLowerCase() === 'compra_combustivel') {
      return (
        <span className="text-sm text-gray-600">
          <span className="font-medium">Compra: </span>
          {formatCurrency(gasto.valor || 0)}
        </span>
      )
    }
    return formatCurrency(gasto.valor || 0)
  }

     const getTipoColor = (tipo: string) => {
     switch (tipo?.toLowerCase()) {
       // 🔧 EQUIPAMENTOS E MATERIAIS
       case 'equipamentos':
         return 'bg-blue-100 text-blue-800'
       case 'materiais':
         return 'bg-indigo-100 text-indigo-800'
       
       // 👥 RECURSOS HUMANOS
       case 'salario':
         return 'bg-purple-100 text-purple-800'
       case 'beneficios':
         return 'bg-pink-100 text-pink-800'
       case 'treinamento':
         return 'bg-cyan-100 text-cyan-800'
       
       // 🚜 SERVIÇOS AGRÍCOLAS
       case 'servicos_agricolas':
         return 'bg-emerald-100 text-emerald-800'
       case 'consultoria':
         return 'bg-teal-100 text-teal-800'
       case 'analise_solo':
         return 'bg-lime-100 text-lime-800'
       
       // 🚗 VEÍCULOS E TRANSPORTE
       case 'veiculos':
         return 'bg-slate-100 text-slate-800'
       case 'transporte':
         return 'bg-zinc-100 text-zinc-800'
       case 'combustivel_veiculos':
         return 'bg-amber-100 text-amber-800'
       
       // 🏥 SAÚDE E BENEFÍCIOS
       case 'saude':
         return 'bg-rose-100 text-rose-800'
       case 'seguros_saude':
         return 'bg-fuchsia-100 text-fuchsia-800'
       case 'beneficios_sociais':
         return 'bg-violet-100 text-violet-800'
       
       // 📞 COMUNICAÇÃO E TECNOLOGIA
       case 'comunicacao':
         return 'bg-sky-100 text-sky-800'
       case 'tecnologia':
         return 'bg-blue-100 text-blue-800'
       case 'internet':
         return 'bg-indigo-100 text-indigo-800'
       
       // 📋 SERVIÇOS ADMINISTRATIVOS
       case 'administrativo':
         return 'bg-gray-100 text-gray-800'
       case 'contabilidade':
         return 'bg-stone-100 text-stone-800'
       case 'juridico':
         return 'bg-neutral-100 text-neutral-800'
       
       // 💰 IMPOSTOS E TAXAS
       case 'impostos':
         return 'bg-yellow-100 text-yellow-800'
       case 'taxas':
         return 'bg-orange-100 text-orange-800'
       case 'licencas':
         return 'bg-amber-100 text-amber-800'
       
       // 🛡️ SEGUROS
       case 'seguros':
         return 'bg-emerald-100 text-emerald-800'
       case 'seguro_propriedade':
         return 'bg-green-100 text-green-800'
       case 'seguro_maquinas':
         return 'bg-teal-100 text-teal-800'
       
       // 📋 OUTROS
       case 'outros':
         return 'bg-gray-100 text-gray-800'
       case 'emergencia':
         return 'bg-red-100 text-red-800'
       case 'diversos':
         return 'bg-slate-100 text-slate-800'
       
       // 🧪 GASTOS AUTOMÁTICOS
       case 'insumos':
       case 'insumo':
         return 'bg-green-100 text-green-800'
       case 'combustivel':
       case 'combustível':
         return 'bg-orange-100 text-orange-800'
       case 'compra_insumo':
         return 'bg-emerald-100 text-emerald-800'
       case 'compra_combustivel':
         return 'bg-amber-100 text-amber-800'
       
       default:
         return 'bg-purple-100 text-purple-800'
     }
   }

  // Métricas
  const totalGastos = filteredGastos.length
  const totalValor = filteredGastos.reduce((sum, g) => sum + (g.valor || 0), 0)
  const gastosMes = filteredGastos.filter(g => {
    const gastoDate = new Date(g.data)
    const now = new Date()
    return gastoDate.getMonth() === now.getMonth() && gastoDate.getFullYear() === now.getFullYear()
  })
  const valorMes = gastosMes.reduce((sum, g) => sum + (g.valor || 0), 0)
  const tiposUnicos = new Set(filteredGastos.map(g => g.tipo)).size

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Gastos Gerais</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie todos os gastos e despesas da propriedade.
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Gastos</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalGastos}</dd>
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
                      <span className="text-white text-sm font-medium">R$</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Gasto</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalValor)}</dd>
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
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Gastos do Mês</dt>
                      <dd className="text-lg font-medium text-gray-900">{formatCurrency(valorMes)}</dd>
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
                      <Tag className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tipos de Gasto</dt>
                      <dd className="text-lg font-medium text-gray-900">{tiposUnicos}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

                     {/* Ações e Filtros */}
           <div className="mt-8 space-y-4">
             {/* Barra superior */}
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div className="flex-1 max-w-sm">
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                     type="text"
                     placeholder="Buscar gastos..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                   />
                 </div>
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={() => setShowFilters(!showFilters)}
                   className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm transition-colors ${
                     showFilters || hasActiveFilters()
                       ? 'border-green-500 text-green-700 bg-green-50'
                       : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                   } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                 >
                   <Filter className="h-4 w-4 mr-2" />
                   Filtros
                   {hasActiveFilters() && (
                     <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       Ativo
                     </span>
                   )}
                 </button>
                 <button
                   onClick={openModal}
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Novo Gasto
                 </button>
               </div>
             </div>
             
             {/* Painel de filtros */}
             {showFilters && (
               <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
                   {hasActiveFilters() && (
                     <button
                       onClick={clearFilters}
                       className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                     >
                       <X className="h-4 w-4 mr-1" />
                       Limpar Filtros
                     </button>
                   )}
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {/* Período - Data Início */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Data Início
                     </label>
                     <input
                       type="date"
                       value={filtros.dataInicio}
                       onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     />
                   </div>
                   
                   {/* Período - Data Fim */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Data Fim
                     </label>
                     <input
                       type="date"
                       value={filtros.dataFim}
                       onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     />
                   </div>
                   
                   {/* Categoria */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Categoria
                     </label>
                     <select
                       value={filtros.categoria}
                       onChange={(e) => handleFilterChange('categoria', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                       <option value="">Todas as categorias</option>
                       <option value="insumo">🌱 Insumo</option>
                       <option value="combustivel">⛽ Combustível</option>
                                               <option value="equipamentos">🔧 Equipamentos</option>
                        <option value="materiais">📦 Materiais</option>
                       <option value="salario">👤 Salário</option>
                       <option value="beneficios">🏥 Benefícios</option>
                       <option value="treinamento">🎓 Treinamento</option>
                       <option value="servicos_agricolas">🚜 Serviços Agrícolas</option>
                       <option value="consultoria">📋 Consultoria</option>
                       <option value="analise_solo">🔬 Análise de Solo</option>
                       <option value="veiculos">🚗 Veículos</option>
                       <option value="transporte">🚛 Transporte</option>
                       <option value="combustivel_veiculos">⛽ Combustível Veículos</option>
                       <option value="saude">🏥 Saúde</option>
                       <option value="seguros_saude">🛡️ Seguros Saúde</option>
                       <option value="beneficios_sociais">🤝 Benefícios Sociais</option>
                       <option value="comunicacao">📞 Comunicação</option>
                       <option value="tecnologia">💻 Tecnologia</option>
                       <option value="internet">🌐 Internet</option>
                       <option value="administrativo">📋 Administrativo</option>
                       <option value="contabilidade">📊 Contabilidade</option>
                       <option value="juridico">⚖️ Jurídico</option>
                       <option value="impostos">💰 Impostos</option>
                       <option value="taxas">📄 Taxas</option>
                       <option value="licencas">📋 Licenças</option>
                       <option value="seguros">🛡️ Seguros</option>
                       <option value="seguro_propriedade">🏠 Seguro Propriedade</option>
                       <option value="seguro_maquinas">🚜 Seguro Máquinas</option>
                       <option value="outros">📋 Outros</option>
                       <option value="emergencia">🚨 Emergência</option>
                       <option value="diversos">📦 Diversos</option>
                     </select>
                   </div>
                   
                   {/* Safra */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Safra
                     </label>
                     <select
                       value={filtros.safraId}
                       onChange={(e) => handleFilterChange('safraId', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                       <option value="">Todas as safras</option>
                       {safras.map((safra) => (
                         <option key={safra.id} value={safra.id}>
                           {safra.safra}
                         </option>
                       ))}
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
                       <option value="">Todos os tipos</option>
                       <option value="fixo">📌 Gastos Fixos</option>
                       <option value="variavel">📊 Gastos Variáveis</option>
                     </select>
                   </div>
                 </div>
                 
                 {/* Indicador de filtros ativos */}
                 {hasActiveFilters() && (
                   <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                     <div className="flex items-center">
                       <Filter className="h-4 w-4 text-green-600 mr-2" />
                       <span className="text-sm text-green-800">
                         Filtros ativos: {filteredGastos.length} de {gastos.length} gastos encontrados
                       </span>
                     </div>
                   </div>
                 )}
               </div>
             )}
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
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
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
                            Carregando gastos...
                          </td>
                        </tr>
                      ) : filteredGastos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                            Nenhum gasto encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredGastos.map((gasto) => (
                          <tr key={gasto.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{gasto.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(gasto.tipo || '')}`}>
                                {gasto.tipo || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {gasto.descricao || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(gasto.data)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatGastoValue(gasto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {gasto.fixo ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  📌 Fixo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  📊 Variável
                                </span>
                              )}
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
            </div>
          </div>
        </div>

        {/* Aviso sobre gastos automáticos quando safra está selecionada */}
        {filtros.safraId && filteredGastos.some(g => g.tipo?.toLowerCase() === 'insumos' || g.tipo?.toLowerCase() === 'combustivel') && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-600 text-lg">ℹ️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Gastos Automáticos de Uso
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Os gastos de <strong>Insumos</strong> e <strong>Combustível</strong> mostrados são gerados automaticamente 
                    pelos processos de plantio e colheita. Os valores exibidos representam o <strong>custo de uso</strong> 
                    (não o valor de compra), calculado com base no consumo real durante as operações.
                  </p>
                  <p className="mt-2">
                    <strong>Nota:</strong> Gastos de compra de insumos e combustível não são exibidos quando filtrar por safra, 
                    pois representam custos de aquisição, não de uso específico da safra.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                        {editingGasto ? 'Editar Gasto' : 'Novo Gasto'}
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        Configure as informações do gasto
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
                  {/* Tipo de Gasto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-green-600">💰</span>
                      Tipo de Gasto *
                    </label>
                                         <select
                       value={formData.tipo}
                       onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                       required
                     >
                       <option value="">Selecione o tipo</option>
                       
                                               {/* 🔧 EQUIPAMENTOS E MATERIAIS */}
                        <optgroup label="🔧 EQUIPAMENTOS E MATERIAIS">
                          <option value="equipamentos">🔧 Equipamentos</option>
                          <option value="materiais">📦 Materiais</option>
                        </optgroup>
                       
                       <optgroup label="👥 RECURSOS HUMANOS">
                         <option value="salario">👤 Salário</option>
                         <option value="beneficios">🏥 Benefícios</option>
                         <option value="treinamento">🎓 Treinamento</option>
                       </optgroup>
                       
                       <optgroup label="🚜 SERVIÇOS AGRÍCOLAS">
                         <option value="servicos_agricolas">🚜 Serviços Agrícolas</option>
                         <option value="consultoria">📋 Consultoria</option>
                         <option value="analise_solo">🔬 Análise de Solo</option>
                       </optgroup>
                       
                       <optgroup label="🚗 VEÍCULOS E TRANSPORTE">
                         <option value="veiculos">🚗 Veículos</option>
                         <option value="transporte">🚛 Transporte</option>
                         <option value="combustivel_veiculos">⛽ Combustível Veículos</option>
                       </optgroup>
                       
                       <optgroup label="🏥 SAÚDE E BENEFÍCIOS">
                         <option value="saude">🏥 Saúde</option>
                         <option value="seguros_saude">🛡️ Seguros Saúde</option>
                         <option value="beneficios_sociais">🤝 Benefícios Sociais</option>
                       </optgroup>
                       
                       <optgroup label="📞 COMUNICAÇÃO E TECNOLOGIA">
                         <option value="comunicacao">📞 Comunicação</option>
                         <option value="tecnologia">💻 Tecnologia</option>
                         <option value="internet">🌐 Internet</option>
                       </optgroup>
                       
                       <optgroup label="📋 SERVIÇOS ADMINISTRATIVOS">
                         <option value="administrativo">📋 Administrativo</option>
                         <option value="contabilidade">📊 Contabilidade</option>
                         <option value="juridico">⚖️ Jurídico</option>
                       </optgroup>
                       
                       <optgroup label="💰 IMPOSTOS E TAXAS">
                         <option value="impostos">💰 Impostos</option>
                         <option value="taxas">📄 Taxas</option>
                         <option value="licencas">📋 Licenças</option>
                       </optgroup>
                       
                       <optgroup label="🛡️ SEGUROS">
                         <option value="seguros">🛡️ Seguros</option>
                         <option value="seguro_propriedade">🏠 Seguro Propriedade</option>
                         <option value="seguro_maquinas">🚜 Seguro Máquinas</option>
                       </optgroup>
                       
                       <optgroup label="📋 OUTROS">
                         <option value="outros">📋 Outros</option>
                         <option value="emergencia">🚨 Emergência</option>
                         <option value="diversos">📦 Diversos</option>
                       </optgroup>
                     </select>
                     
                     {/* Aviso sobre insumos e combustível */}
                     <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                       <div className="flex items-start">
                         <span className="text-blue-600 mr-2">💡</span>
                         <div className="text-xs text-blue-800">
                           <strong>Nota:</strong> Gastos de insumos e combustível são registrados automaticamente 
                           pelos processos de plantio e colheita. Eles só aparecem na lista quando você seleciona uma safra específica. 
                           Use esta seção para gastos administrativos, salários, impostos e outros custos operacionais.
                           <br /><br />
                           <strong>Diferença:</strong> Gastos de <em>compra</em> de insumos/combustível (aquisição) não aparecem 
                           quando filtrar por safra, apenas gastos de <em>uso</em> (consumo durante operações).
                         </div>
                       </div>
                     </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-green-600">📝</span>
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Compra de fertilizante NPK"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    />
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-green-600">📅</span>
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
                      required
                    />
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="w-4 h-4 inline mr-2 text-green-600">💵</span>
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200 bg-gray-50/50"
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
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    />
                    <div className="flex-1">
                      <label htmlFor="fixo" className="text-sm font-semibold text-gray-800 cursor-pointer">
                        <span className="w-4 h-4 inline mr-2 text-blue-600">📌</span>
                        Gasto Fixo
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Marque se este é um gasto recorrente que se repete regularmente (aluguel, salários, seguros, etc.)
                      </p>
                    </div>
                  </div>

                                     {/* Referência Condicional */}
                   {(shouldReferenceSafras(formData.tipo) || shouldReferenceFuncionarios(formData.tipo)) && (
                     <div className="bg-gradient-to-r from-gray-100 to-green-100 rounded-xl p-4 border-2 border-gray-200">
                       <h4 className="text-sm font-bold text-gray-800 mb-3">
                         <span className="w-4 h-4 inline mr-2 text-green-600">🔗</span>
                         Referência (Opcional)
                       </h4>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="block text-xs font-semibold text-gray-800 mb-1">
                             Tipo de Referência
                           </label>
                           <select
                             value={formData.referencia_tabela}
                             onChange={(e) => {
                               setFormData({ 
                                 ...formData, 
                                 referencia_tabela: e.target.value,
                                 referencia_id: undefined // Reset ID when changing table
                               })
                             }}
                             className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white font-medium text-gray-900"
                           >
                             <option value="">Selecione...</option>
                             {shouldReferenceSafras(formData.tipo) && (
                               <option value="safras">Safra</option>
                             )}
                             {shouldReferenceFuncionarios(formData.tipo) && (
                               <option value="funcionarios">Funcionário</option>
                             )}
                           </select>
                         </div>
                         
                         <div>
                           <label className="block text-xs font-semibold text-gray-800 mb-1">
                             {getReferenceText(formData.tipo)}
                           </label>
                           <select
                             value={formData.referencia_id || ''}
                             onChange={(e) => setFormData({ 
                               ...formData, 
                               referencia_id: e.target.value ? parseInt(e.target.value) : undefined 
                             })}
                             className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white font-medium text-gray-900"
                             disabled={!formData.referencia_tabela}
                           >
                             <option value="">Selecione...</option>
                             {formData.referencia_tabela === 'safras' && safras.map((safra) => (
                               <option key={safra.id} value={safra.id}>
                                 {safra.safra}
                               </option>
                             ))}
                             {formData.referencia_tabela === 'funcionarios' && funcionarios.map((funcionario) => (
                               <option key={funcionario.id} value={funcionario.id}>
                                 {funcionario.nome}
                               </option>
                             ))}
                           </select>
                         </div>
                       </div>
                     </div>
                   )}
                  
                  {/* Botões com design moderno */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {editingGasto ? '✓ Atualizar Gasto' : '+ Cadastrar Gasto'}
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
