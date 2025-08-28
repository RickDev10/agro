import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando variáveis de ambiente...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Configurado' : '❌ Não configurado')
    console.log('🔍 Supabase Key:', supabaseKey ? '✅ Configurado' : '❌ Não configurado')
    
    if (supabaseUrl) {
      console.log('🔍 URL (primeiros 50 chars):', supabaseUrl.substring(0, 50) + '...')
    }
    
    if (supabaseKey) {
      console.log('🔍 Key (primeiros 20 chars):', supabaseKey.substring(0, 20) + '...')
    }
    
    return NextResponse.json({
      success: true,
      env: {
        supabaseUrl: supabaseUrl ? '✅ Configurado' : '❌ Não configurado',
        supabaseKey: supabaseKey ? '✅ Configurado' : '❌ Não configurado',
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
        keyPreview: supabaseKey ? supabaseKey.substring(0, 10) + '...' : null
      }
    })
  } catch (error) {
    console.error('❌ Erro ao verificar env:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar variáveis de ambiente'
    }, { status: 500 })
  }
}

