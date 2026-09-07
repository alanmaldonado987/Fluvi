import { createContext, use } from 'react'

export const AuthContext = createContext(null)
export const useAuth = () => use(AuthContext)
export const PREFERENCIAS = { recordatorios: true, diasSinRegistrar: 3, umbralPresupuesto: 80, alertasPresupuesto: true, pendientesInicio: true }
