'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/auth/login')
    }
  }, [user, loading, router, isRedirecting])

  // Só mostra loading se ainda está carregando E não está redirecionando
  if (loading && !isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Se não tem usuário e não está redirecionando, não renderiza nada
  if (!user && !isRedirecting) {
    return null
  }

  // Se tem usuário, renderiza o conteúdo
  return <>{children}</>
}
