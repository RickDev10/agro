import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
    const supabase = createClient()
    
    // Testar conexão fazendo uma query simples
    const { data, error } = await supabase
      .from('funcionarios')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro na conexão com Supabase',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    return NextResponse.json({
      success: true,
      message: 'Conexão com Supabase funcionando!',
      data: data
    })
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral no teste de conexão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

