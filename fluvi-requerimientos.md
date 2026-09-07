# Fluvi 💧 — Requerimientos App de Finanzas Personales
**Versión:** 1.2 | **Fecha:** Septiembre 2026 | **Origen:** Finanzas_2025.xlsm

---

## 1. Contexto y objetivo

Una colaboradora lleva sus finanzas personales en un libro de Excel con macros (`.xlsm`). El archivo contiene **8 hojas** que cubren ingresos, egresos, saldo por billetera, un flujo de caja proyectado vs. real y un registro transaccional.

El objetivo es construir **Fluvi**, una aplicación web que replique y mejore ese flujo de trabajo sin que ella tenga que cambiar la forma en que piensa sus finanzas. La app debe sentirse como el Excel pero sin sus limitaciones: accesible desde el teléfono, con visualizaciones automáticas y sin riesgo de perder datos por un error de fórmula.

> **Nombre:** Derivado de "flujo" — el concepto central de la app (flujo de caja, flujo de ingresos y egresos). Corto, moderno, fácil de recordar. Escalable como dominio y app móvil.

> **Principio rector:** No cambiar el proceso de la usuaria, digitalizarlo. Las categorías, los nombres de cuentas y la lógica del flujo de caja se preservan tal como están en el Excel.

### Resumen general

| Atributo | Valor |
|---|---|
| Nombre de la app | Fluvi |
| Basado en | `Finanzas_2025.xlsm` (8 hojas) |
| Billeteras/Cuentas | Nequi, Efectivo, Davivienda, Nuu |
| Categorías de egreso | 12 fijas (extensibles) |
| Categorías de ingreso | 5 fijas (extensibles) |
| Período | Año calendario (Enero – Diciembre) |
| Usuarios iniciales | 1 (arquitectura preparada para escalar) |

---

## 2. Módulos de la aplicación

La app se divide en **6 módulos** que corresponden directamente con las hojas del Excel original.

| Módulo | Descripción | Hoja Excel origen |
|---|---|---|
| **Dashboard** | Resumen del mes en curso: saldo total, ingresos vs. egresos, alertas de presupuesto | Hoja Dashboard |
| **Registro de movimientos** | CRUD de transacciones: fecha, tipo, categoría, concepto, valor, observación | Hoja Registros |
| **Ingresos** | Tabla mensual de ingresos proyectados por categoría con totales automáticos | Hoja Ingresos |
| **Egresos** | Tabla mensual de egresos proyectados por las 12 categorías fijas | Hoja Egresos |
| **Caja / Billeteras** | Saldo por billetera con histórico mensual y total consolidado | Hoja Caja |
| **Flujo de Caja** | Proyectado vs. real por categoría y mes, con diferencia y saldo inicial | Hoja Flujo de Caja |

---

## 3. Requerimientos funcionales

### 3.1 Gestión de movimientos

| ID | Requerimiento | Prioridad | Origen Excel |
|---|---|---|---|
| RF-01 | Registrar una transacción con: fecha, mes, tipo (Ingreso/Egreso), categoría, concepto, valor y observación opcional | Alta | Hoja Registros |
| RF-02 | Editar una transacción existente | Alta | Hoja Registros |
| RF-03 | Eliminar una transacción con confirmación | Alta | Hoja Registros |
| RF-04 | Filtrar movimientos por mes, tipo y categoría | Alta | Hoja Registros |
| RF-05 | El sistema asigna automáticamente el número consecutivo (N°) | Media | Hoja Registros col A |
| RF-06 | Búsqueda de movimientos por concepto o valor | Baja | — |

### 3.2 Categorías y presupuesto

| ID | Requerimiento | Prioridad | Origen Excel |
|---|---|---|---|
| RF-07 | Mostrar tabla de ingresos proyectados por categoría y mes (Salario, Primas, Cesantías, Ahorros, Inversión) | Alta | Hoja Ingresos |
| RF-08 | Mostrar tabla de egresos proyectados por las 12 categorías del Excel | Alta | Hoja Egresos |
| RF-09 | Editar valores proyectados de ingresos y egresos por mes | Alta | Hojas Ingresos/Egresos |
| RF-10 | Calcular automáticamente los totales mensuales de ingresos y egresos | Alta | Fila Total |
| RF-11 | Permitir crear categorías personalizadas adicionales | Media | — |

**Categorías de egreso (semilla inicial):**
Arriendo, Mercado, Transporte, Plan celular, Recibos, Gatos, Entretenimiento, Psicología, Ocio, Viajes, Otros gastos, Inversión

**Categorías de ingreso (semilla inicial):**
Salario, Primas, Cesantías, Ahorros 2024, Inversión

> Las categorías semilla no pueden eliminarse. La usuaria puede agregar nuevas.

### 3.3 Flujo de caja (proyectado vs. real)

| ID | Requerimiento | Prioridad | Origen Excel |
|---|---|---|---|
| RF-12 | Calcular automáticamente el "Real" de cada categoría sumando los movimientos registrados | Alta | Columna Real |
| RF-13 | Mostrar la diferencia (Proyección – Real) en tiempo real | Alta | Columna Dif/Pendiente |
| RF-14 | Calcular y mostrar el Saldo Inicial de cada mes (arrastrado del mes anterior) | Alta | Fila Saldo Inicial |
| RF-15 | Indicar visualmente en rojo/verde si una categoría está por encima o debajo del presupuesto | Media | Formato condicional Excel |

### 3.4 Billeteras / Caja

| ID | Requerimiento | Prioridad | Origen Excel |
|---|---|---|---|
| RF-16 | Registrar el saldo de cada billetera (Nequi, Efectivo, Davivienda, Nuu) por mes | Alta | Hoja Caja |
| RF-17 | Mostrar el saldo total consolidado de todas las billeteras | Alta | Fila Total |
| RF-18 | Agregar o eliminar billeteras | Media | — |

### 3.5 Dashboard y reportes

| ID | Requerimiento | Prioridad | Origen Excel |
|---|---|---|---|
| RF-19 | Mostrar resumen del mes actual: total ingresos, total egresos, ahorro neto y saldo en billeteras | Alta | Hoja Dashboard |
| RF-20 | Gráfica de distribución de egresos por categoría (torta o barras) | Media | Hoja Dashboard |
| RF-21 | Gráfica de evolución anual ingresos vs. egresos (líneas) | Media | Hoja Dashboard |
| RF-22 | Exportar datos en Excel (.xlsx) con la misma estructura del archivo original | Media | Compatibilidad |
| RF-23 | Importar datos iniciales desde el Excel existente | Baja | Migración |

### 3.6 Alertas y notificaciones

| ID | Requerimiento | Prioridad | Estado |
|---|---|---|---|
| RF-24 | Mostrar alerta en Dashboard cuando el real de cualquier categoría de egreso supere el proyectado del mes | Alta | ✅ Confirmado |
| RF-25 | Marcar en rojo la fila en Flujo de Caja cuando el real supera el proyectado | Alta | ✅ Confirmado |
| RF-26 | Mostrar indicador de "mes saludable" cuando todos los egresos están dentro del presupuesto | Media | ✅ Confirmado |

---

## 4. Requerimientos no funcionales

| ID | Requerimiento | Categoría | Estado |
|---|---|---|---|
| RNF-01 | Diseño **responsive**: móvil, tablet y desktop. En móvil la navegación principal va en barra inferior (accesible con el pulgar) | Usabilidad | ✅ Confirmado |
| RNF-02 | Tiempo de carga inicial < 2 segundos en conexión 4G estándar | Rendimiento | ✅ |
| RNF-03 | Datos persistentes en la nube entre sesiones. No se requiere modo offline | Confiabilidad | ✅ Confirmado |
| RNF-04 | Autenticación individual. Arquitectura preparada para multiusuario sin rediseño (usar `user_id` en todas las tablas desde el inicio) | Seguridad | ✅ Confirmado |
| RNF-05 | Cálculos deterministas: el mismo input siempre produce el mismo resultado | Exactitud | ✅ |
| RNF-06 | Interfaz usable sin capacitación previa | Usabilidad | ✅ |
| RNF-07 | Valores monetarios en COP con separador de miles — ej: `$1.250.000` | Presentación | ✅ |
| RNF-08 | Año fiscal = año calendario (1 ene – 31 dic). Cada año es un período independiente con su propio presupuesto y registros | Lógica temporal | ✅ Confirmado |

---

## 5. Modelo de datos

Entidades derivadas directamente del Excel. El flujo de caja consolida los `Movimiento`s por mes y categoría contra el `Presupuesto`.

### Movimiento (Registro)

```sql
movimientos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users NOT NULL,
  consecutivo   SERIAL,
  fecha         DATE NOT NULL,
  mes           TEXT NOT NULL,           -- 'Enero', 'Febrero', etc.
  anio          INTEGER NOT NULL,        -- año calendario
  tipo          TEXT NOT NULL,           -- 'Ingreso' | 'Egreso'
  categoria_id  UUID REFERENCES categorias(id),
  concepto      TEXT,
  valor         NUMERIC(14,2) NOT NULL,
  observacion   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

### Categoría

```sql
categorias (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES auth.users NOT NULL,
  nombre    TEXT NOT NULL,
  tipo      TEXT NOT NULL,    -- 'Ingreso' | 'Egreso'
  es_fija   BOOLEAN DEFAULT false,
  orden     INTEGER DEFAULT 0
)
```

### Presupuesto

```sql
presupuestos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users NOT NULL,
  anio              INTEGER NOT NULL,
  mes               TEXT NOT NULL,
  categoria_id      UUID REFERENCES categorias(id),
  valor_proyectado  NUMERIC(14,2) DEFAULT 0,
  UNIQUE (user_id, anio, mes, categoria_id)
)
```

### Billetera (Caja)

```sql
billeteras (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID REFERENCES auth.users NOT NULL,
  nombre   TEXT NOT NULL,
  activa   BOOLEAN DEFAULT true
)

saldos_billetera (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billetera_id  UUID REFERENCES billeteras(id),
  anio          INTEGER NOT NULL,
  mes           TEXT NOT NULL,
  saldo         NUMERIC(14,2) DEFAULT 0,
  UNIQUE (billetera_id, anio, mes)
)
```

### Datos semilla

```sql
-- Categorías de egreso (es_fija = true)
INSERT INTO categorias (nombre, tipo, es_fija, orden) VALUES
  ('Arriendo',        'Egreso', true, 1),
  ('Mercado',         'Egreso', true, 2),
  ('Transporte',      'Egreso', true, 3),
  ('Plan celular',    'Egreso', true, 4),
  ('Recibos',         'Egreso', true, 5),
  ('Gatos',           'Egreso', true, 6),
  ('Entretenimiento', 'Egreso', true, 7),
  ('Psicología',      'Egreso', true, 8),
  ('Ocio',            'Egreso', true, 9),
  ('Viajes',          'Egreso', true, 10),
  ('Otros gastos',    'Egreso', true, 11),
  ('Inversión',       'Egreso', true, 12);

-- Categorías de ingreso (es_fija = true)
INSERT INTO categorias (nombre, tipo, es_fija, orden) VALUES
  ('Salario',    'Ingreso', true, 1),
  ('Primas',     'Ingreso', true, 2),
  ('Cesantías',  'Ingreso', true, 3),
  ('Ahorros',    'Ingreso', true, 4),
  ('Inversión',  'Ingreso', true, 5);

-- Billeteras iniciales
INSERT INTO billeteras (nombre) VALUES
  ('Nequi'), ('Efectivo'), ('Davivienda'), ('Nuu');
```

---

## 6. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + Vite con Javascript | Ecosistema amplio, hot-reload, librerías de tablas y gráficas |
| UI / Estilos | Tailwind CSS v3 + shadcn/ui | Componentes accesibles listos, skills de este proyecto, móvil-primero por defecto |
| Gráficas | Recharts | Nativo React, responsive, cubre barras, líneas y tortas |
| Backend / DB | Supabase (PostgreSQL) | DB gestionada, auth incluida, API REST automática, plan free generoso |
| Autenticación | Supabase Auth | Login por email/contraseña o magic link, sin gestión manual de tokens |
| Exportación Excel | SheetJS (`xlsx`) | Genera `.xlsx` en el cliente sin backend |
| Formato moneda | `Intl.NumberFormat` | API nativa del navegador para COP, sin librerías extra |

---

## 7. Fases de desarrollo

### Fase 1 — MVP: Registro y consulta (~2 semanas)
- Configuración del proyecto (Vite + React + Supabase)
- Autenticación básica (login por email)
- Módulo Registros: CRUD completo de movimientos
- Categorías y billeteras precargadas (semilla de datos)
- Totales automáticos de ingresos y egresos por mes

### Fase 2 — Presupuesto, Flujo de Caja y Alertas (~2 semanas)
- Editor de presupuesto mensual (proyectado por categoría)
- Vista Flujo de Caja: proyectado vs. real vs. diferencia
- Indicadores rojo/verde por categoría (sobre/bajo presupuesto) — RF-15
- Alertas en Dashboard cuando un egreso supera el proyectado — RF-24/25/26
- Módulo Caja/Billeteras: saldo por entidad y totales

### Fase 3 — Dashboard y visualizaciones (~1 semana)
- Dashboard con resumen del mes actual — RF-19
- Gráfica de distribución de egresos (torta) — RF-20
- Gráfica de evolución anual ingresos vs. egresos (líneas) — RF-21
- Ahorro neto acumulado en el año

### Fase 4 — Exportación y ajustes (~1 semana)
- Exportar datos a `.xlsx` con la estructura del Excel original — RF-22
- Ajustes de UX móvil basados en retroalimentación
- Categorías personalizadas adicionales — RF-11

---

## 8. Decisiones tomadas

| # | Pregunta | Decisión | Impacto técnico |
|---|---|---|---|
| 1 | ¿Monousuario o multiusuario? | Monousuario ahora, arquitectura preparada para escalar | Añadir `user_id` en todas las tablas desde el inicio |
| 2 | ¿Acceso offline? | No por ahora | Sin PWA ni service workers. Simplifica el desarrollo |
| 3 | ¿Módulo de Inversiones? | Fuera del alcance de la v1 | La hoja Inversiones del Excel se ignora por ahora |
| 4 | ¿Migrar datos del Excel 2025? | No, la app parte de cero | Sin script de migración. El Excel sigue como referencia histórica |
| 5 | ¿Alertas por presupuesto excedido? | Sí | RF-24, RF-25 y RF-26 incluidos en Fase 2 |
| 6 | ¿Año fiscal? | Año calendario: 1 enero – 31 diciembre | Selector de año en la interfaz; cada año tiene su propio presupuesto y registros |
