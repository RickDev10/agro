import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - Para acessar via navegador
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/insert-test-data - Iniciando...')
    
    const supabase = createClient()
    
    // Primeiro, verificar se já existem funcionários
    const { data: existingData, error: checkError } = await supabase
      .from('funcionarios')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Erro ao verificar dados existentes:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar dados existentes',
        details: checkError.message
      }, { status: 500 })
    }
    
    if (existingData && existingData.length > 0) {
      console.log('✅ Já existem funcionários na tabela')
      return NextResponse.json({
        success: true,
        message: 'Dados já existem na tabela',
        count: existingData.length
      })
    }
    
    // Dados de teste para inserir
    const testData = [
      {
        nome: 'João Silva',
        numero: '(11) 99999-9999'
      },
      {
        nome: 'Maria Santos',
        numero: '(11) 88888-8888'
      },
      {
        nome: 'Pedro Costa',
        numero: '(11) 77777-7777'
      }
    ]
    
    console.log('📝 Inserindo dados de teste:', testData)
    
    const { data, error } = await supabase
      .from('funcionarios')
      .insert(testData)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir dados:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir dados de teste',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Dados de teste inseridos com sucesso!')
    return NextResponse.json({
      success: true,
      message: 'Dados de teste inseridos com sucesso!',
      data: data
    })
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral ao inserir dados de teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Para requisições POST (mantido para compatibilidade)
export async function POST(request: NextRequest) {
  return GET(request)
}
