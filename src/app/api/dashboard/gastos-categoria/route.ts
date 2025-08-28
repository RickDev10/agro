import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'
import { AuthenticatedRepository } from '@/lib/supabase/authenticated'
import { extractTokenFromRequest } from '@/lib/supabase/authenticated'

async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🔍 GET /api/dashboard/gastos-categoria - SEGURO - Usuário:', request.userEmail)
    
    const userToken = extractTokenFromRequest(request)
    if (!userToken) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }
    
    // Criar repositório autenticado
    const gastosRepo = new AuthenticatedRepository('gastos_gerais', userToken)
    
    // Buscar gastos gerais
    const gastosRes = await gastosRepo.findAllWithOptions({ orderBy: 'data' })

    if (gastosRes.error) throw new Error(gastosRes.error)

    // Agrupar gastos por categoria (apenas gastos de compra/administrativos)
    const categorias: { [key: string]: number } = {}

    // Somar valores por categoria (APENAS gastos de compra/administrativos - SEM filtros)
    gastosRes.data?.forEach((gasto: any) => {
      // Incluir apenas gastos de compra e administrativos
      // Excluir gastos de uso automático (insumo, combustivel sem "compra_")
      if (gasto.tipo === 'insumo' || gasto.tipo === 'combustivel' || 
          gasto.tipo === 'insumos' || gasto.tipo === 'Combustível') {
        return // Excluir gastos de USO
      }
      
      const categoria = gasto.tipo || 'Outros'
      if (!categorias[categoria]) {
        categorias[categoria] = 0
      }
      categorias[categoria] += gasto.valor || 0
    })

    // Converter para array e calcular percentuais
    const totalGastos = Object.values(categorias).reduce((sum, valor) => sum + valor, 0)
    
    // Função para formatar o nome da categoria
    const formatarCategoria = (categoria: string) => {
      const formatacoes: { [key: string]: string } = {
        'compra_combustivel': 'Combustível',
        'compra_insumo': 'Insumos',
        'aluguel': 'Aluguel',
        'salario': 'Salários',
        'beneficios': 'Benefícios',
        'treinamento': 'Treinamento',
        'equipamentos': 'Equipamentos',
        'materiais': 'Materiais',
        'servicos_agricolas': 'Serviços Agrícolas',
        'consultoria': 'Consultoria',
        'analise_solo': 'Análise de Solo',
        'veiculos': 'Veículos',
        'transporte': 'Transporte',
        'combustivel_veiculos': 'Combustível Veículos',
        'saude': 'Saúde',
        'seguros_saude': 'Seguros Saúde',
        'beneficios_sociais': 'Benefícios Sociais',
        'comunicacao': 'Comunicação',
        'tecnologia': 'Tecnologia',
        'internet': 'Internet',
        'administrativo': 'Administrativo',
        'contabilidade': 'Contabilidade',
        'juridico': 'Jurídico',
        'impostos': 'Impostos',
        'taxas': 'Taxas',
        'licencas': 'Licenças',
        'seguros': 'Seguros',
        'seguro_propriedade': 'Seguro Propriedade',
        'seguro_maquinas': 'Seguro Máquinas',
        'emergencia': 'Emergência',
        'diversos': 'Diversos',
        'outros': 'Outros'
      }
      return formatacoes[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1).replace(/_/g, ' ')
    }

    // Processar categorias e agrupar menores que 5%
    const gastosProcessados = Object.entries(categorias)
      .filter(([_, valor]) => valor > 0) // Apenas categorias com valores
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: totalGastos > 0 ? (valor / totalGastos) * 100 : 0
      }))

    // Agrupar categorias menores que 5% em "Outros"
    const outrosGastos = gastosProcessados
      .filter(item => item.percentual < 5)
      .reduce((sum, item) => sum + item.valor, 0)

    const categoriasPrincipais = gastosProcessados
      .filter(item => item.percentual >= 5)
      .map(item => ({
        name: formatarCategoria(item.categoria),
        valor: item.valor,
        percentual: item.percentual.toFixed(1),
        categoria: formatarCategoria(item.categoria)
      }))

    // Adicionar "Outros" se houver gastos menores que 5%
    if (outrosGastos > 0) {
      const outrosPercentual = totalGastos > 0 ? (outrosGastos / totalGastos) * 100 : 0
      categoriasPrincipais.push({
        name: 'Outros',
        valor: outrosGastos,
        percentual: outrosPercentual.toFixed(1),
        categoria: 'Outros'
      })
    }

    // Ordenar por valor (maior para menor)
    categoriasPrincipais.sort((a, b) => b.valor - a.valor)

    return NextResponse.json({ 
      success: true, 
      data: categoriasPrincipais 
    })

  } catch (error) {
    console.error('❌ Erro ao buscar dados de gastos por categoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados de gastos por categoria' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
