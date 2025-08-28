'use client'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import dynamic from 'next/dynamic'

// Importação dinâmica do wrapper do mapa para evitar problemas de SSR
const MapaWrapper = dynamic(() => import('@/components/mapa/MapaWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  )
})

export default function MapaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mapa em Tempo Real</h1>
              <p className="text-gray-600">Localização e atividades dos funcionários</p>
            </div>
          </div>

          {/* Mapa */}
          <div className="h-96 bg-white shadow rounded-lg overflow-hidden">
            <MapaWrapper />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}