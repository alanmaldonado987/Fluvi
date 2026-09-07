import { Banknote, Brain, Briefcase, Bus, Cat, Clapperboard, CreditCard, Gift, House, Landmark, Package, PartyPopper, PiggyBank, Plane, Receipt, ShoppingBasket, Smartphone, Tag, TrendingUp, Wallet } from 'lucide-react'

const tamano = 'size-5'

const categorias = [
  [/arriendo|renta|hogar|casa/, <House className={tamano} />],
  [/mercado|comida|super/, <ShoppingBasket className={tamano} />],
  [/transporte|bus|taxi|gasolina/, <Bus className={tamano} />],
  [/celular|tel[eé]fono|plan/, <Smartphone className={tamano} />],
  [/recibo|servicio|luz|agua|internet/, <Receipt className={tamano} />],
  [/gato|perro|mascota/, <Cat className={tamano} />],
  [/entretenimiento|cine|streaming/, <Clapperboard className={tamano} />],
  [/psic|salud|m[eé]dic/, <Brain className={tamano} />],
  [/ocio|salida|fiesta/, <PartyPopper className={tamano} />],
  [/viaje|vacacion/, <Plane className={tamano} />],
  [/inversi[oó]n|acciones|cdt/, <TrendingUp className={tamano} />],
  [/salario|sueldo|n[oó]mina/, <Briefcase className={tamano} />],
  [/prima|bono|regalo/, <Gift className={tamano} />],
  [/cesant|ahorro|fondo/, <PiggyBank className={tamano} />],
  [/otro/, <Package className={tamano} />],
]

const billeteras = [
  [/efectivo|cash/, <Banknote className={tamano} />],
  [/nequi|daviplata|movii/, <Smartphone className={tamano} />],
  [/banco|davivienda|bancolombia|bbva|cuenta/, <Landmark className={tamano} />],
  [/tarjeta|nuu|rappi|cr[eé]dito/, <CreditCard className={tamano} />],
]

const buscar = (tabla, nombre, porDefecto) => {
  const n = nombre.toLowerCase()
  const hallado = tabla.find(([patron]) => patron.test(n))
  return hallado ? hallado[1] : porDefecto
}

export const iconoCategoria = (nombre) => buscar(categorias, nombre, <Tag className={tamano} />)
export const iconoBilletera = (nombre) => buscar(billeteras, nombre, <Wallet className={tamano} />)
