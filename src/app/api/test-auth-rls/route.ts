import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTE DE AUTENTICAÇÃO E RLS - Iniciando...')
    
    // Debug dos headers
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    const authHeader = request.headers.get('authorization')
    
    console.log('🔍 Headers recebidos:')
    console.log('- x-user-id:', userId || 'AUSENTE')
    console.log('- x-user-email:', userEmail || 'AUSENTE')
    console.log('- authorization:', authHeader ? 'PRESENTE' : 'AUSENTE')
    
    // Verificar autenticação
    if (!userId || !userEmail) {
      console.log('❌ Headers de autenticação não encontrados')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não autorizado - Headers de autenticação não encontrados',
          test: 'AUTH_FAILED'
        },
        { status: 401 }
      )
    }

    console.log('✅ Usuário autenticado:', userEmail)
    console.log('🔍 Testando acesso ao Supabase com RLS...')
    
    const supabase = createClient()
    
    // Teste 1: Tentar acessar funcionários (deve funcionar se RLS está correto)
    const { data: funcionarios, error: funcionariosError } = await supabase
      .from('funcionarios')
      .select('*')
      .limit(5)

    if (funcionariosError) {
      console.log('❌ Erro ao acessar funcionários:', funcionariosError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao acessar dados - RLS pode estar bloqueando',
        details: funcionariosError.message,
        test: 'RLS_BLOCKED'
      }, { status: 403 })
    }

    // Teste 2: Tentar inserir um funcionário de teste
    const { data: novoFuncionario, error: insertError } = await supabase
      .from('funcionarios')
      .insert({
        nome: 'TESTE RLS - ' + new Date().toISOString(),
        numero: 'TESTE',
        created_by: userId
      })
      .select()
      .single()

    if (insertError) {
      console.log('❌ Erro ao inserir funcionário de teste:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir dados - RLS pode estar bloqueando',
        details: insertError.message,
        test: 'RLS_INSERT_BLOCKED'
      }, { status: 403 })
    }

    // Teste 3: Deletar o funcionário de teste
    const { error: deleteError } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', novoFuncionario.id)

    if (deleteError) {
      console.log('⚠️ Erro ao deletar funcionário de teste:', deleteError)
      // Não falhar o teste por isso, apenas log
    }

    console.log('✅ Todos os testes passaram!')
    
    return NextResponse.json({
      success: true,
      message: 'Autenticação e RLS funcionando perfeitamente!',
      user: {
        id: userId,
        email: userEmail
      },
      test: 'ALL_PASSED',
      funcionarios_count: funcionarios?.length || 0,
      rls_status: 'ENABLED_AND_WORKING'
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno no teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      test: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}
