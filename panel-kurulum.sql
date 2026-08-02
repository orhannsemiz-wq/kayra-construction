-- ============================================================
-- KAYRA PANEL — VERİTABANI KURULUMU
-- Supabase panosunda: sol menü > SQL Editor > yeni sorgu >
-- bu dosyanın tamamını yapıştır > Run.
-- Tek seferlik. İkinci kez çalıştırmak zarar vermez.
-- ============================================================

-- 1) İçerik tablosu. Tüm site içeriği tek bir JSON satırında durur.
create table if not exists site_icerik (
  id          int primary key,
  veri        jsonb not null default '{}'::jsonb,
  gecmis      jsonb not null default '[]'::jsonb,  -- son 5 yayın (geri alma)
  guncelleme  timestamptz default now()
);

-- Tablo daha önce kurulduysa geçmiş sütununu ekle.
alter table site_icerik add column if not exists gecmis jsonb not null default '[]'::jsonb;

insert into site_icerik (id, veri) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

-- 2) Satır düzeyi güvenlik: siteyi herkes okur, yalnız giriş yapan yazar.
--    Paneldeki "anon" anahtar açıkta durabilir; yazma yetkisini o anahtar
--    değil, aşağıdaki kurallar verir.
alter table site_icerik enable row level security;

drop policy if exists "icerik_herkes_okur" on site_icerik;
create policy "icerik_herkes_okur"
  on site_icerik for select
  using (true);

drop policy if exists "icerik_girenler_yazar" on site_icerik;
create policy "icerik_girenler_yazar"
  on site_icerik for update
  to authenticated
  using (true) with check (true);

-- 3) Fotoğraf deposu.
insert into storage.buckets (id, name, public)
  values ('medya', 'medya', true)
  on conflict (id) do nothing;

drop policy if exists "medya_herkes_okur" on storage.objects;
create policy "medya_herkes_okur"
  on storage.objects for select
  using (bucket_id = 'medya');

drop policy if exists "medya_girenler_yukler" on storage.objects;
create policy "medya_girenler_yukler"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'medya');

drop policy if exists "medya_girenler_gunceller" on storage.objects;
create policy "medya_girenler_gunceller"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'medya');
