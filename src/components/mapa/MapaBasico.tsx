'use client'

import { MapPin } from 'lucide-react'

export default function MapaBasico() {
  return (
    <div className="h-full bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mapa da Propriedade</h3>
        <p className="text-sm text-gray-500">Visualização da localização dos funcionários e equipamentos</p>
      </div>
    </div>
  )
}