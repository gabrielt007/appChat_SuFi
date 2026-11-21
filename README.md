# Aplicación móvil de chat grupal desarrollada con **Ionic + Angular + Capacitor** que integra **Firebase** (autenticación y notificaciones push) y **Supabase** (base de datos, almacenamiento y tiempo real).

> Proyecto académico de pruebas. No está pensado para publicarse en tiendas de aplicaciones: se ejecuta en un único dispositivo Android para verificar su funcionamiento.
>
> ---

## Descripción

El objetivo es construir una aplicación de chat funcional que combine dos plataformas, asignando a cada una responsabilidades específicas, y que incorpore al menos **12 funcionalidades principales**: autenticación, mensajería en tiempo real, envío de multimedia, ubicación, notificaciones push y más.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework móvil | Ionic 9 + Angular (componentes standalone) |
| Puente nativo | Capacitor 8 (Camera, Geolocation, Filesystem, Keyboard, etc.) |
| Autenticación | Firebase Authentication |
| Notificaciones push | Firebase Cloud Messaging (FCM) |
| Base de datos | Supabase (PostgreSQL) con Row Level Security |
| Tiempo real | Supabase Realtime (Postgres Changes y Presence) |
| Archivos | Supabase Storage |
| Pruebas | Vitest (unitarias) y Playwright (e2e) |
| Herramientas | Visual Studio Code y Android Studio |

## Arquitectura

| Servicio | Plataforma | Responsabilidad |
|---|---|---|
| Authentication | Firebase | Registro e inicio de sesión |
| Cloud Messaging | Firebase | Notificaciones push |
| PostgreSQL | Supabase | Usuarios, salas, mensajes y metadatos |
| Realtime | Supabase | Sincronización de mensajes y estado "escribiendo" |
| Storage | Supabase | Imágenes, documentos y avatares |

**Flujo de identidad:** el usuario inicia sesión con Firebase Auth. El ID token de Firebase se envía a Supabase como proveedor de autenticación de terceros, de modo que las políticas RLS identifican al usuario con `auth.jwt()->>'sub'` (el UID de Firebase es texto, no UUID).

## Funcionalidades y estado

| # | Funcionalidad | Estado |
|---|---|---|
| 1 | Inicio de sesión / registro (correo y contraseña) | Implementado |
| 1b | Inicio de sesión con Google | Pendiente |
| 2 | Gestión de perfiles (nombre, bio, avatar) | Pendiente |
| 3 | Creación de salas públicas o grupales | Pendiente |
| 4 | Mensajería de texto en tiempo real | Implementado |
| 5 | Indicador "Escribiendo..." (Presence) | Implementado |
| 6 | Envío de imágenes (cámara o galería) | Implementado |
| 7 | Envío de archivos (PDF, TXT, DOC, DOCX) | Implementado |
| 8 | Compartir ubicación | Implementado |
| 9 | Notificaciones push (FCM) | Pendiente |
| 10 | Buscador de mensajes y salas | Pendiente |
| 11 | Mensajes leídos / estado de entrega | Pendiente |
| 12 | Cierre de sesión seguro | Parcial |

## Estructura del proyecto

```
appChat_SuFi/
├── e2e/                          # Pruebas end-to-end (Playwright)
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── login/            # Pantalla de inicio de sesión
│   │   │   └── registro/         # Pantalla de registro
│   │   ├── services/
│   │   │   ├── firebase.ts            # Inicialización de Firebase
│   │   │   ├── firebase-messaging.ts  # Notificaciones push (en desarrollo)
│   │   │   ├── auth.service.ts        # Registro, login y logout
│   │   │   └── supabase.service.ts    # Cliente de Supabase
│   │   ├── tabs/                 # Navegación por pestañas
│   │   ├── tab1/                 # Chat grupal
│   │   ├── tab2/                 # Buscador (en desarrollo)
│   │   ├── tab3/                 # Perfil y cierre de sesión
│   │   └── app.routes.ts         # Rutas principales
│   ├── environments/             # Configuración de Firebase y Supabase
│   └── theme/                    # Variables de estilo
├── capacitor.config.ts
├── angular.json
└── package.json
```

## Requisitos previos

- [Node.js](https://nodejs.org/) (versión LTS reciente) y npm
- Ionic CLI: `npm install -g @ionic/cli`
- [Android Studio](https://developer.android.com/studio) con un SDK de Android instalado
- Un dispositivo Android (o emulador con Google Play Services) para probar las notificaciones push
- Un proyecto de [Firebase](https://console.firebase.google.com/) y uno de [Supabase](https://supabase.com/)

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/gabrielt007/appChat_SuFi.git
cd appChat_SuFi

# 2. Instalar dependencias
npm install

# 3. Configurar las credenciales (ver secciones siguientes)
#    Editar src/environments/environment.ts

# 4. Ejecutar en el navegador
ionic serve
```


## Configuración de Firebase

1. Crear un proyecto en la consola de Firebase.
2. Activar **Authentication** y habilitar los métodos *Correo/contraseña* y *Google*.
3. Registrar una app **web** (para `environment.ts`) y una app **Android** con el mismo `appId` de `capacitor.config.ts`.
4. Para Google Sign-In en Android, registrar la huella **SHA-1** de Android Studio.
5. Descargar `google-services.json` y colocarlo en `android/app/`.
6. Asignar el claim `role: "authenticated"` a los tokens (Admin SDK o función de bloqueo), necesario para que Supabase acepte las peticiones.

## Configuración de Supabase

1. Crear el proyecto y activar **Firebase** como proveedor en *Authentication → Third-party*.
2. Crear las tablas principales:

   | Tabla | Campos principales |
   |---|---|
   | `profiles` | `id` (text), `email`, `display_name`, `bio`, `avatar_url` |
   | `rooms` | `id`, `name`, `is_public`, `created_by`, `created_at` |
   | `room_members` | `room_id`, `user_id` |
   | `messages` | `id`, `room_id`, `sender_id`, `message_type` (`text`, `image`, `file`, `location`), `content`, `media_url`, `lat`, `lng`, `created_at` |
   | `message_receipts` | `message_id`, `user_id`, `delivered_at`, `read_at` |
   | `device_tokens` | `user_id`, `token` |

3. Las columnas de usuario deben ser de tipo `text`.
4. Activar **RLS** en todas las tablas y escribir las políticas usando `auth.jwt()->>'sub'`.
5. Crear el bucket `chat-files` en Storage con sus políticas.
6. Activar Realtime sobre la tabla `messages`.


Editar `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_PROYECTO.firebaseapp.com',
    projectId: 'TU_PROYECTO',
    storageBucket: 'TU_PROYECTO.firebasestorage.app',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID',
  },
  supabase: {
    url: 'https://TU_PROYECTO.supabase.co',
    anonKey: 'TU_ANON_KEY',
  },
};
```

## Ejecución en Android

```bash
ionic build
npx cap add android      # solo la primera vez
npx cap sync android
npx cap open android     # abre Android Studio y ejecuta desde allí
```

Permisos necesarios en `AndroidManifest.xml`: cámara, ubicación (`ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`), internet y notificaciones.




