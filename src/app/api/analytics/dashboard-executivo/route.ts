import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Dashboard executivo (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/analytics/dashboard-executivo - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const safraId = searchParams.get('safraId')
    const periodo = searchParams.get('periodo')

    console.log('🔍 Iniciando cálculo do Dashboard Executivo...')

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Buscar dados básicos
    const [safras, talhoes, gastosGerais] = await Promise.all([
      client.from('safras').select('*').order('safra'),
      client.from('talhoes').select('*'),
      client.from('gastos_gerais').select('*')
    ])

    if (safras.error || talhoes.error || gastosGerais.error) {
      throw new Error('Erro ao buscar dados básicos')
    }

    // Filtrar por safra se especificado
    let gastosFiltrados = gastosGerais.data || []
    if (safraId) {
      // Buscar histórico de plantio e colheita da safra
      const [plantios, colheitas] = await Promise.all([
        client.from('historico_plantio').select('id').eq('safra_id', safraId),
        client.from('historico_colheita').select('id').eq('safra_id', safraId)
      ])

      const idsPlantio = plantios.data?.map(p => p.id) || []
      const idsColheita = colheitas.data?.map(c => c.id) || []

      gastosFiltrados = gastosFiltrados.filter(gasto => {
        if (gasto.tipo === 'insumo' || gasto.tipo === 'combustivel') {
          return idsPlantio.includes(gasto.referencia_id) || idsColheita.includes(gasto.referencia_id)
        }
        return true
      })
    }

    // Filtrar por período se especificado
    if (periodo) {
      const hoje = new Date()
      let dataInicio: Date

      switch (periodo) {
        case '30dias':
          dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90dias':
          dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6meses':
          dataInicio = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1ano':
          dataInicio = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          dataInicio = new Date(0)
      }

      gastosFiltrados = gastosFiltrados.filter(gasto => 
        new Date(gasto.data) >= dataInicio
      )
    }

    // Calcular KPIs
    const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + Number(gasto.valor), 0)
    const totalArea = (talhoes.data || []).reduce((sum, talhao) => sum + Number(talhao.area_hectares || 0), 0)
    
    // Buscar dados de produção das safras
    const safrasComProducao = safras.data?.map(safra => ({
      ...safra,
      faturamento_total: Number(safra.faturamento_total || 0),
      total_colhido: Number(safra.total_colhido || 0),
      lucro_esperado: Number(safra.lucro_esperado || 0)
    })) || []

    const totalFaturamento = safrasComProducao.reduce((sum, safra) => sum + safra.faturamento_total, 0)
    const totalProducao = safrasComProducao.reduce((sum, safra) => sum + safra.total_colhido, 0)
    const totalLucro = safrasComProducao.reduce((sum, safra) => sum + safra.lucro_esperado, 0)

    // Calcular métricas avançadas
    const kpis = {
      // 1. Rentabilidade por Hectare
      rentabilidade_por_hectare: totalArea > 0 ? (totalLucro / totalArea) : 0,
      
      // 2. Custo Médio por Safra
      custo_medio_por_safra: safras.data?.length > 0 ? (totalGastos / safras.data.length) : 0,
      
      // 3. Produtividade por Talhão (média)
      produtividade_por_talhao: talhoes.data?.length > 0 ? (totalProducao / talhoes.data.length) : 0,
      
      // 4. Eficiência Operacional (faturamento / custos)
      eficiencia_operacional: totalGastos > 0 ? (totalFaturamento / totalGastos) : 0,
      
      // 5. Margem Líquida
      margem_liquida: totalFaturamento > 0 ? ((totalFaturamento - totalGastos) / totalFaturamento) * 100 : 0,
      
      // 6. ROI por Cultura (simplificado)
      roi_por_cultura: totalGastos > 0 ? ((totalFaturamento - totalGastos) / totalGastos) * 100 : 0
    }

    console.log('📊 KPIs calculados:', kpis)

    console.log('✅ Dashboard Executivo gerado (SEGURO):', {
      safras: safras.data?.length || 0,
      talhoes: talhoes.data?.length || 0,
      gastos: gastosFiltrados.length
    })

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        resumo: {
          total_safras: safras.data?.length || 0,
          total_talhoes: talhoes.data?.length || 0,
          area_total: totalArea,
          total_gastos: totalGastos,
          total_faturamento: totalFaturamento,
          total_producao: totalProducao,
          total_lucro: totalLucro
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro no Dashboard Executivo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar dashboard executivo' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
