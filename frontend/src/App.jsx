import { LoaderCircle } from 'lucide-react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import Billeteras from '@/pages/Billeteras'
import Configuracion from '@/pages/Configuracion'
import Dashboard from '@/pages/Dashboard'
import FlujoCaja from '@/pages/FlujoCaja'
import Importar from '@/pages/Importar'
import Login from '@/pages/Login'
import Movimientos from '@/pages/Movimientos'
import Presupuesto from '@/pages/Presupuesto'
import Restablecer from '@/pages/Restablecer'
import { configurado } from '@/lib/supabase'
import { useTemaResuelto } from '@/lib/tema'
import { useAuth } from '@/store/auth'
import { AuthProvider } from '@/store/AuthProvider'
import { FinanceProvider } from '@/store/FinanceProvider'

function Protegido() {
  const { usuario } = useAuth()
  return usuario ? <AppShell /> : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/restablecer', element: <Restablecer /> },
  {
    element: <Protegido />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'presupuesto', element: <Presupuesto /> },
      { path: 'billeteras', element: <Billeteras /> },
      { path: 'flujo', element: <FlujoCaja /> },
      { path: 'configuracion/:seccion?', element: <Configuracion /> },
      { path: 'importar', element: <Importar /> },
    ],
  },
])

function Avisos() {
  const tema = useTemaResuelto()
  return <Toaster position="top-center" richColors closeButton theme={tema === 'oscuro' ? 'dark' : 'light'} />
}

function Sesion() {
  const { listo, usuario } = useAuth()
  if (!listo) {
    return (
      <div className="grid min-h-svh place-items-center" role="status">
        <LoaderCircle className="size-8 animate-spin text-leaf" aria-hidden="true" />
        <span className="sr-only">Cargando</span>
      </div>
    )
  }
  return (
    <FinanceProvider key={usuario?.id ?? 'sin-sesion'}>
      <RouterProvider router={router} />
    </FinanceProvider>
  )
}

export default function App() {
  if (!configurado) {
    return (
      <main className="grid min-h-svh place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl">Falta conectar Supabase</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea el archivo <code>frontend/.env.local</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_KEY</code> (usa <code>.env.example</code> como guía) y reinicia el servidor.
          </p>
        </div>
      </main>
    )
  }
  return (
    <AuthProvider>
      <Sesion />
      <Avisos />
    </AuthProvider>
  )
}
