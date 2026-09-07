# Fluvi

App web de finanzas personales que reemplaza un Excel de presupuesto mensual: movimientos, presupuesto por categoría y subcategoría, billeteras, flujo de caja, metas de ahorro y recurrentes.

## Estructura

- `frontend/`: React 19 + Vite, Tailwind v4, shadcn/ui (Base UI), Recharts, Supabase JS.
- `supabase/migrations/`: esquema de la base de datos en orden cronológico. Se ejecutan a mano en el SQL Editor del proyecto.
- `fluvi-requerimientos.md`: requerimientos funcionales de origen.

## Desarrollo local

```bash
cd frontend
cp .env.example .env.local   # y pon la URL y la llave publicable del proyecto Supabase
npm install
npm run dev
```

## Base de datos

En el SQL Editor de Supabase ejecuta cada archivo de `supabase/migrations/` en orden, una sola vez.

En Authentication, sección URL Configuration:

- Site URL: la URL pública de la app.
- Redirect URLs: `https://TU-DOMINIO/restablecer` y `https://TU-DOMINIO/`. Para desarrollo agrega también `http://localhost:5173/restablecer`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Root Directory: `frontend`. Vercel detecta Vite: build `npm run build`, salida `dist`.
3. Variables de entorno (Production y Preview): `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`.
4. Despliega. `frontend/vercel.json` ya redirige todas las rutas a `index.html` y añade cabeceras de seguridad y caché.
5. Actualiza las URLs en Supabase con el dominio que te asigne Vercel.

Alternativa sin repositorio: desde `frontend/` ejecuta `npx vercel` y sigue las preguntas; luego configura las variables con `npx vercel env add`.

## Verificación

```bash
cd frontend
npm run lint
npm run build
```
