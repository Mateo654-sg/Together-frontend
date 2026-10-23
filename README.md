# Together — Frontend Web

> Aplicación web progresiva (PWA) de finanzas compartidas para parejas.  
> Construida con React 19 + TypeScript + Vite, diseñada para ser instalable
> en iOS y Android como app nativa.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Requisitos](#requisitos)
3. [Configuración del entorno](#configuración-del-entorno)
4. [Instalación y desarrollo](#instalación-y-desarrollo)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Arquitectura de autenticación](#arquitectura-de-autenticación)
7. [Design system](#design-system)
8. [PWA y modo offline](#pwa-y-modo-offline)
9. [Testing](#testing)
10. [Scripts disponibles](#scripts-disponibles)
11. [Despliegue](#despliegue)

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | React 19 | Concurrent features, Suspense boundaries |
| Build | Vite 6 | HMR, ESM nativo, tree-shaking agresivo |
| Lenguaje | TypeScript 5.9 | Strict mode habilitado |
| Ruteo | React Router v7 | Lazy loading por página |
| Estado global | Zustand 5 | Auth store (sesión + usuario) |
| Server state | TanStack Query 5 | Cache, staleTime 5 min, retry x2 |
| Formularios | React Hook Form 7 + Zod 4 | Validación en cliente |
| HTTP | Axios 1 | Interceptores JWT + refresh automático |
| UI icons | Lucide React | SVG tree-shakeable |
| Animaciones | Framer Motion 11 | Micro-interacciones |
| Gráficos | Recharts 2 | Dashboards financieros |
| PWA | vite-plugin-pwa + Workbox | Precaching, background sync |
| Fechas | date-fns 4 | Locale `es` |
| i18n | i18next + react-i18next | Preparado para multi-idioma |

---

## Requisitos

- **Node.js** 18 LTS o 20 LTS
- **npm** 9+

---

## Configuración del entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env.local
```

### Variables de entorno disponibles

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API REST | `http://localhost:8000/api/v1` |
| `VITE_GOOGLE_WEB_CLIENT_ID` | Client ID de Google OAuth (GSI) | *(requerido para OAuth)* |

> En **producción** la API se sirve desde el mismo origen (proxy Vercel/Render),
> por lo que `VITE_API_URL` no es necesario y las cookies de sesión funcionan
> sin configuración adicional de CORS.

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con HMR
npm run dev
```

Abre `http://localhost:5173` en el navegador.

---

## Estructura del proyecto

```
Together-frontend/
├── index.html                  # Shell HTML: meta PWA, Google GSI script
├── public/icons/               # Iconos PWA (192, 512, maskable, apple-touch)
└── src/
    ├── app/
    │   ├── App.tsx             # Raíz: providers (Query, Toast, Theme, PWA)
    │   └── router.tsx          # Rutas con lazy loading y guardas RequireAuth/RequireGuest
    ├── config/
    │   ├── api.ts              # Cliente Axios + interceptores JWT + refresh automático
    │   └── token-store.ts      # Access token en memoria (nunca localStorage)
    ├── features/               # Módulos de negocio (un directorio por feature)
    │   ├── auth/               # Login, Register, ForgotPassword, Reset, VerifyEmail
    │   │   ├── components/     # GoogleSignInButton (GSI con patrón callbackRef)
    │   │   ├── pages/
    │   │   └── store/          # auth-store.ts (Zustand) — sesión y usuario
    │   ├── dashboard/          # Stats, gráficos, resumen del mes
    │   ├── expenses/           # CRUD de gastos individuales
    │   ├── incomes/            # CRUD de ingresos individuales
    │   ├── shared-finance/     # Gastos/ingresos compartidos de pareja
    │   ├── debts/              # Deudas entre la pareja
    │   ├── goals/              # Metas de ahorro con seguimiento
    │   ├── budgets/            # Presupuestos mensuales con alertas
    │   ├── reminders/          # Recordatorios de pagos
    │   ├── categories/         # Categorías y etiquetas personalizadas
    │   ├── couple/             # Vinculación de pareja por invitación
    │   ├── chat/               # Mensajería interna de pareja
    │   ├── calendar/           # Vista calendario de movimientos
    │   ├── activity/           # Feed de actividad reciente (gastos + ingresos)
    │   ├── ai/                 # Asistente financiero con IA (OpenAI)
    │   ├── notifications/      # Centro de notificaciones
    │   ├── profile/            # Perfil de usuario y ajustes
    │   ├── reports/            # Reportes y exportaciones
    │   ├── transfers/          # Transferencias entre cuentas
    │   └── recurring/          # Gastos/ingresos recurrentes
    ├── services/api/           # Servicios REST (un archivo por recurso)
    │   └── index.ts            # Re-exportación centralizada
    ├── shared/
    │   ├── components/         # Card, Toast, Modal, EmptyState, ErrorBoundary…
    │   ├── hooks/              # usePaginatedQuery, useCategoryName…
    │   ├── theme/              # ThemeManager (dark/light/system)
    │   ├── navigation.ts       # Items del sidebar y bottom nav
    │   └── utils/              # format.ts (currency, date), activity.ts
    ├── pwa/
    │   ├── sw.ts               # Service worker (Workbox, background sync)
    │   ├── syncBridge.ts       # Bridge JS → SW para encolar operaciones offline
    │   ├── OfflineBanner.tsx   # Banner de estado de red
    │   └── PwaSyncToasts.tsx   # Notificaciones de sincronización offline
    ├── styles/
    │   └── index.css           # Design system completo (tokens CSS, componentes)
    └── types/
        └── api.ts              # Tipos TypeScript del contrato REST
```

---

## Arquitectura de autenticación

```
┌─────────────────────────────────────────────────────────┐
│                      Navegador                          │
│                                                         │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │ Access Token │      │ Refresh Token│                  │
│  │  (memoria)   │      │ (cookie      │                  │
│  │  tokenStore  │      │  HttpOnly)   │                  │
│  └──────┬──────┘      └──────┬───────┘                  │
│         │                    │                          │
│   Authorization: Bearer      │ Enviada automáticamente  │
│         │                    │ por el browser           │
└─────────┼────────────────────┼──────────────────────────┘
          │                    │
          ▼                    ▼
     /api/v1/*          /api/v1/auth/refresh
```

**Flujo de renovación automática (Axios interceptor):**

1. Petición retorna `401`.
2. Se cola la petición fallida en `failedQueue`.
3. Se llama a `POST /auth/refresh` — el refresh token viaja en la cookie.
4. El backend rota el refresh token (invalida el anterior).
5. Todas las peticiones en cola se reintentan con el nuevo access token.
6. Si el refresh falla (token expirado/revocado), se ejecuta logout.

---

## Design system

El sistema de diseño está implementado 100% en CSS con variables CSS (tokens):

- **Paleta brand**: rosa (`hsl(330, 100%, 56%)`) → violeta (`hsl(267, 75%, 65%)`)
- **Tema oscuro** por defecto; **tema claro** disponible via `[data-theme='light']`
- **Tipografía**: Inter (cuerpo) + Poppins (títulos)
- **Espaciado**: sistema 4pt (`--space-1` a `--space-20`)
- **Radios**: `8px` a `24px` + `full` (píldoras)
- **Sombras**: 6 niveles (`sm` a `brand`)
- **Accesibilidad**: contraste AA verificado, `prefers-reduced-motion`, skip-link, `focus-visible`

---

## PWA y modo offline

La app está configurada como PWA instalable en iOS y Android:

- **Service worker**: generado por `vite-plugin-pwa` + Workbox.
- **Precaching**: todos los assets del build.
- **Background sync**: las operaciones que fallan sin red se encolan y
  se reintentan automáticamente cuando se recupera la conexión.
- **Offline banner**: se muestra cuando `navigator.onLine === false`.
- **Install banner**: se sugiere la instalación en browsers compatibles.

---

## Testing

```bash
# Ejecuta los tests de navegación con Node test runner nativo
npm test
```

Los tests actuales están en `src/shared/__tests__/navigation.test.mjs`.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (TypeCheck + Vite) |
| `npm run preview` | Previsualización local del build |
| `npm run lint` | ESLint (0 errores, 0 warnings) |
| `npm test` | Suite de tests unitarios |

---

## Despliegue

La app se despliega en **Vercel** con la siguiente configuración de proxy
en `vercel.json` (si existe) para que las cookies de sesión funcionen
en el mismo origen sin problemas de CORS:

```json
{
  "rewrites": [
    { "source": "/api/v1/:path*", "destination": "https://together-backend.onrender.com/api/v1/:path*" }
  ]
}
```

---

## Licencia

Uso privado — BBLABS © 2025.
