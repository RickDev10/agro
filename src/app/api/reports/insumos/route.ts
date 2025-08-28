import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Relatório de insumos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/reports/insumos - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      insumoId: searchParams.get('insumoId'),
      tipo: searchParams.get('tipo'),
      safraId: searchParams.get('safraId'),
      tratorId: searchParams.get('tratorId'),
      funcionarioId: searchParams.get('funcionarioId'),
      talhaoId: searchParams.get('talhaoId')
    }

    // Usar cliente autenticado para buscar com relacionamentos
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated')
    const client = createAuthenticatedClient(userToken)

    // Verificar se há filtros específicos que indicam busca por operações
    const hasSpecificFilters = filters.safraId || filters.tratorId || filters.funcionarioId || filters.talhaoId

    let allInsumosData: any[] = []

    // Sempre buscar movimentacoes_insumos
    let movimentacoesQuery = client
      .from('movimentacoes_insumos')
      .select(`
        *,
        insumo:insumos(id,insumo,medida)
      `)

    // Aplicar filtros básicos
    if (filters.dataInicio) {
      movimentacoesQuery = movimentacoesQuery.gte('data', filters.dataInicio)
    }
    if (filters.dataFim) {
      movimentacoesQuery = movimentacoesQuery.lte('data', filters.dataFim)
    }
    if (filters.insumoId) {
      movimentacoesQuery = movimentacoesQuery.eq('insumo_id', filters.insumoId)
    }
    if (filters.tipo) {
      movimentacoesQuery = movimentacoesQuery.eq('tipo', filters.tipo)
    }

    const { data: movimentacoesData, error: movimentacoesError } = await movimentacoesQuery
      .order('data', { ascending: false })

    if (movimentacoesError) {
      throw movimentacoesError
    }

    // Adicionar movimentações aos dados
    if (movimentacoesData) {
      allInsumosData.push(...movimentacoesData.map(item => ({
        ...item,
        fonte: 'movimentacao',
        tipo_operacao: 'Movimentação de Estoque'
      })))
    }

    // Se há filtros específicos, buscar gastos de insumos através de gastos_gerais
    if (hasSpecificFilters) {
      // Passo 1: Buscar gastos de insumos em gastos_gerais
      let gastosQuery = client
        .from('gastos_gerais')
        .select('*')
        .eq('tipo', 'insumo')

      if (filters.dataInicio) {
        gastosQuery = gastosQuery.gte('data', filters.dataInicio)
      }
      if (filters.dataFim) {
        gastosQuery = gastosQuery.lte('data', filters.dataFim)
      }

      const { data: gastosInsumos, error: gastosError } = await gastosQuery

      if (gastosError) {
        throw gastosError
      }

      if (gastosInsumos && gastosInsumos.length > 0) {
        // Passo 2: Para cada gasto, buscar a operação de referência
        for (const gasto of gastosInsumos) {
          if (gasto.referencia_id && gasto.referencia_tabela) {
            let operacaoQuery = client
              .from(gasto.referencia_tabela)
              .select('*')

            // Aplicar filtros específicos na operação
            if (filters.safraId) {
              operacaoQuery = operacaoQuery.eq('safra_id', filters.safraId)
            }
            if (filters.tratorId) {
              operacaoQuery = operacaoQuery.eq('trator_id', filters.tratorId)
            }
            if (filters.funcionarioId) {
              operacaoQuery = operacaoQuery.eq('funcionario_id', filters.funcionarioId)
            }
            if (filters.talhaoId) {
              operacaoQuery = operacaoQuery.eq('talhao_id', filters.talhaoId)
            }

            const { data: operacao, error: operacaoError } = await operacaoQuery
              .eq('id', gasto.referencia_id)
              .single()

            if (operacaoError) {
              console.warn(`Erro ao buscar operação ${gasto.referencia_tabela} ID ${gasto.referencia_id}:`, operacaoError)
              continue
            }

            // Se encontrou a operação e ela atende aos filtros, adicionar aos dados
            if (operacao) {
              // Buscar informações do insumo
              const { data: insumoInfo } = await client
                .from('insumos')
                .select('id, insumo, medida')
                .eq('id', gasto.referencia_id)
                .single()

              allInsumosData.push({
                id: `gasto_${gasto.id}`,
                insumo_id: gasto.referencia_id,
                quantidade: gasto.valor, // O valor do gasto representa o custo
                tipo: 'saida',
                data: gasto.data,
                referencia_id: gasto.referencia_id,
                referencia_tabela: gasto.referencia_tabela,
                fonte: 'gasto_geral',
                tipo_operacao: `${gasto.referencia_tabela === 'historico_plantio' ? 'Plantio' : 'Colheita'} - ${gasto.descricao}`,
                insumo: insumoInfo || { id: gasto.referencia_id, insumo: 'Insumo', medida: 'KG' },
                valor_gasto: gasto.valor
              })
            }
          }
        }
      }
    }

    // Ordenar por data (mais recente primeiro)
    allInsumosData.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    console.log('✅ Relatório de insumos gerado (SEGURO):', allInsumosData.length, 'registros')
    return NextResponse.json({
      success: true,
      data: allInsumosData,
      count: allInsumosData.length
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de insumos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de insumos' },
      { status: 500 }
    )
  }
}

// Export protegido
export const GET = withAuth(handleGet)
