import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

// GET - Buscar estoque de combustível com cálculos dinâmicos (PROTEGIDO)
async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/combustivel - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const repository = new AuthenticatedRepository('movimentacoes_combustivel', userToken)
    const result = await repository.findAllWithOptions({ orderBy: 'data', ascending: false })
    
    if (result.error) {
      throw new Error(result.error)
    }

    const movimentacoesData = result.data || []

    // Calcular estoque baseado nas movimentações
    let qnt_total = 0
    let valor_total = 0
    let valor_por_medida = 0

    if (movimentacoesData.length > 0) {
      // Calcular quantidade total (entradas - saídas)
      const entradas = movimentacoesData.filter((m: any) => m.tipo === 'entrada')
      const saidas = movimentacoesData.filter((m: any) => m.tipo === 'saida')
      
      const totalEntradas = entradas.reduce((sum: number, m: any) => sum + (m.quantidade || 0), 0)
      const totalSaidas = saidas.reduce((sum: number, m: any) => sum + (m.quantidade || 0), 0)
      qnt_total = totalEntradas - totalSaidas

      // Calcular valor total de todas as entradas
      const valorTotalEntradas = entradas.reduce((sum: number, m: any) => sum + ((m.quantidade || 0) * (m.custo_unitario || 0)), 0)

      // Calcular preço médio: valor total de todas as entradas ÷ quantidade total de todas as entradas
      if (totalEntradas > 0) {
        valor_por_medida = valorTotalEntradas / totalEntradas
      }

      // Calcular valor total: quantidade calculada das movimentações × preço médio das entradas
      valor_total = qnt_total * valor_por_medida
    }

    const resultado = {
      estoque: {
        qnt_total,
        valor_total,
        valor_por_medida
      },
      lotes: [],
      movimentacoes: movimentacoesData,
      calculos: {
        qnt_total,
        valor_total,
        valor_por_medida
      }
    }

    console.log('✅ Combustível encontrado (SEGURO):', movimentacoesData.length, 'movimentações')
    return NextResponse.json({ success: true, data: resultado })
  } catch (error) {
    console.error('❌ Erro ao buscar combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar combustível' },
      { status: 500 }
    )
  }
}

// POST - Criar nova entrada de combustível (movimentação) (PROTEGIDO)
async function handlePost(request: AuthenticatedRequest) {
  try {
    console.log('🔍 POST /api/combustivel - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { quantidade, custo_unitario, data: dataMovimentacao, observacao } = body

    if (!quantidade || !custo_unitario) {
      return NextResponse.json(
        { success: false, error: 'quantidade e custo_unitario são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('movimentacoes_combustivel', userToken)
    const result = await repository.create({
      tipo: 'entrada',
      quantidade: parseFloat(quantidade),
      custo_unitario: parseFloat(custo_unitario),
      data: dataMovimentacao || new Date().toISOString().split('T')[0],
      observacao: observacao || null
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Movimentação de combustível criada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao criar movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar movimentação de combustível' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar movimentação de combustível (PROTEGIDO)
async function handlePut(request: AuthenticatedRequest) {
  try {
    console.log('🔍 PUT /api/combustivel - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, quantidade, custo_unitario, data: dataMovimentacao, observacao } = body

    if (!id || !quantidade || !custo_unitario) {
      return NextResponse.json(
        { success: false, error: 'id, quantidade e custo_unitario são obrigatórios' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('movimentacoes_combustivel', userToken)
    const result = await repository.update(id, {
      quantidade: parseFloat(quantidade),
      custo_unitario: parseFloat(custo_unitario),
      data: dataMovimentacao,
      observacao: observacao || null
    }, request.userId)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Movimentação de combustível atualizada (SEGURA):', result.data)
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('❌ Erro ao atualizar movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar movimentação de combustível' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir movimentação de combustível (PROTEGIDO)
async function handleDelete(request: AuthenticatedRequest) {
  try {
    console.log('🔍 DELETE /api/combustivel - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const repository = new AuthenticatedRepository('movimentacoes_combustivel', userToken)
    const result = await repository.delete(id)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ Movimentação de combustível excluída (SEGURA):', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao excluir movimentação de combustível:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir movimentação de combustível' },
      { status: 500 }
    )
  }
}

// Exports protegidos
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
