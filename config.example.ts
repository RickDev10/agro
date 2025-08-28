// Copie este arquivo para .env.local e preencha com suas credenciais do Supabase

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
}
