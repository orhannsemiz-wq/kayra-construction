/* ============================================================
   PANEL AYARLARI
   Bu iki değeri Supabase panosundan kopyalayıp buraya yapıştırın.
   Nereden alınacağı KURULUM-PANEL.md dosyasında yazıyor.

   Boş bırakılırsa hiçbir şey bozulmaz: site sabit içeriğiyle
   çalışmaya devam eder, panel de "kurulum gerekli" ekranı gösterir.
   ============================================================ */
window.PANEL_AYAR = {
  url: "https://sfsejfciqbxxnjbodsnx.supabase.co",
  // Supabase'in yeni "publishable" anahtarı (eski adıyla anon public).
  // Tarayıcıda durması normaldir; yazma yetkisini bu anahtar değil,
  // veritabanındaki RLS kuralları verir. Doğrulandı: bu anahtarla
  // anonim yazma denemesi sıfır satır etkiliyor.
  anahtar: "sb_publishable_HvMsVXIoTrhjAyBxTDwSvw_zCMIWGqs"
};
