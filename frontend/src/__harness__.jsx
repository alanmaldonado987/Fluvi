import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { AppShell } from '@/components/layout/AppShell'
import Billeteras from '@/pages/Billeteras'
import Configuracion from '@/pages/Configuracion'
import Dashboard from '@/pages/Dashboard'
import Deudas from '@/pages/Deudas'
import FlujoCaja from '@/pages/FlujoCaja'
import ListaDetalle from '@/pages/ListaDetalle'
import Listas from '@/pages/Listas'
import Movimientos from '@/pages/Movimientos'
import Presupuesto from '@/pages/Presupuesto'
import { AuthContext, PREFERENCIAS } from '@/store/auth'
import { FinanceProvider } from '@/store/FinanceProvider'
import { ListasProvider } from '@/store/ListasProvider'
import { useTemaResuelto } from '@/lib/tema'
import '@/lib/listasRepo'

const mk = (id, nombre, tut = true) => ({ id, email: `${id}@ejemplo.co`, nombre, tutorialVisto: tut, correoConfirmado: true, preferencias: { ...PREFERENCIAS } })
const USUARIOS = { ana: mk('ana', 'Ana'), beto: mk('beto', 'Beto'), carla: mk('carla', 'Carla', false) }
window.__usuarioActual = new URLSearchParams(location.search).get('u') || 'ana'
window.__registroFinanzas ||= []
window.__set = (el, v) => { const p = Object.getPrototypeOf(el); Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
window.__agregar = async (n, p, f) => {
  __set(document.querySelector('[aria-label="Nombre del ítem"]'), n)
  __set(document.querySelector('[aria-label=Precio]'), String(p))
  if (f) __set(document.querySelector('[type=date]'), f)
  await new Promise((r) => setTimeout(r, 100))
  ;[...document.querySelectorAll('form button')].find((b) => b.innerText.trim() === 'Agregar').click()
  await new Promise((r) => setTimeout(r, 100))
}

const router = createMemoryRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'movimientos', element: <Movimientos /> },
        { path: 'presupuesto', element: <Presupuesto /> },
        { path: 'billeteras', element: <Billeteras /> },
        { path: 'deudas', element: <Deudas /> },
        { path: 'listas', element: <ListasProvider />, children: [{ index: true, element: <Listas /> }, { path: ':id', element: <ListaDetalle /> }] },
        { path: 'flujo', element: <FlujoCaja /> },
        { path: 'configuracion/:seccion?', element: <Configuracion /> },
      ],
    },
  ],
  { initialEntries: [new URLSearchParams(location.search).get('ruta') || '/'] },
)
window.__ir = (p) => router.navigate(p)
window.__ruta = () => router.state.location.pathname

function Avisos() {
  const tema = useTemaResuelto()
  return <Toaster position="top-center" richColors closeButton theme={tema === 'oscuro' ? 'dark' : 'light'} style={{ '--border-radius': '16px' }} toastOptions={{ className: 'font-sans shadow-elevated' }} />
}

function Arnes() {
  const [id, setId] = useState(window.__usuarioActual)
  const cambiar = (nuevo) => { window.__usuarioActual = nuevo; setId(nuevo) }
  window.__cambiarUsuario = cambiar
  const usuario = USUARIOS[id]
  const valor = { usuario, listo: true, actualizar: async () => {}, entrar: async () => {}, salir: async () => {} }
  return (
    <>
      <div id="barra-arnes" style={{ background: '#222', color: '#fff', font: '12px sans-serif', padding: '4px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
        Usuario:
        <select id="sel-usuario" value={id} onChange={(e) => cambiar(e.target.value)} aria-label="Usuario del arnés" style={{ color: '#000' }}>
          <option value="ana">Ana</option><option value="beto">Beto</option><option value="carla">Carla</option>
        </select>
        <button id="btn-oscuro" onClick={() => document.documentElement.classList.toggle('dark')}>oscuro</button>
      </div>
      <AuthContext value={valor} key={id}>
        <FinanceProvider>
          <RouterProvider router={router} />
        </FinanceProvider>
        <Avisos />
      </AuthContext>
    </>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><Arnes /></StrictMode>)
