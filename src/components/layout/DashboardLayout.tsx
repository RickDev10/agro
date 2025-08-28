'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  BarChart3,
  Users,
  Wheat,
  Package,
  Truck,
  FileText,
  Map,
  Menu,
  X,
  LogOut,
  User,
  Sprout,
  Scissors,
  Wrench,
  DollarSign,
  Settings,
  ChevronDown,
  Fuel,
  TrendingUp,
  Repeat,
  MapPin
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Funcionários', href: '/dashboard/funcionarios', icon: Users },
    { name: 'Safras', href: '/dashboard/safras', icon: Wheat },
    { name: 'Insumos', href: '/dashboard/insumos', icon: Package },
    { name: 'Combustível', href: '/dashboard/combustivel', icon: Fuel },
    { name: 'Tratores', href: '/dashboard/tratores', icon: Truck },
    { name: 'Talhões', href: '/dashboard/talhoes', icon: Map },
    { name: 'Tipos de Produção', href: '/dashboard/tipos-producao', icon: Sprout },
    { name: 'Plantio', href: '/dashboard/plantio', icon: Sprout },
    { name: 'Colheita', href: '/dashboard/colheita', icon: Scissors },
    { name: 'Manutenção', href: '/dashboard/manutencao', icon: Wrench },
    { name: 'Gastos', href: '/dashboard/gastos', icon: DollarSign },
    { name: 'Gastos Recorrentes', href: '/dashboard/gastos-recorrentes', icon: Repeat },
    { name: 'Mapa', href: '/dashboard/mapa', icon: MapPin },
    { name: 'Relatórios', href: '/dashboard/relatorios', icon: FileText },
    { name: 'Análises', href: '/dashboard/analises', icon: TrendingUp },
  ]

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push('/auth/login')
    }
  }

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleConfiguracao = () => {
    setUserDropdownOpen(false)
    // Aqui você pode navegar para a página de configurações quando criá-la
    // router.push('/dashboard/configuracoes')
    console.log('Navegando para configurações...')
  }

  const handleUserSignOut = () => {
    setUserDropdownOpen(false)
    handleSignOut()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold text-green-600">Agro Dashboard</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${isActive
                              ? 'bg-green-50 text-green-600'
                              : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                            }
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleSignOut}
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Sidebar para mobile */}
      <div className={`lg:hidden ${sidebarOpen ? 'fixed inset-0 z-50' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white px-6 pb-4 border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <h1 className="text-2xl font-bold text-green-600">Agro Dashboard</h1>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                            ${isActive
                              ? 'bg-green-50 text-green-600'
                              : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                            }
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleSignOut}
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-72">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Dropdown do usuário */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="flex items-center gap-x-2 rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <User className="h-5 w-5 text-gray-400" />
                  <span>Usuário</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <button
                        onClick={handleConfiguracao}
                        className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                        Configurações
                      </button>
                      <hr className="border-gray-200 my-1" />
                      <button
                        onClick={handleUserSignOut}
                        className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-900 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-gray-400 group-hover:text-red-500" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
