import { createContext, use } from 'react'

export const FinanceContext = createContext(null)
export const useFinance = () => use(FinanceContext)
