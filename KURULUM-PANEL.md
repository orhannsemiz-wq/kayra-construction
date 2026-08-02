# Kayra Paneli — Kurulum

Bir defalık iş, yaklaşık 5–10 dakika. Bitince Hasan Bey siteyi kendi
güncelleyebilir; sen aradan çıkarsın.

**Kurulum bitene kadar site sorunsuz çalışmaya devam eder.** Panel bağlanmamışken
`js/icerik.js` hiçbir şey yapmaz, site sabit içeriğiyle görünür.

---

## 1. Supabase hesabı aç

1. <https://supabase.com> → **Start your project** → GitHub ile giriş yap.
2. **New project**
   - **Name:** `kayra`
   - **Database Password:** güçlü bir şifre üret ve bir yere kaydet
     (bu şifre panele girmez, sadece veritabanı yönetimi için)
   - **Region:** `Central EU (Frankfurt)` — Kıbrıs'a en yakın olanı
3. Proje kurulumu 1–2 dakika sürer.

Ücretsiz plan bu site için fazlasıyla yeterli.

---

## 2. Veritabanını hazırla

1. Sol menü → **SQL Editor** → **New query**
2. `panel-kurulum.sql` dosyasının **tamamını** yapıştır
3. **Run**

Alt tarafta "Success" yazmalı.

---

## 3. İki değeri kopyala

1. Sol menü → **Project Settings** (dişli) → **API**
2. Şu ikisini kopyala:
   - **Project URL** — `https://xxxxx.supabase.co` gibi
   - **anon public** anahtarı — uzun bir metin

> ⚠️ **`service_role` anahtarını ASLA kullanma.** O anahtar her şeyi yapabilir
> ve siteye konursa herkes görür. Panelin ihtiyacı olan `anon public`.
> Onun açıkta olması normaldir; yetkiyi 2. adımdaki kurallar belirliyor.

3. `js/panel-ayar.js` dosyasını aç, iki değeri yapıştır:

```js
window.PANEL_AYAR = {
  url: "https://xxxxx.supabase.co",
  anahtar: "eyJhbGciOi....."
};
```

4. Kaydet, siteyi yayınla (`git add -A && git commit && git push`).

---

## 4. Hasan Bey'in hesabını aç

1. Sol menü → **Authentication** → **Users** → **Add user** → **Create new user**
2. **Email:** Hasan Bey'in e-postası
3. **Password:** kendin bir şifre belirle
4. **Auto Confirm User** kutusunu **işaretle** (yoksa e-posta doğrulaması bekler)
5. **Create user**

Şifreyi Hasan Bey'e ilet. İsterse panelden değil, Supabase'den değiştirirsin.

---

## 5. Dene

`https://orhannsemiz-wq.github.io/kayra-construction/panel.html`

Giriş yap, bir yazıyı değiştir, **Yayınla** de, sonra siteyi aç ve kontrol et.

---

## Bilinmesi gerekenler

**Panel neyi değiştirir:** ana sayfa sloganı ve giriş yazısı, üç rakam,
tüm proje kartları (ekleme/silme dahil), **emlak ilanları** (ekleme, silme,
gizleme, üç fotoğrafa kadar), iletişim bilgileri.

**Satılan ilan:** silmek yerine "Bu ilan sitede görünsün" işaretini kaldırmak
yeterli — siteden kalkar ama bilgiler panelde durur, gerekirse geri açılır.
Tüm ilanlar gizlenirse emlak bölümündeki ilan alanı tamamen kaybolur,
altındaki portföy bulucu çalışmaya devam eder.

**Neyi değiştirmez:** bölüm başlıkları, süreç adımları, yükseliş sekansı,
kapak videosu, tasarım. Bunlar koda gömülü — değişmesi gerekirse sen yaparsın.

**Diller:** panel Türkçeyi düzenler. Her alanın altında isteğe bağlı bir
İngilizce kutusu var. Boş bırakılırsa İngilizce sayfada Türkçe metin görünür —
yanlış çeviri göstermektense bu tercih edildi. Rusça, İngilizceye düşer.
Hasan Bey bir metni değiştirdiğinde İngilizcesini de yazmazsa, o metnin
İngilizcesi Türkçe kalır. Önemli değişikliklerde çevirileri sen tamamla.

**Fotoğraflar:** telefondan seçilebilir. Tarayıcıda otomatik olarak en uzun
kenar 1600 piksele küçültülür ve JPEG %82'ye sıkıştırılır — Hasan Bey'in
10 MB'lık fotoğrafı siteyi yavaşlatmaz.

**Geri alma:** panelde **Hesap** sekmesinde son beş yayının kaydı durur.
"Bu hâle dön" denince yazılar o hâle döner; sitede görünmesi için yine
Yayınla demek gerekir. Beşten eskisine dönmek gerekirse Supabase →
**Table Editor** → `site_icerik` → `gecmis` sütunundan bakılabilir.

**Yarım kalan iş:** yayınlanmamış değişiklikler tarayıcıda saklanır.
Hasan Bey sekmeyi kazara kapatırsa, tekrar girdiğinde "Devam et" diye sorar.

**Şifre:** Hasan Bey kendi şifresini **Hesap** sekmesinden değiştirebilir.

**Yayınlama gecikmesi:** yok. "Yayınla" der demez site günceldir; ziyaretçi
sayfayı yenilediğinde yeni içeriği görür.
