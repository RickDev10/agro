import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Lista de tabelas que deveriam existir
    const tabelas = [
      'funcionarios',
      'safras', 
      'talhoes',
      'tratores',
      'insumos',
      'estoque_insumos',
      'lotes_insumos',
      'movimentacoes_insumos',
      'gastos_gerais',
      'historico_plantio',
      'historico_colheita',
      'manutencao',
      'compras_combustivel',
      'movimentacoes_combustivel',
      'lotes_combustivel',
      'estoque_combustivel'
    ]

    const resultados: any = {}

    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1)

        if (error) {
          resultados[tabela] = {
            existe: false,
            erro: error.message,
            codigo: error.code
          }
        } else {
          resultados[tabela] = {
            existe: true,
            registros: data?.length || 0
          }
        }
      } catch (err: any) {
        resultados[tabela] = {
          existe: false,
          erro: err.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      tabelas: resultados,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao verificar tabelas' },
      { status: 500 }
    )
  }
}
