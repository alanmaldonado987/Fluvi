import { FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { SelectField } from '@/components/SelectField'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { claveDe, leerExcel } from '@/lib/excel'
import { anioDe } from '@/lib/format'
import { importarAnio } from '@/lib/repo'
import { cn } from '@/lib/utils'
import { useFinance } from '@/store/context'

const mensajes = {
  anio_con_datos: 'Ese año ya tiene datos en Fluvi. Elige otro año o borra sus datos antes de importar.',
  categoria_desconocida: 'Algún movimiento usa una categoría que no existe. Revisa los nombres detectados.',
  padre_no_encontrado: 'Una subcategoría apunta a una categoría que no existe. Revisa los nombres detectados.',
  sin_sesion: 'Tu sesión expiró. Vuelve a entrar.',
}

const claveCat = (c) => `${c.tipo}|${claveDe(c.padre)}|${claveDe(c.nombre)}`

function ListaCategorias({ tipo, categorias, nombreFinal, existe, onCambio }) {
  const padres = categorias.filter((c) => c.tipo === tipo && !c.padre)
  const filas = padres.flatMap((p) => [p, ...categorias.filter((c) => c.tipo === tipo && c.padre && claveDe(c.padre) === claveDe(p.nombre))])
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{tipo === 'Ingreso' ? 'Ingresos' : 'Egresos'}</h3>
      <ul className="mt-2 grid gap-2">
        {filas.map((c) => (
          <li key={claveCat(c)} className={cn('flex items-center gap-2', c.padre && 'pl-6')}>
            <Input aria-label={`Nombre de ${c.nombre}`} className="bg-card" value={nombreFinal(c)} onChange={(e) => onCambio(c, e.target.value)} />
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', existe(c) ? 'bg-muted text-muted-foreground' : 'bg-mint text-forest')}>{existe(c) ? 'existente' : 'nueva'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Importar() {
  const { state, actions } = useFinance()
  const navigate = useNavigate()
  const entradaArchivo = useRef(null)
  const [lectura, setLectura] = useState(null)
  const [anio, setAnio] = useState(null)
  const [nombres, setNombres] = useState({})
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)

  const elegir = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError(null)
    setOcupado(true)
    try {
      const datos = await leerExcel(archivo)
      setLectura({ archivo, datos })
      setAnio(datos.anio)
      setNombres({})
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const nombreFinal = (c) => (nombres[claveCat(c)] ?? c.nombre).trim() || c.nombre
  const nombrePadre = (x) => state.categorias.find((p) => p.id === x.padreId)?.nombre ?? null
  const existe = (c) => state.categorias.some((x) => x.tipo === c.tipo && claveDe(x.nombre) === claveDe(nombreFinal(c)) && claveDe(nombrePadre(x)) === claveDe(c.padre ? nombreFinal({ tipo: c.tipo, padre: null, nombre: c.padre }) : ''))
  const anioOcupado = (a) =>
    state.movimientos.some((m) => anioDe(m.fecha) === a) || Object.keys(state.presupuestos).some((k) => k.startsWith(`${a}-`)) || Object.keys(state.saldos).some((k) => k.startsWith(`${a}-`))

  const construir = () => {
    const { datos } = lectura
    const renombrar = (tipo, padre, nombre) => nombreFinal({ tipo, padre, nombre })
    return {
      categorias: datos.categorias.map((c) => ({ nombre: nombreFinal(c), tipo: c.tipo, padre: c.padre ? renombrar(c.tipo, null, c.padre) : null })),
      billeteras: datos.billeteras,
      presupuestos: datos.presupuestos.map((p) => ({ ...p, categoria: renombrar(p.tipo, null, p.categoria) })),
      saldos: datos.saldos,
      movimientos: datos.movimientos.map((m) => ({ ...m, categoria: renombrar(m.tipo, null, m.categoria), subcategoria: m.subcategoria ? renombrar(m.tipo, m.categoria, m.subcategoria) : null })),
    }
  }

  const importar = async () => {
    setOcupado(true)
    setError(null)
    try {
      const resumen = await importarAnio(anio, construir())
      await actions.recargar()
      actions.setPeriodo({ anio, mes: 0 })
      toast.success(`Importado: ${resumen.movimientos} movimientos, ${resumen.categorias} categorías nuevas y ${resumen.billeteras} billeteras nuevas.`)
      navigate('/')
    } catch (err) {
      const codigo = Object.keys(mensajes).find((k) => err.message?.includes(k))
      setError(mensajes[codigo] ?? 'No se pudo importar. Inténtalo de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  const datos = lectura?.datos
  const nuevas = datos ? datos.categorias.filter((c) => !existe(c)).length : 0
  const movimientosAnio = datos ? datos.movimientos.filter((m) => anioDe(m.fecha) === anio).length : 0
  const anios = datos ? [...new Set([datos.anio - 1, datos.anio, datos.anio + 1, new Date().getFullYear()])].sort().map((a) => ({ value: String(a), label: String(a) })) : []

  return (
    <div className="grid gap-5">
      <PageHeader title="Importar desde Excel" description="Trae un año completo desde tu archivo de finanzas." />
      <Panel>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Usa tu archivo de finanzas de siempre. Se crean las categorías, las subcategorías escritas como "Categoría / Subcategoría", las billeteras, el presupuesto y los movimientos del año que elijas. Lo que ya exista con el mismo nombre se reutiliza.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input ref={entradaArchivo} type="file" accept=".xlsx,.xlsm,.xls" className="sr-only" onChange={elegir} aria-label="Archivo de Excel" />
          <Button variant="secondary" onClick={() => entradaArchivo.current?.click()} disabled={ocupado}>
            {ocupado && !lectura ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload />}
            {lectura ? 'Elegir otro archivo' : 'Elegir archivo'}
          </Button>
          {lectura ? (
            <span className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="size-4 text-leaf" aria-hidden="true" />
              {lectura.archivo.name}
            </span>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
            {error}
          </p>
        ) : null}
      </Panel>

      {datos ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Categorías" value={String(datos.categorias.length)} hint={`${nuevas} ${nuevas === 1 ? 'nueva' : 'nuevas'}`} />
            <StatCard label="Billeteras" value={String(datos.billeteras.length)} />
            <StatCard label="Valores de presupuesto" value={String(datos.presupuestos.length)} />
            <StatCard label={`Movimientos de ${anio}`} value={String(movimientosAnio)} />
          </div>
          {datos.avisos.length ? (
            <ul className="grid gap-1 rounded-2xl bg-gold/20 px-4 py-3 text-sm text-forest">
              {datos.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : null}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel title="Categorías detectadas" action={<p className="hidden text-xs text-muted-foreground md:block">Corrige los nombres antes de importar</p>}>
              <div className="grid gap-6 md:grid-cols-2">
                <ListaCategorias tipo="Egreso" categorias={datos.categorias} nombreFinal={nombreFinal} existe={existe} onCambio={(c, v) => setNombres({ ...nombres, [claveCat(c)]: v })} />
                <ListaCategorias tipo="Ingreso" categorias={datos.categorias} nombreFinal={nombreFinal} existe={existe} onCambio={(c, v) => setNombres({ ...nombres, [claveCat(c)]: v })} />
              </div>
            </Panel>
            <Panel title="Año destino" className="xl:sticky xl:top-6 xl:self-start">
              <SelectField aria-label="Año" value={String(anio)} onChange={(v) => setAnio(Number(v))} items={anios} />
              <p className="mt-3 text-sm text-muted-foreground">Se importan el presupuesto, los saldos y solo los movimientos con fecha de ese año.</p>
              {anioOcupado(anio) ? (
                <p role="alert" className="mt-3 rounded-xl bg-negative-soft px-3 py-2 text-sm text-negative">
                  Ese año ya tiene datos en Fluvi. Elige otro o borra sus datos primero.
                </p>
              ) : null}
              <Button className="mt-4 w-full" size="lg" disabled={ocupado || anioOcupado(anio)} onClick={importar}>
                {ocupado && lectura ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {ocupado && lectura ? 'Importando' : 'Importar'}
              </Button>
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  )
}
