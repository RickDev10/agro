'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import DashboardFinanceiroChart from '@/components/charts/DashboardFinanceiroChart'
import EficienciaOperacionalChart from '@/components/charts/EficienciaOperacionalChart'
import EstoqueSobraChart from '@/components/charts/EstoqueSobraChart'
import { BarChart3, TrendingUp, Package, Calculator } from 'lucide-react'

export default function AnalisesPage() {
  const [activeTab, setActiveTab] = useState('dashboard-financeiro')

  const tabs = [
    {
      id: 'dashboard-financeiro',
      name: 'Dashboard Financeiro',
      description: 'KPIs executivos e análise financeira avançada com rentabilidade',
      icon: BarChart3
    },
    {
      id: 'eficiencia-operacional',
      name: 'Eficiência Operacional',
      description: 'Performance de tratores e produtividade por hectare',
      icon: TrendingUp
    },
    {
      id: 'estoque-sobra',
      name: 'Estoque e Sobra',
      description: 'Controle de estoque e recursos não utilizados',
      icon: Package
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Análises Avançadas</h1>
              <p className="mt-2 text-sm text-gray-600">
                Insights detalhados sobre rentabilidade e performance operacional
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'dashboard-financeiro' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Dashboard Financeiro Completo
                    </h2>
                    <p className="text-gray-600">
                      KPIs executivos e análise financeira avançada em uma única visão, incluindo rentabilidade por hectare, break-even, análise de sensibilidade e métricas de performance.
                    </p>
                  </div>
                  <DashboardFinanceiroChart />
                </div>
              )}

              {activeTab === 'eficiencia-operacional' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Eficiência Operacional
                    </h2>
                    <p className="text-gray-600">
                      Análise completa de performance de tratores, produtividade por hectare e eficiência operacional em uma única visão.
                    </p>
                  </div>
                  <EficienciaOperacionalChart />
                </div>
              )}

              {activeTab === 'estoque-sobra' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Estoque e Sobra
                    </h2>
                    <p className="text-gray-600">
                      Controle de estoque e análise de recursos não utilizados para otimização de custos.
                    </p>
                  </div>
                  <EstoqueSobraChart />
                </div>
              )}
            </div>

            {/* Informações Adicionais */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calculator className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Dados em Tempo Real
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Todas as análises são calculadas automaticamente com base nos dados mais recentes do sistema.
                      Os gráficos são atualizados em tempo real conforme novos dados são inseridos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
