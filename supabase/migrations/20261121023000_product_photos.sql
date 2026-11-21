-- Fotos públicas de produtos, gravadas apenas pela rota administrativa com service_role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-produtos', 'fotos-produtos', true, 3145728,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
