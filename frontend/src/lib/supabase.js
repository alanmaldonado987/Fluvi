import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const llave = import.meta.env.VITE_SUPABASE_KEY

export const configurado = Boolean(url && llave)
export const supabase = configurado ? createClient(url, llave) : null

export const resultado = ({ data, error }) => {
  if (error) throw error
  return data
}
