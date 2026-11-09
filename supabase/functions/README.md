# Funciones de Fluvi (Edge Functions)

## enviar-invitacion

Envía el correo de aviso cuando alguien invita a otra persona a una **lista compartida**. Es un extra: aunque no la despliegues, la invitación funciona igual dentro de la app (campana, menú y sección Listas). Con la función, además le llega un correo con un botón para entrar a Fluvi.

**Cómo funciona.** La app la llama justo después de invitar. La función verifica con el token de la sesión que quien llama es el creador de la lista, y envía el correo solo a las personas que esa persona invitó y que aún no lo recibieron, tomando la dirección **de la base de datos** (nunca de la petición). Por eso no sirve para mandar correos a cualquiera. Envía como máximo 10 por llamada y marca cada invitación (`correo_enviado_en`) para no repetirla.

**Usa la misma cuenta de correo que ya configuraste en Supabase** (Gmail con contraseña de aplicación, o Resend por SMTP), porque Supabase solo deja usar esa cuenta para sus propios correos de acceso. Es gratis: las Edge Functions tienen un plan gratuito y el límite de correos es el de tu cuenta (unos 500 al día en Gmail, 100 al día en Resend gratis).

### Instalación (una sola vez)

Necesitas la CLI de Supabase (`npm i -g supabase` o `npx supabase`) y haber iniciado sesión (`supabase login`) y vinculado el proyecto (`supabase link --project-ref TU-REF`).

1. **Aplica la migración** `supabase/migrations/20261109120000_listas_compras.sql` si todavía no lo hiciste (crea la columna `correo_enviado_en` que usa la función).
2. **Carga los secretos.** Son los mismos datos que pusiste en Supabase, Authentication, SMTP Settings:

   ```bash
   supabase secrets set SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_USER=tu-correo@gmail.com SMTP_PASS=contraseña-de-aplicación SMTP_FROM="Fluvi <tu-correo@gmail.com>" APP_URL=https://TU-DOMINIO
   ```

   Con Resend: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASS=tu-API-key` y `SMTP_FROM` con un remitente de tu dominio verificado. `APP_URL` es la dirección pública de la app, sin barra final.
3. **Despliega:**

   ```bash
   supabase functions deploy enviar-invitacion
   ```

   No uses `--no-verify-jwt`: la función necesita la sesión de quien llama para saber quién es.
4. **Prueba.** Invita a otro usuario de Fluvi a una lista compartida: debe llegarle el correo y el aviso dentro de la app.

### Si algo falla
- **No llega el correo, pero la invitación sí aparece en la app:** revisa los registros (`supabase functions logs enviar-invitacion`) y los secretos. La invitación no se pierde: la función no marca como enviada la que falla.
- **Gmail rechaza el inicio de sesión:** usa una contraseña de aplicación de 16 letras (no la contraseña normal) y verifica que la verificación en dos pasos esté activa.

### Pruebas de la lógica

La lógica está en `invitacion.js`, sin dependencias de Deno ni de Supabase, y se prueba sin enviar nada real:

```bash
deno test supabase/functions/enviar-invitacion/invitacion.test.js
```
