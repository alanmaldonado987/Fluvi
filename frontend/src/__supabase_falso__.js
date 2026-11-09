export const configurado = true
export const resultado = ({ data, error }) => { if (error) throw error; return data }
export const supabase = new Proxy({}, { get() { (window.__supabaseTocado ||= []).push(1); throw new Error('supabase real bloqueado en el arnés') } })
