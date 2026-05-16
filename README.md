# MAQUETI

MAQUETI es una app marketplace con frontend en React/Vite y backend en Node/Express.

## Trabajar con Codex

Este repositorio se trabaja directamente desde la rama `main`.

Flujo recomendado:

1. Pedir a Codex el cambio en lenguaje normal.
2. Dejar que Codex revise los archivos necesarios antes de editar.
3. Probar la app localmente.
4. Revisar los cambios con Git.
5. Subir a GitHub cuando el cambio esté listo.

Ejemplos de peticiones utiles:

```text
revisa la app y dime que errores ves
```

```text
añade esta funcion en la app
```

```text
arregla el fallo que sale al iniciar sesion
```

```text
prepara el commit con los cambios
```

## Requisitos

- Node.js
- npm
- MongoDB local o una URL de MongoDB externa

El backend intenta conectar por defecto a:

```text
mongodb://127.0.0.1:27017/maqueti
```

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

Esto instala dependencias del backend y tambien construye el frontend por el `postinstall`.

## Desarrollo

Para arrancar frontend y backend a la vez:

```bash
npm run dev
```

Puertos usados por defecto:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3005`

Si solo quieres arrancar el frontend:

```bash
npm --prefix frontend run dev
```

Si solo quieres arrancar el backend:

```bash
PORT=3005 npm run backend
```

## Variables de entorno

Copia los archivos de ejemplo y rellena los valores reales:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Variables principales del backend:

- `PORT`: puerto del backend.
- `MONGODB_URI`: conexion de MongoDB.
- `JWT_SECRET`: clave privada para tokens.
- `GOOGLE_CLIENT_ID`: cliente de Google OAuth.
- `WEBAUTHN_RP_ID`: dominio para passkeys.
- `WEBAUTHN_ORIGIN`: origen permitido para passkeys.

Variables principales del frontend:

- `VITE_API_URL`: URL del backend.
- `VITE_GOOGLE_CLIENT_ID`: cliente de Google OAuth.
- `VITE_CLOUDINARY_CLOUD_NAME`: nombre de Cloudinary.
- `VITE_CLOUDINARY_UPLOAD_PRESET`: preset de subida de Cloudinary.

## Comandos utiles

Construir frontend:

```bash
npm run build
```

Arrancar backend en modo produccion:

```bash
npm start
```

Ver estado de Git:

```bash
git status
```

## Notas

- No crear una carpeta `MAQUETI` dentro de otra carpeta `MAQUETI`.
- Trabajar siempre desde la raiz real del proyecto.
- No subir archivos `.env` con claves reales.
