# 🔄 Refactorización: React Native + Expo → React + Vite (PWA)

## Contexto

El proyecto **Together** actualmente tiene un frontend construido con **React Native + Expo** orientado a mobile-first pero con muchos conflictos al intentar compilar para web. La idea es migrar completamente a **React + Vite** como una **Progressive Web App (PWA)**, eliminando toda la deuda técnica de Expo/React Native y permitiendo que la app funcione perfectamente en navegadores y se instale en móviles como PWA.

El backend (FastAPI + Python) **no necesita ningún cambio**, ya que es una API REST independiente.

---

## Decisión de Framework

> [!IMPORTANT]
> **Recomendación: React + Vite**
>
> **¿Por qué Vite y no Next.js?**
> - La app es un **SPA con autenticación JWT** — no necesita SSR (Server Side Rendering) de Next.js.
> - Vite es significativamente **más rápido en desarrollo** que Next.js.
> - La configuración de **PWA con Vite** es trivial (plugin `vite-plugin-pwa`).
> - Next.js añade complejidad innecesaria (file-based routing, server components) para una app que ya tiene su propio backend.
> - La arquitectura de features por módulo que ya tienes se adapta perfectamente a un SPA.
>
> Si prefieres Next.js (por App Router, SEO, o futuro SSR), puedo ajustar el plan.

---

## Qué se Conserva (Reutilizable)

La mayor parte de la **lógica de negocio** puede reutilizarse directamente:

| Módulo | Estado | Cambios necesarios |
|---|---|---|
| `zustand` stores | ✅ Reutilizable | Cambiar `AsyncStorage` → `localStorage` |
| `axios` / API calls | ✅ Reutilizable | Mínimos cambios |
| `@tanstack/react-query` | ✅ Reutilizable | Sin cambios |
| `react-hook-form` + `zod` | ✅ Reutilizable | Sin cambios |
| `i18next` / traducciones | ✅ Reutilizable | Sin cambios |
| `date-fns` | ✅ Reutilizable | Sin cambios |
| Tipos TypeScript | ✅ Reutilizable | Sin cambios |
| Estructura de features | ✅ Conservar | Sin cambios de arquitectura |

---

## Qué se Reemplaza

| Antes (React Native) | Después (React Web) |
|---|---|
| `expo` y todos sus paquetes | `vite` + `vite-plugin-pwa` |
| `react-native` componentes (`View`, `Text`, `Pressable`) | HTML semántico + CSS |
| `react-navigation` (native stack, bottom tabs) | `react-router-dom` v6 |
| `react-native-reanimated` | `framer-motion` |
| `expo-secure-store` | `localStorage` / `sessionStorage` |
| `expo-image-picker` | `<input type="file">` nativo |
| `lucide-react-native` | `lucide-react` |
| `nativewind` / StyleSheet | CSS Modules o CSS-in-JS |
| `AsyncStorage` | `localStorage` |

---

## Estrategia de Migración

### Enfoque: Nueva Carpeta, Migración Progresiva

En lugar de modificar la carpeta `together-frontend` existente (que está rota con conflictos), crearemos una **nueva carpeta `together-frontend-web`** con el proyecto Vite limpio.

Esto permite:
1. No romper nada del proyecto actual mientras se migra.
2. Referenciar el código existente para copiar la lógica.
3. Si algo falla, el código original sigue intacto.

---

## Propuesta de Cambios

### Backend

> [!NOTE]
> El backend **no requiere cambios**. Solo se actualizará el `.env` del backend para incluir el nuevo origen de la PWA en los CORS.

#### [MODIFY] [.env](file:///home/dogor/Downloads/Together_APP_de_Gastos_Compartidos/together-backend/.env)
- Agregar `http://localhost:5173` (puerto default de Vite) a los CORS_ORIGINS.

---

### Frontend — Nueva estructura `together-frontend-web/`

#### [NEW] Proyecto Vite + React + TypeScript

```
together-frontend-web/
├── public/
│   ├── manifest.webmanifest        # PWA manifest
│   ├── icons/                      # Iconos de la PWA (varios tamaños)
│   └── screenshots/                # Screenshots opcionales para installable PWA
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Componente raíz
│   │   ├── router.tsx              # React Router v6 (reemplaza react-navigation)
│   │   └── providers.tsx           # QueryClient, i18next, etc.
│   ├── features/                   # Misma estructura que antes (migrada)
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── store/              # Zustand store (ajustado para web)
│   │   │   └── types/
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── goals/
│   │   ├── ai/
│   │   ├── activity/
│   │   ├── profile/
│   │   ├── budgets/
│   │   ├── incomes/
│   │   ├── categories/
│   │   ├── couple/
│   │   ├── notifications/
│   │   ├── reminders/
│   │   ├── reports/
│   │   └── shared-finance/
│   ├── shared/
│   │   ├── components/             # Componentes reutilizables web
│   │   ├── hooks/
│   │   └── utils/
│   ├── styles/
│   │   ├── index.css               # Design tokens, variables CSS
│   │   ├── animations.css          # Keyframes globales
│   │   └── typography.css
│   ├── config/
│   │   └── api.ts                  # Axios instance
│   ├── types/
│   ├── assets/
│   └── main.tsx
├── index.html
├── vite.config.ts                  # Config con vite-plugin-pwa
├── tsconfig.json
├── package.json
└── .env
```

---

### Stack Final

| Categoría | Librería |
|---|---|
| Framework | React 19 + Vite 6 |
| Lenguaje | TypeScript |
| PWA | `vite-plugin-pwa` + Workbox |
| Routing | `react-router-dom` v6 |
| Estado | Zustand v5 |
| Data Fetching | TanStack Query v5 |
| Formularios | React Hook Form + Zod |
| Animaciones | Framer Motion |
| HTTP | Axios |
| i18n | i18next + react-i18next |
| Iconos | Lucide React |
| Fechas | date-fns |
| Estilos | CSS Variables + CSS Modules |
| UI Extras | Recharts (gráficas) |

---

## Plan de Ejecución por Fases

### Fase 1 — Scaffolding y Configuración
- Crear proyecto Vite + React + TS
- Configurar PWA (manifest, service worker, iconos)
- Configurar Axios, React Query, React Router
- Configurar i18next, Zustand
- Crear design system con CSS variables (colores, tipografía, tokens)

### Fase 2 — Auth
- Migrar LoginScreen, RegisterScreen, ForgotPasswordScreen
- Adaptar auth store (AsyncStorage → localStorage)
- Implementar rutas protegidas

### Fase 3 — Layout y Navegación
- Bottom Navigation Bar (CSS puro, responsive)
- Layout principal con sidebar para desktop
- Responsive: móvil = bottom nav, desktop = sidebar

### Fase 4 — Dashboard
- Migrar todos los componentes del dashboard
- Integrar con la API existente

### Fase 5 — Features (Gastos, Metas, IA, Actividad, Perfil)
- Migrar cada feature progresivamente
- Mantener la misma arquitectura por módulos

### Fase 6 — PWA y Pulido Final
- Configurar service worker con estrategia cache-first
- Offline fallback
- Push notifications (opcional)
- Íconos y splash screen
- Probar instalación en Android/iOS

---

## Plan de Verificación

### Funcional
- La app compila sin errores con `npm run dev`
- Login / Register funcionan contra el backend
- Las rutas protegidas redirigen correctamente
- La PWA se puede instalar en Android/iOS desde Chrome/Safari

### PWA
- Lighthouse PWA score > 90
- Service Worker activo
- Manifest válido
- App funciona offline (al menos muestra contenido cacheado)

### Compatibilidad Backend
- CORS configurado correctamente
- JWT flow funciona igual que antes
