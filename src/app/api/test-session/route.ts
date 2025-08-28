import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTE DE SESSÃO - Iniciando...')
    
    // Verificar token do header Authorization
    const authHeader = request.headers.get('authorization')
    console.log('🔍 Authorization header:', authHeader ? 'PRESENTE' : 'AUSENTE')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Token não fornecido',
        message: 'Token de autorização não encontrado no header'
      }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('🔍 Token extraído:', token ? 'PRESENTE' : 'AUSENTE')
    
    // Verificar token com Supabase
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    console.log('🔍 Resultado da verificação:')
    console.log('- User existe:', !!user)
    console.log('- User ID:', user?.id || 'N/A')
    console.log('- User Email:', user?.email || 'N/A')
    console.log('- Error:', error?.message || 'Nenhum erro')
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar token',
        details: error.message
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido',
        message: 'Token de autenticação inválido'
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Token válido encontrado!',
      user: {
        id: user.id,
        email: user.email
      },
      hasToken: true
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de sessão:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno no teste de sessão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
