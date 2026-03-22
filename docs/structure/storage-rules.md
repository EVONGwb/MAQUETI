# Reglas de almacenamiento MAQUETI

## Objetivo
Definir cómo se nombran, organizan y guardan los archivos dentro de storage para mantener orden, escalabilidad y consistencia.

## Estructura principal
El almacenamiento se organiza así:

- users/avatars/
- users/data/
- products/images/
- products/data/
- chats/images/
- chats/attachments/
- app/logos/
- app/icons/
- app/assets/
- temp/uploads/
- backups/daily/

## Reglas generales
- Todo debe ir en minúsculas
- No usar espacios en nombres de archivos
- Usar guiones bajos "_" para separar partes del nombre
- No mezclar imágenes con datos
- No guardar archivos en carpetas incorrectas
- Cada tipo de archivo debe ir en su ruta correspondiente
- Mantener nombres simples, claros y consistentes

## Convención de nombres por tipo

### Usuarios
Ruta:
users/avatars/

Formato:
user_{id}.jpg

Ejemplo:
user_123.jpg

### Datos de usuario
Ruta:
users/data/

Formato:
user_{id}.json

Ejemplo:
user_123.json

### Imágenes de productos
Ruta:
products/images/

Formato:
product_{id}_{numero}.jpg

Ejemplos:
product_456_1.jpg
product_456_2.jpg

### Datos de productos
Ruta:
products/data/

Formato:
product_{id}.json

Ejemplo:
product_456.json

### Imágenes de chat
Ruta:
chats/images/

Formato:
chat_{id}_img_{numero}.jpg

Ejemplo:
chat_789_img_1.jpg

### Adjuntos de chat
Ruta:
chats/attachments/

Formato:
chat_{id}_file_{numero}.pdf

Ejemplo:
chat_789_file_1.pdf

### Recursos de la app
Rutas:
- app/logos/
- app/icons/
- app/assets/

Formatos:
- logo_principal.png
- icon_home.svg
- splash_bg.jpg

## Reglas de IDs
- Cada usuario debe tener un ID único
- Cada producto debe tener un ID único
- Cada chat debe tener un ID único
- Los IDs deben usarse siempre en nombres de archivos relacionados
- No reutilizar IDs de otras entidades
- El nombre del archivo debe permitir identificar rápidamente a quién pertenece

## Archivos temporales
Ruta:
temp/uploads/

Reglas:
- Usar esta carpeta solo para subidas temporales
- No guardar aquí archivos definitivos
- Limpiar periódicamente su contenido

## Copias de seguridad
Ruta:
backups/daily/

Reglas:
- Guardar solo copias organizadas por fecha si se usan después
- No mezclar backups con archivos activos

## Resumen final
El sistema de almacenamiento de MAQUETI debe ser:
- ordenado
- escalable
- consistente
- fácil de mantener

Importante:
- No añadas contenido extra
- No cambies nombres
- Mantén el documento limpio y bien estructurado en markdown
- Guarda el archivo exactamente en docs/structure/storage-rules.md
