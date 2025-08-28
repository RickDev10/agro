import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de gastos gerais (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/gastos-gerais - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const safraId = url.searchParams.get('safraId')
    const tratorId = url.searchParams.get('tratorId')
    const funcionarioId = url.searchParams.get('funcionarioId')
    const talhaoId = url.searchParams.get('talhaoId')
    
    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)
    
    // Verificar se há filtros específicos
    const hasSpecificFilters = safraId || tratorId || funcionarioId || talhaoId

    if (hasSpecificFilters) {
      // 1. Buscar gastos de insumos que referenciam plantio/colheita
      const { data: gastosInsumos, error: gastosError } = await client
        .from('gastos_gerais')
        .select('*')
        .eq('tipo', 'insumo')
        .or('referencia_tabela.eq.historico_plantio,referencia_tabela.eq.historico_colheita')

      if (gastosError) {
        throw gastosError
      }

      // 2. Buscar gastos de combustível que referenciam plantio/colheita
      const { data: gastosCombustivel, error: combustivelError } = await client
        .from('gastos_gerais')
        .select('*')
        .eq('tipo', 'combustivel')
        .or('referencia_tabela.eq.historico_plantio,referencia_tabela.eq.historico_colheita')

      if (combustivelError) {
        throw combustivelError
      }

      // 3. Para cada gasto, verificar se a operação atende aos filtros
      const gastosFiltrados = []
      
      // Processar gastos de insumos
      if (gastosInsumos) {
        for (const gasto of gastosInsumos) {
          if (gasto.referencia_id && gasto.referencia_tabela) {
            // Buscar a operação referenciada na tabela específica
            const { data: operacao, error: operacaoError } = await client
              .from(gasto.referencia_tabela)
              .select('*')
              .eq('id', gasto.referencia_id)
              .single()

            if (operacaoError) {
              console.warn(`Erro ao buscar operação ${gasto.referencia_tabela} ID ${gasto.referencia_id}:`, operacaoError)
              continue
            }

            // Verificar se a operação atende aos filtros
            let atendeFiltros = true

            if (safraId && operacao.safra_id !== parseInt(safraId)) {
              atendeFiltros = false
            }
            if (tratorId && operacao.trator_id !== parseInt(tratorId)) {
              atendeFiltros = false
            }
            if (funcionarioId && operacao.funcionario_id !== parseInt(funcionarioId)) {
              atendeFiltros = false
            }
            if (talhaoId && operacao.talhao_id !== parseInt(talhaoId)) {
              atendeFiltros = false
            }

            if (atendeFiltros) {
              gastosFiltrados.push(gasto)
            }
          }
        }
      }

      // Processar gastos de combustível
      if (gastosCombustivel) {
        for (const gasto of gastosCombustivel) {
          if (gasto.referencia_id && gasto.referencia_tabela) {
            // Buscar a operação referenciada na tabela específica
            const { data: operacao, error: operacaoError } = await client
              .from(gasto.referencia_tabela)
              .select('*')
              .eq('id', gasto.referencia_id)
              .single()

            if (operacaoError) {
              console.warn(`Erro ao buscar operação ${gasto.referencia_tabela} ID ${gasto.referencia_id}:`, operacaoError)
              continue
            }

            // Verificar se a operação atende aos filtros
            let atendeFiltros = true

            if (safraId && operacao.safra_id !== parseInt(safraId)) {
              atendeFiltros = false
            }
            if (tratorId && operacao.trator_id !== parseInt(tratorId)) {
              atendeFiltros = false
            }
            if (funcionarioId && operacao.funcionario_id !== parseInt(funcionarioId)) {
              atendeFiltros = false
            }
            if (talhaoId && operacao.talhao_id !== parseInt(talhaoId)) {
              atendeFiltros = false
            }

            if (atendeFiltros) {
              gastosFiltrados.push(gasto)
            }
          }
        }
      }

      // 5. Buscar outros gastos (não insumos de plantio/colheita, não compra_insumo e não compra_combustivel)
      const { data: outrosGastos, error: outrosError } = await client
        .from('gastos_gerais')
        .select('*')
        .neq('tipo', 'insumo')
        .neq('tipo', 'compra_insumo')
        .neq('tipo', 'compra_combustivel')
        .order('data', { ascending: false })

      if (outrosError) {
        throw outrosError
      }

      // 6. Combinar apenas gastos filtrados (sem compra_insumo e sem compra_combustivel)
      const todosGastos = [...gastosFiltrados, ...(outrosGastos || [])]
      
      // 7. Ordenar por data
      todosGastos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      console.log('✅ Relatório de gastos gerais gerado (SEGURO):', todosGastos.length, 'registros')
      return NextResponse.json({ success: true, data: todosGastos })
    }

    // Se não há filtros específicos, retornar todos os gastos exceto insumos de plantio/colheita
    const { data, error } = await client
      .from('gastos_gerais')
      .select('*')
      .order('data', { ascending: false })

    if (error) {
      throw error
    }

    // Filtrar para excluir gastos de insumos e combustível que referenciam plantio/colheita
    const filteredData = data?.filter(gasto => {
      // Se é gasto de insumo que referencia plantio ou colheita, excluir
      if (gasto.tipo === 'insumo' && 
          (gasto.referencia_tabela === 'historico_plantio' || 
           gasto.referencia_tabela === 'historico_colheita')) {
        return false
      }
      // Se é gasto de combustível que referencia plantio ou colheita, excluir
      if (gasto.tipo === 'combustivel' && 
          (gasto.referencia_tabela === 'historico_plantio' || 
           gasto.referencia_tabela === 'historico_colheita')) {
        return false
      }
      // Manter todos os outros gastos
      return true
    }) || []

    console.log('✅ Relatório de gastos gerais gerado (SEGURO):', filteredData.length, 'registros')
    return NextResponse.json({ success: true, data: filteredData })
  } catch (error) {
    console.error('❌ Erro ao buscar gastos gerais para relatório:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de gastos gerais' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
