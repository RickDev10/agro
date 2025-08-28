import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => {
  if (!supabaseUrl) {
    console.error('❌ Supabase URL not found!')
    throw new Error('Supabase URL not configured')
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ Supabase Anon Key not found!')
    throw new Error('Supabase Anon Key not configured')
  }
  
  console.log('🔍 Cliente servidor usando: Anon Key (para verificar tokens de usuário)')
  
  return supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente com Service Role Key para operações privilegiadas
export const createServiceClient = () => {
  if (!supabaseUrl) {
    console.error('❌ Supabase URL not found!')
    throw new Error('Supabase URL not configured')
  }
  
  if (!supabaseServiceKey) {
    console.error('❌ Supabase Service Role Key not found!')
    throw new Error('Supabase Service Role Key not configured')
  }
  
  console.log('🔍 Cliente servidor usando: Service Role Key (para operações privilegiadas)')
  
  return supabaseCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
