import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 DEBUG HEADERS - Iniciando...')
  
  const headers = {}
  request.headers.forEach((value, key) => {
    if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('user')) {
      headers[key] = value
    }
  })
  
  console.log('🔍 Headers relacionados à auth:')
  console.log(JSON.stringify(headers, null, 2))
  
  return NextResponse.json({
    success: true,
    message: 'Debug de headers',
    headers,
    allHeadersCount: request.headers.keys().length
  })
}
