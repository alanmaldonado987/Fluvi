import { createContext, use } from 'react'

export const ListasContext = createContext(null)
export const useListas = () => use(ListasContext)
