# SurvivalRPG Web

Portal web para SurvivalRPG Dota.

## Estado

- Next.js preparado para Vercel.
- Supabase configurado por variables de entorno.
- Dominio objetivo: `survivalrpgdota.com`.
- Steam OpenID/API preparado por variables.
- Migracion SQL inicial en `supabase/migrations/20260426153500_initial_schema.sql`.

## Variables principales

La publishable key de Supabase va en:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

La URL del proyecto va en:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rcymmzxwgyxbyvxxnwbl.supabase.co
SUPABASE_PROJECT_REF=rcymmzxwgyxbyvxxnwbl
```

Para crear tablas, indices, triggers, funciones y politicas se necesita ejecutar la migracion con permisos de base de datos.

## Rutas

- `/` inicio publico.
- `/rankings` rankings publicos.
- `/catalog` catalogo publico.
- `/profile` perfil del jugador.
- `/admin` panel administrador.
- `/api/health` healthcheck.
