'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, User, Truck, Navigation } from 'lucide-react'

// Mock data para funcionários com localização - Posicionados dentro dos talhões
const funcionariosMock = [
  {
    id: 1,
    nome: 'João Silva Santos',
    latitude: -23.4520,
    longitude: -48.1220,
    status: 'trabalhando',
    atividade: 'Plantio de Soja',
    talhao: 'Talhão Norte A1',
    ultimaAtualizacao: '2024-08-25T14:30:00'
  },
  {
    id: 2,
    nome: 'Maria Oliveira Costa',
    latitude: -23.4680,
    longitude: -48.1360,
    status: 'pausado',
    atividade: 'Colheita de Milho',
    talhao: 'Talhão Sul C2',
    ultimaAtualizacao: '2024-08-25T14:25:00'
  },
  {
    id: 3,
    nome: 'Pedro Almeida Souza',
    latitude: -23.4400,
    longitude: -48.1130,
    status: 'trabalhando',
    atividade: 'Aplicação de Herbicida',
    talhao: 'Talhão Leste E1',
    ultimaAtualizacao: '2024-08-25T14:35:00'
  },
  {
    id: 4,
    nome: 'Ana Paula Ferreira',
    latitude: -23.4700,
    longitude: -48.1470,
    status: 'trabalhando',
    atividade: 'Manutenção de Trator',
    talhao: 'Oficina Central',
    ultimaAtualizacao: '2024-08-25T14:20:00'
  },
  {
    id: 5,
    nome: 'Carlos Eduardo Lima',
    latitude: -23.4300,
    longitude: -48.1030,
    status: 'pausado',
    atividade: 'Irrigação',
    talhao: 'Talhão Oeste F1',
    ultimaAtualizacao: '2024-08-25T14:15:00'
  }
]

const tratoresMock = [
  {
    id: 1,
    nome: 'John Deere 6110D',
    latitude: -23.4500,
    longitude: -48.1250,
    status: 'ativo',
    operador: 'João Silva Santos',
    combustivel: 85,
    horasOperacao: 1245
  },
  {
    id: 2,
    nome: 'New Holland TL75',
    latitude: -23.4700,
    longitude: -48.1490,
    status: 'manutencao',
    operador: null,
    combustivel: 45,
    horasOperacao: 2180
  },
  {
    id: 3,
    nome: 'Massey Ferguson 4275',
    latitude: -23.4420,
    longitude: -48.1150,
    status: 'ativo',
    operador: 'Pedro Almeida Souza',
    combustivel: 92,
    horasOperacao: 980
  }
]

export default function MapaWrapper() {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showFuncionarios, setShowFuncionarios] = useState(true)
  const [showTratores, setShowTratores] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trabalhando':
      case 'ativo':
        return '#10B981' // green-500
      case 'pausado':
        return '#F59E0B' // yellow-500
      case 'manutencao':
        return '#EF4444' // red-500
      default:
        return '#6B7280' // gray-500
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trabalhando':
        return 'Trabalhando'
      case 'ativo':
        return 'Ativo'
      case 'pausado':
        return 'Pausado'
      case 'manutencao':
        return 'Manutenção'
      default:
        return 'Desconhecido'
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      // Importar Leaflet dinamicamente
      import('leaflet').then((L) => {
        // Criar mapa
        const map = L.map(mapRef.current!).setView([-23.4500, -48.1200], 13)
        mapInstanceRef.current = map

        // Adicionar tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Definir polígonos dos talhões (formas irregulares e maiores)
        const talhoes = [
          {
            nome: 'Talhão Norte A1',
            coordenadas: [
              [-23.4520, -48.1180] as [number, number],
              [-23.4480, -48.1200] as [number, number],
              [-23.4460, -48.1250] as [number, number],
              [-23.4500, -48.1280] as [number, number],
              [-23.4540, -48.1270] as [number, number],
              [-23.4560, -48.1220] as [number, number],
              [-23.4520, -48.1180] as [number, number]
            ],
            cor: '#10B981',
            opacidade: 0.3
          },
          {
            nome: 'Talhão Sul C2',
            coordenadas: [
              [-23.4680, -48.1320] as [number, number],
              [-23.4650, -48.1350] as [number, number],
              [-23.4620, -48.1380] as [number, number],
              [-23.4650, -48.1410] as [number, number],
              [-23.4700, -48.1400] as [number, number],
              [-23.4720, -48.1360] as [number, number],
              [-23.4700, -48.1330] as [number, number],
              [-23.4680, -48.1320] as [number, number]
            ],
            cor: '#F59E0B',
            opacidade: 0.3
          },
          {
            nome: 'Talhão Leste E1',
            coordenadas: [
              [-23.4420, -48.1080] as [number, number],
              [-23.4380, -48.1100] as [number, number],
              [-23.4360, -48.1140] as [number, number],
              [-23.4380, -48.1180] as [number, number],
              [-23.4420, -48.1170] as [number, number],
              [-23.4440, -48.1130] as [number, number],
              [-23.4420, -48.1080] as [number, number]
            ],
            cor: '#3B82F6',
            opacidade: 0.3
          },
          {
            nome: 'Talhão Oeste F1',
            coordenadas: [
              [-23.4320, -48.0980] as [number, number],
              [-23.4280, -48.1000] as [number, number],
              [-23.4260, -48.1040] as [number, number],
              [-23.4280, -48.1080] as [number, number],
              [-23.4320, -48.1070] as [number, number],
              [-23.4340, -48.1030] as [number, number],
              [-23.4320, -48.0980] as [number, number]
            ],
            cor: '#8B5CF6',
            opacidade: 0.3
          },
          {
            nome: 'Oficina Central',
            coordenadas: [
              [-23.4720, -48.1420] as [number, number],
              [-23.4680, -48.1440] as [number, number],
              [-23.4660, -48.1480] as [number, number],
              [-23.4680, -48.1520] as [number, number],
              [-23.4720, -48.1510] as [number, number],
              [-23.4740, -48.1470] as [number, number],
              [-23.4720, -48.1420] as [number, number]
            ],
            cor: '#EF4444',
            opacidade: 0.4
          }
        ]

        // Adicionar polígonos dos talhões ao mapa
        talhoes.forEach((talhao) => {
          const polygon = L.polygon(talhao.coordenadas, {
            color: talhao.cor,
            weight: 2,
            fillColor: talhao.cor,
            fillOpacity: talhao.opacidade
          }).addTo(map)

          // Adicionar popup com informações do talhão
          polygon.bindPopup(`
            <div class="p-2">
              <h4 class="font-semibold text-sm">${talhao.nome}</h4>
              <p class="text-xs text-gray-600">Área: ~50 hectares</p>
              <p class="text-xs text-gray-500">Status: Ativo</p>
            </div>
          `)
        })

        // Adicionar marcadores para funcionários
        if (showFuncionarios) {
          funcionariosMock.forEach((funcionario) => {
            const marker = L.circleMarker([funcionario.latitude, funcionario.longitude], {
              radius: 8,
              fillColor: getStatusColor(funcionario.status),
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map)

            const popupContent = `
              <div class="p-2">
                <h4 class="font-semibold text-sm">${funcionario.nome}</h4>
                <p class="text-xs text-gray-600">${funcionario.atividade}</p>
                <p class="text-xs text-gray-500">${funcionario.talhao}</p>
                <p class="text-xs text-gray-500">Status: ${getStatusText(funcionario.status)}</p>
              </div>
            `
            marker.bindPopup(popupContent)
          })
        }

        // Adicionar marcadores para tratores
        if (showTratores) {
          tratoresMock.forEach((trator) => {
            const marker = L.circleMarker([trator.latitude, trator.longitude], {
              radius: 10,
              fillColor: getStatusColor(trator.status),
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map)

            const popupContent = `
              <div class="p-2">
                <h4 class="font-semibold text-sm">${trator.nome}</h4>
                <p class="text-xs text-gray-600">Operador: ${trator.operador || 'Nenhum'}</p>
                <p class="text-xs text-gray-500">Combustível: ${trator.combustivel}%</p>
                <p class="text-xs text-gray-500">Status: ${getStatusText(trator.status)}</p>
              </div>
            `
            marker.bindPopup(popupContent)
          })
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [showFuncionarios, showTratores])

  return (
    <div className="h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Header do Mapa */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Localização em Tempo Real</h3>
            <p className="text-sm text-gray-500">
              {funcionariosMock.length} funcionários • {tratoresMock.length} tratores
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFuncionarios(!showFuncionarios)}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                showFuncionarios
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <User className="h-4 w-4 mr-1" />
              Funcionários
            </button>
            <button
              onClick={() => setShowTratores(!showTratores)}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                showTratores
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Truck className="h-4 w-4 mr-1" />
              Tratores
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Área do Mapa Real */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Painel Lateral */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              {selectedItem ? 'Detalhes' : 'Funcionários Ativos'}
            </h4>

            {/* Legenda dos Talhões */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Talhões da Propriedade</h5>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#10B981' }}></div>
                  <span>Talhão Norte A1</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#F59E0B' }}></div>
                  <span>Talhão Sul C2</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#3B82F6' }}></div>
                  <span>Talhão Leste E1</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#8B5CF6' }}></div>
                  <span>Talhão Oeste F1</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#EF4444' }}></div>
                  <span>Oficina Central</span>
                </div>
              </div>
            </div>

            {selectedItem ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Voltar à lista
                </button>
                
                {selectedItem.type === 'funcionario' ? (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <User className="h-5 w-5 text-blue-600 mr-2" />
                      <h5 className="font-medium">{selectedItem.data.nome}</h5>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedItem.data.status === 'trabalhando' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(selectedItem.data.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Atividade:</span>
                        <span>{selectedItem.data.atividade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Local:</span>
                        <span>{selectedItem.data.talhao}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Última atualização:</span>
                        <span>{formatTime(selectedItem.data.ultimaAtualizacao)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Truck className="h-5 w-5 text-green-600 mr-2" />
                      <h5 className="font-medium">{selectedItem.data.nome}</h5>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedItem.data.status === 'ativo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {getStatusText(selectedItem.data.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Operador:</span>
                        <span>{selectedItem.data.operador || 'Nenhum'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Combustível:</span>
                        <span>{selectedItem.data.combustivel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Horas de operação:</span>
                        <span>{selectedItem.data.horasOperacao}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {funcionariosMock.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedItem({ type: 'funcionario', data: funcionario })}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: getStatusColor(funcionario.status) }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{funcionario.nome}</p>
                      <p className="text-xs text-gray-500">{funcionario.atividade}</p>
                    </div>
                    <Navigation className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

