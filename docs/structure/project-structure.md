# Estructura del proyecto MAQUETI

## Raíz real del proyecto
Trabajar siempre dentro de la raíz real activa del proyecto.

## Estructura principal

- app/
- assets/
- backend/
- docs/
- frontend/
- storage/

## Backend
- backend/api/routes/
- backend/api/middlewares/
- backend/controllers/
- backend/models/
- backend/services/
- backend/config/
- backend/utils/

## Frontend
- frontend/components/common/
- frontend/components/layout/
- frontend/components/ui/
- frontend/pages/
- frontend/screens/
- frontend/styles/
- frontend/services/
- frontend/hooks/
- frontend/context/
- frontend/utils/

## Storage
- storage/users/avatars/
- storage/users/data/
- storage/products/images/
- storage/products/data/
- storage/chats/images/
- storage/chats/attachments/
- storage/app/logos/
- storage/app/icons/
- storage/app/assets/
- storage/temp/uploads/
- storage/backups/daily/

## Regla importante
No crear rutas fuera de la raíz real del proyecto.
No duplicar carpetas MAQUETI dentro de MAQUETI.
Trabajar siempre con rutas relativas a la raíz real.
