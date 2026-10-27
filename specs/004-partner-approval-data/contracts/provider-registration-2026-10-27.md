# Registro de proveedores — 2026-10-27

El frontend separa marcas atendidas de especialidades y permite adjuntar un logo
opcional PNG/JPEG/WebP de hasta 512 KiB. El backend debe desplegarse primero: su
DTO actual rechaza propiedades no declaradas.

## Cambios aplicados al backend

Se implementaron en el repositorio hermano `autolibre-backend-hex`.
El servicio de intake normaliza la imagen a WebP mediante Sharp y la
guarda en Spaces. Ante un error al registrar la solicitud, elimina ese archivo.
El logo se hace público como imagen comercial; no se guarda el base64 en la base.

No se crean columnas: los datos adicionales de la solicitud se conservan en
`partner_applications.raw_submission`, igual que horarios y modalidad:

- `worksAllBrands`: cobertura de marcas.
- `declaredBrands`: marcas atendidas; vacío si atiende todas.
- `specializedBrands`: especialidades opcionales, independientes de la cobertura.
  Se agregan desde un desplegable o como texto libre (hasta 100 caracteres por marca).
  Si atiende solo algunas marcas, una especialidad nueva se incluye también en su cobertura.
- `logoUrl` y `logoKey`: imagen adjunta para el onboarding posterior.
- `description`: descripción opcional del negocio, hasta 90 caracteres.
- `socialLinks`: links opcionales de Instagram, Facebook, TikTok, LinkedIn y YouTube;
  se guardan como URLs HTTP/HTTPS completas, sin credenciales incrustadas.

El registro sigue siendo una solicitud pendiente de revisión. No publica un
perfil automáticamente. El equipo comercial puede consultar estos campos en
`raw_submission` al revisar el alta y usar el logo en el onboarding.
El detalle de la solicitud del admin muestra el logo adjunto. El directorio y el
perfil público priorizan `partners.logo_url`; si no hay uno, usan el logo de la
solicitud vinculada únicamente cuando el proveedor ya está publicado y activo.

Ejemplo de consulta para revisión (no se ejecuta automáticamente):

```sql
SELECT id, business_name,
       raw_submission->'worksAllBrands' AS works_all_brands,
       raw_submission->'specializedBrands' AS specialized_brands,
       raw_submission->>'logoUrl' AS logo_url
FROM partner_applications
ORDER BY created_at DESC;
```

## Validación

`npm run test:proveedores` comprueba la selección de marcas y límites de archivo.
La suite `partner-application-intake.spec.ts` del backend cubre la conservación
de especialidades, solicitudes anteriores, archivos inválidos, persistencia de
la URL y limpieza del logo tras un error. El DTO se comprueba con whitelist
estricta. Se verificaron 80 tests del área de solicitudes del backend, además de
33 tests del directorio y registro de la landing. La prueba de navegador usó un
backend simulado: ambas variantes llegaron al proxy a 390, 1024 y 1440 px.
No se enviaron solicitudes de prueba a producción.
