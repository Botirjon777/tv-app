# safir assets

Branding images for the **Safir Hotel** in-room page
(`/safir/<number>`).

Drop two files here:

| File         | Shown as                          | Suggested size        |
| ------------ | --------------------------------- | --------------------- |
| `banner.*`   | Hero banner across the top        | ~1200×600 (wide)      |
| `logo.*`     | Logo next to the hotel name       | square, transparent   |

Accepted extensions:

- **banner**: `jpg`, `jpeg`, `png`, `webp`, `avif`
- **logo**: `png`, `svg`, `jpg`, `jpeg`, `webp`

They are served at `/safir/banner.<ext>` and `/safir/logo.<ext>`
and picked up automatically — no code or DB change needed. The folder `logo`
overrides the hotel's `logoUrl` field when present.

To add another hotel, create `public/<that-hotel-slug>/` with the same two files.
