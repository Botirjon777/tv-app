# Functionality: Media uploads & serving

Source: `src/routes/admin.ts` (upload), `src/plugins/media.ts` (storage +
serving).

Lets staff upload images/video/PDF (backgrounds, logos, promo media) and serves
them back over HTTP.

## Upload
`POST /api/v1/admin/media/upload` (admin JWT), `multipart/form-data`, one file.

- **MIME allowlist**: `image/jpeg|png|gif|webp|avif`, `video/mp4|webm`,
  `application/pdf`. Anything else → `415` (stream drained). This prevents
  planting active content (HTML/SVG) that would be served from the media origin.
- **Size cap**: `MAX_UPLOAD_MB` (default 50 MB) → `413` on overflow.
- **Storage**: content-addressed key `<16-byte-random-hex>-<sanitized-filename>`
  written into `MEDIA_DIR`. The random prefix prevents collisions and path
  traversal.
- **Response**: `{ "publicUrl": "<PUBLIC_BASE_URL>/media/<key>" }`. If
  `PUBLIC_BASE_URL` is empty, a relative `/media/<key>` URL is returned.

## Serving
`GET /media/<key>` via `@fastify/static`, rooted at `MEDIA_DIR`, served read-only
with immutable + 1-year cache headers (safe because keys are content-addressed).
`@fastify/static` confines serving to `MEDIA_DIR` — no `..` traversal.

## Storage in production
Mount a Docker volume at `MEDIA_DIR` (the prod compose uses `/data/uploads` on the
`media_data` volume) so uploads survive redeploys. Back it up alongside the DB —
see [../DEPLOYMENT.md](../DEPLOYMENT.md).
