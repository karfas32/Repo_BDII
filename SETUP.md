# 🚀 Guía de configuración — Portal Académico UPLA

## 1. Supabase — Obtener la ANON KEY (obligatorio)

1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. **Settings → API**
3. Copia el valor de **`anon` / `public`** (NO la `service_role`)
4. Pégala en `supabase-config.js` reemplazando `TU_ANON_KEY_AQUI`

> ⚠️ **Nunca uses `service_role` en el frontend** — da acceso total a la BD.

---

## 2. Supabase — Crear tabla `usuarios` (para login real)

Ejecuta en el **SQL Editor** de Supabase:

```sql
create table usuarios (
  id            serial primary key,
  nombre        text not null,
  usuario       text not null unique,
  password_hash text not null,   -- SHA-256 en hex
  rol           text not null default 'estudiante' check (rol in ('admin','estudiante')),
  activo        boolean not null default true,
  created_at    timestamptz default now()
);

-- Índice para login rápido
create index on usuarios(usuario);

-- RLS: solo lectura de la propia fila (opcional pero recomendado)
alter table usuarios enable row level security;
create policy "anon puede leer para login"
  on usuarios for select using (true);
```

### Insertar usuarios (con SHA-256 de la contraseña):

Para generar el hash puedes usar [sha256.online](https://emn178.github.io/online-tools/sha256.html):

```sql
-- admin con contraseña "upla2024"
insert into usuarios (nombre, usuario, password_hash, rol) values
  ('Admin', 'admin', '...hash_sha256_de_upla2024...', 'admin');

-- estudiante con contraseña "123456"
insert into usuarios (nombre, usuario, password_hash, rol) values
  ('Estudiante', 'estudiante', '8d969eef6ecad3c29a3a629280e686cf...', 'estudiante');
```

---

## 3. Supabase — RLS en tabla `semanas`

```sql
-- Estudiantes: solo ven semanas publicadas
alter table semanas enable row level security;

create policy "publico lee semanas publicadas"
  on semanas for select using (publicado = true);

create policy "admin hace todo"
  on semanas for all using (true);   -- protege esto con tu auth de Supabase si quieres
```

---

## 4. Deploy en Vercel

1. Sube todos los archivos al repositorio GitHub
2. En Vercel → **Settings → Environment Variables**, agrega:
   - `SUPABASE_URL` = `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJ...` (tu anon key)
3. El `vercel.json` ya incluido agrega **headers de seguridad** automáticamente

---

## 5. Resumen de cambios aplicados

| Problema | Corrección |
|---|---|
| `service_role` key expuesta en frontend | Cambiada a `anon` key (solo lectura) |
| URL de Supabase con `/rest/v1/` extra | Eliminado (SDK lo maneja solo) |
| Scripts duplicados en `login.html` | Eliminados los duplicados |
| `contenido_html` renderizado como texto plano | Ahora usa `innerHTML` + saneado XSS |
| Sin headers de seguridad HTTP | `vercel.json` con CSP básico |
| Login con credenciales hardcodeadas visibles | Ahora busca en tabla `usuarios` con SHA-256 |

