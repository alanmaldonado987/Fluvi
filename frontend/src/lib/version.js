// Versión del aplicativo, definida en VITE_APP_VERSION (.env). Vacía si no está configurada.
export const VERSION = import.meta.env.VITE_APP_VERSION?.trim() ?? ''
