import { useEffect, useMemo, useState } from 'react'
import { resultado, supabase } from '@/lib/supabase'
import { AuthContext, PREFERENCIAS } from './auth'

const nombreDe = (email) => {
  const base = email.split('@')[0].replace(/[._-]+/g, ' ')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

const aUsuario = (sesion) =>
  sesion
    ? {
        id: sesion.user.id,
        email: sesion.user.email,
        nombre: sesion.user.user_metadata?.nombre || nombreDe(sesion.user.email),
        preferencias: { ...PREFERENCIAS, ...(sesion.user.user_metadata?.preferencias ?? {}) },
        correoConfirmado: Boolean(sesion.user.email_confirmed_at),
        tutorialVisto: Boolean(sesion.user.user_metadata?.tutorialVisto),
        ultimoAcceso: sesion.user.last_sign_in_at ?? null,
        creadoEn: sesion.user.created_at ?? null,
      }
    : null

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva))
    return () => subscription.unsubscribe()
  }, [])

  const valor = useMemo(
    () => ({
      listo: sesion !== undefined,
      usuario: aUsuario(sesion),
      entrar: (email, clave) => supabase.auth.signInWithPassword({ email, password: clave }).then(resultado),
      registrar: (nombre, email, clave) => supabase.auth.signUp({ email, password: clave, options: { data: { nombre } } }).then(resultado),
      recuperar: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` }).then(resultado),
      actualizar: (datos) => supabase.auth.updateUser(datos).then(resultado),
      salir: (todos = false) => supabase.auth.signOut(todos ? { scope: 'global' } : undefined),
    }),
    [sesion],
  )

  return <AuthContext value={valor}>{children}</AuthContext>
}
