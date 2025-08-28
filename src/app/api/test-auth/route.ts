/**
 * API de Teste de Autenticação
 * 
 * Esta API testa se o middleware de autenticação está funcionando corretamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'

async function handleGet(request: AuthenticatedRequest) {
  try {
    console.log('🧪 API de teste executada com sucesso!')
    console.log('👤 Usuário autenticado:', request.userEmail)
    console.log('🆔 User ID:', request.userId)

    return NextResponse.json({
      success: true,
      message: '🎉 Autenticação funcionando perfeitamente!',
      user: {
        id: request.userId,
        email: request.userEmail
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro na API de teste:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

// Aplicar proteção de autenticação
export const GET = withAuth(handleGet)
