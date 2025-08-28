import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando Service Role Key...')
    
    const supabase = createClient()
    console.log('✅ Cliente Supabase criado')
    
    // Testar se consegue acessar dados com a service role key
    const { data, error } = await supabase
      .from('funcionarios')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar dados:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao acessar dados',
        details: error.message,
        keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anônima'
      }, { status: 500 })
    }
    
    console.log('✅ Dados acessados com sucesso:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Service Role Key funcionando!',
      data: data,
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anônima'
    })
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral no teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anônima'
    }, { status: 500 })
  }
}

