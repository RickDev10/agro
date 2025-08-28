import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Verificar estrutura da tabela estoque_combustivel
    const { data: estoqueStructure, error: estoqueError } = await supabase
      .from('estoque_combustivel')
      .select('*')
      .limit(1)

    // Verificar estrutura da tabela movimentacoes_combustivel
    const { data: movimentacoesStructure, error: movimentacoesError } = await supabase
      .from('movimentacoes_combustivel')
      .select('*')
      .limit(1)

    // Verificar estrutura da tabela lotes_combustivel
    const { data: lotesStructure, error: lotesError } = await supabase
      .from('lotes_combustivel')
      .select('*')
      .limit(1)

    return NextResponse.json({
      success: true,
      data: {
        estoque_combustivel: {
          existe: !estoqueError,
          erro: estoqueError?.message,
          estrutura: estoqueStructure && estoqueStructure.length > 0 ? Object.keys(estoqueStructure[0]) : []
        },
        movimentacoes_combustivel: {
          existe: !movimentacoesError,
          erro: movimentacoesError?.message,
          estrutura: movimentacoesStructure && movimentacoesStructure.length > 0 ? Object.keys(movimentacoesStructure[0]) : []
        },
        lotes_combustivel: {
          existe: !lotesError,
          erro: lotesError?.message,
          estrutura: lotesStructure && lotesStructure.length > 0 ? Object.keys(lotesStructure[0]) : []
        }
      }
    })
  } catch (error) {
    console.error('Erro ao verificar estrutura:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar estrutura' },
      { status: 500 }
    )
  }
}
