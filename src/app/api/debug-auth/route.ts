import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth - Iniciando...')
    
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Auth Header:', authHeader ? '✅ Existe' : '❌ Não existe')
    
    if (authHeader) {
      console.log('🔍 Auth Header Value:', authHeader.substring(0, 50) + '...')
    }
    
    // Testar cliente Supabase
    const supabase = createClient()
    console.log('✅ Cliente Supabase criado')
    
    // Se tem token, tentar verificar
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      console.log('🔍 Verificando token...')
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error) {
        console.error('❌ Erro ao verificar token:', error)
        return NextResponse.json({
          success: false,
          error: 'Erro ao verificar token',
          details: error.message
        }, { status: 401 })
      }
      
      if (!user) {
        console.log('❌ Usuário não encontrado')
        return NextResponse.json({
          success: false,
          error: 'Usuário não encontrado'
        }, { status: 401 })
      }
      
      console.log('✅ Usuário autenticado:', user.email)
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        message: 'Autenticação funcionando!'
      })
    }
    
    // Se não tem token, retornar info de debug
    return NextResponse.json({
      success: false,
      error: 'Token não fornecido',
      debug: {
        hasAuthHeader: !!authHeader,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'
      }
    }, { status: 401 })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro geral no debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

