# Vikingos Barber Shop

Sistema web integral para una barbería premium: sitio público, reservas con control de agenda, tienda, carrito, órdenes, roles y panel administrativo.

## Tecnologías

- Next.js 15, React 19 y TypeScript
- Tailwind CSS + sistema visual propio
- PostgreSQL y Prisma ORM
- Autenticación JWT en cookie HTTP-only
- Zod para validación de entradas
- Arquitectura de pagos preparada para Webpay, Mercado Pago o Stripe

## Inicio rápido

Requisitos: Node.js 20 o superior, Docker Desktop (opcional) y PostgreSQL 16.

```bash
copy .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Abre `http://localhost:3000`.

### Acceso administrador inicial

- Correo: `ignacio.ypezoa@gmail.com`

Crea o actualiza la contraseña desde una semilla segura antes de compartir el sistema.

## Funciones incluidas

- Landing responsive con servicios, barberos y sucursales.
- Reserva en cuatro pasos con validación de disponibilidad, jornada, duración y solapamiento.
- Catálogo filtrable, carrito persistente e impuestos/despacho.
- Modelos de clientes, órdenes, pagos y métodos de envío.
- Panel privado y permisos para Admin, Encargado y Barbero.
- CRUD completo de sucursales, barberos, servicios, productos y usuarios.
- Filtros y cambio de estado para reservas.
- Configuración dinámica de marca, Home, contacto, redes, color e IVA.
- Carga local de imágenes en `public/uploads`, preparada para reemplazarse por storage externo.
- Sincronización inmediata: crear, editar o desactivar en admin actualiza la web pública.
- Recordatorios configurables 24 h, 2 h y 30 min antes de cada reserva.
- Reagendamiento y cancelación online con límite horario configurable.
- Área privada “Mis reservas” mediante código temporal por correo.
- Lista de espera con aviso automático cuando se libera un horario.
- Bloqueos de agenda por colación, vacaciones o cierre manual.
- Historial y perfil inteligente del cliente.
- Programa de puntos y beneficios configurables.
- Valoraciones por barbero y solicitud automática posterior a la atención.
- Calendario día/semana/mes con movimiento de reservas mediante arrastrar.
- Dashboard con clientes, cancelaciones, no-show, ranking y productos vendidos.
- Archivos ICS para Google Calendar, Apple Calendar y Outlook.
- Aplicación PWA instalable con base para notificaciones push.
- Rate limiting básico en login, contraseñas bcrypt, JWT y middleware.
- SEO, Open Graph, sitemap, robots, 404 y botón de WhatsApp.
- Datos iniciales para demostración.

## Variables de entorno

Copia `.env.example` y configura como mínimo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/vikingos_barber?schema=public"
AUTH_SECRET="una-clave-aleatoria-de-al-menos-32-caracteres"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

En producción usa un secreto generado con un administrador de claves y una base PostgreSQL administrada.

## Base de datos

El esquema vive en `prisma/schema.prisma`. Para cambios:

```bash
npm run db:migrate -- --name nombre_del_cambio
npm run db:seed
```

La API evita reservas que se crucen y verifica que el servicio, sucursal, barbero y jornada sean compatibles.

## Panel administrador

Desde `/admin` puedes administrar:

- Reservas y sus estados.
- Sucursales y horarios.
- Barberos, servicios asignados y jornada.
- Servicios, duración, categoría y precio.
- Productos, SKU, stock y categorías.
- Identidad visual y contenido general del negocio.
- Usuarios y roles.
- Clientes, puntos y preferencias.
- Calendario, colaciones, vacaciones y bloqueos.
- Beneficios de fidelización.
- Recordatorios y reglas de autogestión.

Los registros activos son consultados directamente desde PostgreSQL por la web pública. Los inactivos permanecen visibles sólo en el panel.

## Imágenes

Las imágenes subidas desde el administrador se guardan en `public/uploads` con nombre único, validación de tipo y límite de 5 MB. Para despliegues serverless se recomienda reemplazar el contenido del endpoint `/api/admin/upload` por S3, Cloudinary o Supabase Storage.

## Prueba de sincronización

Con la aplicación ejecutándose en el puerto 3101:

```powershell
$env:TEST_URL="http://localhost:3101"
node scripts/smoke-admin.mjs
```

Esta prueba crea registros temporales, verifica que aparezcan y desaparezcan de la web pública según su estado y finalmente los elimina.

## Correo electrónico

El panel `Configuración → Correo electrónico` permite administrar host, puerto, usuario, contraseña, SSL/TLS, remitente y correo administrador.

- La contraseña SMTP se cifra con AES-256-GCM usando `AUTH_SECRET`.
- La API nunca devuelve la contraseña al navegador.
- El botón de prueba valida la conexión y envía un correo real.
- Las reservas notifican al administrador y al cliente con plantillas HTML responsive.
- Si SMTP falla, la reserva se conserva y el error se registra en los logs.

## Recordatorios programados

Configura `CRON_SECRET` y ejecuta periódicamente:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-dominio.cl/api/cron/reminders
```

En Vercel, Railway o un cron externo se recomienda llamarlo cada 10 minutos. El proceso evita duplicados registrando cada recordatorio enviado.

## Autogestión y fidelización

- `/mis-reservas`: acceso del cliente mediante código temporal.
- `/mi-reserva/CODIGO`: reagendar, cancelar y descargar evento ICS.
- `/evaluar/CODIGO`: evaluación de visitas completadas.
- `Admin → Calendario`: reservas y bloqueos visuales.
- `Admin → Clientes`: historial, gasto, puntos y preferencias.
- `Admin → Fidelización`: premios por visitas y puntos.
- `Admin → Configuración`: activa o desactiva cada automatización.

## WhatsApp y push

La configuración avanzada incluye los interruptores para WhatsApp y notificaciones. La arquitectura y las plantillas están preparadas; para envíos automáticos reales debes conectar un proveedor como Meta WhatsApp Cloud API y un servicio Web Push/VAPID.

## PWA

El sistema incluye manifest, service worker, caché de páginas principales y soporte base para notificaciones. Puede instalarse desde Chrome/Android o “Agregar a pantalla de inicio” en Safari/iPhone.

## Pasarelas

`Payment` ya guarda proveedor, referencia, monto, estado y metadata. Implementa un adaptador en el endpoint de órdenes para iniciar el pago y un webhook para confirmar estados. Las credenciales previstas están en `.env.example`.

## Despliegue

1. Crea PostgreSQL en Supabase, Railway, Neon o RDS.
2. Carga las variables de entorno en Vercel.
3. Ejecuta `prisma migrate deploy` en el proceso de despliegue.
4. Despliega el proyecto en Vercel.
5. Configura dominio, SMTP y credenciales de pago.

## Evolución SaaS

Para convertirlo en multiempresa, agrega un modelo `Tenant`, incluye `tenantId` en las entidades comerciales y resuélvelo desde dominio/subdominio. La separación actual entre catálogo, reservas, órdenes, configuración y roles deja ese cambio localizado.
