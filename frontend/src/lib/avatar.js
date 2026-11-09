import { supabase } from './supabase'

// Foto de perfil. La imagen se recorta en cuadrado y se reduce en el navegador (así pesa unos 20 KB) y se guarda en el
// bucket público "avatares", dentro de la carpeta del usuario. En su perfil queda solo la dirección de la imagen.

// Iniciales del nombre, para cuando no hay foto.
export const iniciales = (nombre) =>
  (nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const BUCKET = 'avatares'
const LADO = 320
const MAX_ORIGINAL = 10 * 1024 * 1024
const TIPOS = ['image/jpeg', 'image/png', 'image/webp']

export const errorAvatar = (codigo, mensaje, opciones) => Object.assign(new Error(mensaje, opciones), { code: codigo })

const canvasABlob = (canvas, tipo, calidad) => new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad))

// Recorta al centro en cuadrado y reduce a LADO x LADO.
export async function prepararImagen(archivo) {
  if (!TIPOS.includes(archivo.type)) throw errorAvatar('tipo', 'Elige una imagen JPG, PNG o WebP.')
  if (archivo.size > MAX_ORIGINAL) throw errorAvatar('peso', 'La imagen pesa más de 10 MB.')
  let imagen
  try {
    imagen = await createImageBitmap(archivo)
  } catch (err) {
    throw errorAvatar('ilegible', 'No se pudo leer la imagen.', { cause: err })
  }
  const lado = Math.min(imagen.width, imagen.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = LADO
  lienzo.height = LADO
  lienzo.getContext('2d').drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, LADO, LADO)
  imagen.close?.()
  const blob = (await canvasABlob(lienzo, 'image/webp', 0.85)) ?? (await canvasABlob(lienzo, 'image/jpeg', 0.85))
  if (!blob) throw errorAvatar('ilegible', 'No se pudo preparar la imagen.')
  return blob
}

const rutaDe = (usuarioId, tipo) => `${usuarioId}/avatar.${tipo === 'image/jpeg' ? 'jpg' : 'webp'}`

// Sube la imagen y devuelve su dirección pública. Lleva una marca de tiempo para que el navegador no muestre la anterior.
export async function subirAvatar(usuarioId, blob) {
  const ruta = rutaDe(usuarioId, blob.type)
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { upsert: true, contentType: blob.type, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function borrarAvatar(usuarioId) {
  const { error } = await supabase.storage.from(BUCKET).remove([rutaDe(usuarioId, 'image/webp'), rutaDe(usuarioId, 'image/jpeg')])
  if (error) throw error
}
