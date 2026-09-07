# Correos de Fluvi

Plantillas para los tres correos que la app envía a través de Supabase Auth. Todas usan colores y tono de Fluvi, funcionan en Gmail, Outlook y Apple Mail (tablas y estilos en línea, sin imágenes externas) y saludan por el nombre si existe.

| Plantilla en Supabase | Archivo | Asunto sugerido | Cuándo se envía |
|---|---|---|---|
| Confirm signup | `confirmar-cuenta.html` | Confirma tu cuenta en Fluvi | Al crear la cuenta, si "Confirm email" está activo |
| Reset password | `restablecer-contrasena.html` | Restablece tu contraseña de Fluvi | Al pulsar "¿La olvidaste?" en el login |
| Change email address | `cambio-de-correo.html` | Confirma tu nuevo correo en Fluvi | Al cambiar el correo desde Configuración, Perfil |

Las plantillas Magic Link, Invite user y Reauthentication no se usan en Fluvi; puedes dejarlas como están.

## Opción sin dominio: Gmail

Sirve para arrancar sin comprar dominio. Los correos salen desde una cuenta de Gmail, con límite de unos 500 al día, más que suficiente para pocas usuarias.

1. Crea una cuenta de Gmail dedicada a la app, por ejemplo `fluvi.finanzas@gmail.com`. Una cuenta personal también sirve, pero así el remitente se ve más limpio y no mezclas correos.
2. Entra a [myaccount.google.com/security](https://myaccount.google.com/security) con esa cuenta y activa la **Verificación en dos pasos**. Es obligatoria para el siguiente paso.
3. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), escribe el nombre `Supabase` y pulsa **Crear**. Google muestra una contraseña de 16 letras. Cópiala sin los espacios; solo se muestra una vez.
4. En Supabase, Authentication, **SMTP Settings**, activa Custom SMTP con:

| Campo | Valor |
|---|---|
| Sender email | La dirección de Gmail |
| Sender name | `Fluvi` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | La dirección de Gmail completa |
| Password | La contraseña de aplicación de 16 letras |

5. Guarda y continúa en el paso 3 de esta guía para subir el límite por hora y cargar las plantillas.

Hotmail y Outlook personales ya no aceptan este tipo de conexión con contraseña, así que si tu correo es de Microsoft, crea la cuenta de Gmail del paso 1. Cuando más adelante tengas dominio, cambias los seis campos por los de Resend y listo; las plantillas no se tocan.

## 1. Correo propio con Resend

Necesitas un dominio propio, por ejemplo `fluvi.co`. Sin dominio, Resend solo permite enviarte correos a ti mismo.

1. Crea una cuenta en [resend.com](https://resend.com). El plan gratuito incluye 3.000 correos al mes y 100 al día.
2. En **Domains**, agrega tu dominio. Resend te da tres registros DNS: uno DKIM (TXT), uno SPF (TXT) y uno MX para rebotes. Cópialos en el panel DNS de tu proveedor de dominio y pulsa **Verify**. Puede tardar unos minutos.
3. En **API Keys**, crea una llave llamada `Supabase` con permiso *Sending access*. Cópiala; solo se muestra una vez.

## 2. Conectar Supabase al correo propio

En el proyecto de Supabase, **Authentication**, sección **SMTP Settings** (en algunas versiones está en Project Settings, Authentication):

| Campo | Valor |
|---|---|
| Enable Custom SMTP | Activado |
| Sender email | `cuentas@tu-dominio` (debe ser del dominio verificado) |
| Sender name | `Fluvi` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | La API key de Resend |

Guarda. Luego, en **Authentication**, **Rate Limits**, sube el límite de correos por hora: con SMTP propio ya no aplica el tope de dos por hora del servidor compartido; 30 es un valor razonable.

## 3. Cargar las plantillas

En **Authentication**, **Email Templates**, para cada una de las tres plantillas:

1. Escribe el asunto de la tabla de arriba.
2. Pega el contenido completo del archivo HTML correspondiente en el cuerpo, reemplazando el que viene por defecto.
3. Guarda.

Las variables entre llaves (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Data.nombre }}`) las rellena Supabase al enviar. No las modifiques.

## 4. Probar

- Crea una cuenta con un correo tuyo y revisa que llegue "Confirma tu cuenta en Fluvi" a la bandeja principal, no a spam.
- Desde el login, pide restablecer la contraseña y sigue el enlace hasta la pantalla de contraseña nueva.
- Desde Configuración, Perfil, cambia el correo y confirma desde el enlace.

Si alguno cae en spam, comprueba en Resend que el dominio figure como verificado y que los tres registros DNS estén en verde.
