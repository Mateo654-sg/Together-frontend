# Together - Frontend Web

Aplicación web progresiva (PWA) de finanzas compartidas para parejas. Migración de la app React Native a React + Vite.

## Stack

| Capa          | Tecnología                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | React 19                                                      |
| Build         | Vite 6                                                        |
| Lenguaje      | TypeScript 5.9                                                |
| Ruteo         | React Router v7                                               |
| Estado global | Zustand 5                                                     |
| Server state  | TanStack Query 5                                              |
| Formularios   | React Hook Form 7 + Zod 4                                     |
| HTTP          | Axios 1 (con interceptor JWT + refresh automático)            |
| UI            | Lucide React + Framer Motion + Recharts 2                     |
| PWA           | vite-plugin-pwa + Workbox (service worker con precaching)     |
| Fechas        | date-fns 4 (locale `es`)                                      |
| Internacionalización | i18next + react-i18next                                |

## Requisitos

- Node.js 18+ / 20+
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Build

```bash
npm run build
```

Genera los archivos en `dist/` con service worker PWA incluido.

## Preview

```bash
npm run preview
```

Sirve el build de producción localmente.

## Estructura del proyecto

```
src/
├── app/                  # Entry point, App, Router, Providers
├── config/               # Axios client con interceptors
├── features/
│   ├── auth/             # Login, Register, ForgotPassword + store
│   ├── dashboard/        # Página principal con stats y charts
│   ├── expenses/         # CRUD de gastos
│   ├── goals/            # CRUD de metas de ahorro
│   ├── activity/         # Feed de actividad reciente
│   ├── ai/               # Chat con asistente IA
│   ├── notifications/    # Centro de notificaciones
│   ├── profile/          # Perfil de usuario + settings
│   └── reports/          # Reportes financieros
├── services/api/         # Servicios API (un archivo por recurso)
├── shared/
│   ├── components/       # Componentes reutilizables (Card, Toast, etc.)
│   └── utils/            # formatCurrency, formatDate, etc.
├── styles/               # CSS con design system completo
└── types/                # Tipos TypeScript compartidos
```

## Diseño

- **Tema oscuro** con acento rosado (`#FF4D8D`)
- **Glassmorphism** en tarjetas y superficies
- **Sistema 4pt** de espaciado
- **Tipografía**: Inter (cuerpo) + Poppins (display)
- **Responsive**: Sidebar en desktop, bottom navigation en mobile

## API

Backend desplegado en Render:
`https://together-backend-bbk9.onrender.com/api/v1`

Documentación en `docs/API.md`.

## Licencia

Uso privado.
