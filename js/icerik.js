/* ============================================================
   İÇERİK KATMANI
   Panelden yayınlanan içeriği alır ve sayfaya uygular.

   Tasarım kararı: site HTML'i tek başına eksiksiz çalışır. Bu dosya
   yalnızca ÜZERİNE yazar. Supabase kapalıysa, ağ koparsa ya da içerik
   hiç yayınlanmamışsa sayfa sabit hâliyle görünür — beyaz ekran yok.

   Dil: panel Türkçeyi düzenler. İngilizce alan doldurulmuşsa o kullanılır,
   boşsa İngilizce de Türkçeye düşer (yanlış çeviri göstermektense
   Türkçesini göstermek daha dürüst). Rusça sözlükte karşılığı yoksa
   zaten İngilizceye düşüyor.
   ============================================================ */
(function () {
  var A = window.PANEL_AYAR || {};
  if (!A.url || !A.anahtar) return; // kurulmamış: sabit içerik kalsın

  fetch(A.url + "/rest/v1/site_icerik?id=eq.1&select=veri", {
    headers: { apikey: A.anahtar, Authorization: "Bearer " + A.anahtar }
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.length || !j[0].veri) return;
      try { uygula(j[0].veri); } catch (e) { console.warn("İçerik uygulanamadı:", e); }
    })
    .catch(function () { /* ağ hatası: sabit içerik kalır */ });

  /* Bir öğeye iki dilli metin yazar. Dil sistemi data-tr/data-en okuduğu
     için önce onları güncelliyoruz, sonra görüneni tazeliyoruz. */
  function yaz(el, tr, en) {
    if (!el || tr == null || tr === "") return;
    el.setAttribute("data-tr", tr);
    el.setAttribute("data-en", en && en !== "" ? en : tr);
    el.textContent = document.documentElement.lang === "en"
      ? el.getAttribute("data-en") : tr;
  }
  function q(s) { return document.querySelector(s); }
  function qq(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function uygula(d) {
    /* ---------- ANA SAYFA ---------- */
    if (d.anasayfa) {
      var a = d.anasayfa;
      yaz(q(".display .l1"), a.slogan1, a.slogan1_en);
      yaz(q(".display .l2"), a.slogan2, a.slogan2_en);
      yaz(q(".hero-lead"), a.giris, a.giris_en);
      if (Array.isArray(a.istatistik)) {
        qq(".hA-stats .hstat").forEach(function (el, i) {
          var s = a.istatistik[i]; if (!s) return;
          var b = el.querySelector("b");
          if (b && s.sayi) b.innerHTML = s.birim
            ? s.sayi + '<i>' + s.birim + '</i>' : s.sayi;
          yaz(el.querySelector("span"), s.etiket, s.etiket_en);
        });
      }
    }

    /* ---------- PROJELER ---------- */
    if (Array.isArray(d.projeler) && d.projeler.length) {
      var kap = q("#insaat .cards") || q(".cards");
      if (kap) {
        kap.innerHTML = d.projeler.map(kartHtml).join("");
        buyutmeyiBagla(kap);
      }
    }

    /* ---------- İLETİŞİM ---------- */
    if (d.iletisim) {
      var c = d.iletisim;
      if (c.telefonHam) qq('a[href^="tel:"]').forEach(function (el) {
        el.href = "tel:" + c.telefonHam;
        if (c.telefon) el.textContent = /📞/.test(el.textContent)
          ? "📞 " + c.telefon : c.telefon;
      });
      if (c.whatsapp) qq('a[href*="wa.me"]').forEach(function (el) {
        el.href = el.href.replace(/wa\.me\/\d+/, "wa.me/" + c.whatsapp);
      });
      if (c.eposta) qq('a[href^="mailto:"]').forEach(function (el) {
        el.href = "mailto:" + c.eposta; el.textContent = c.eposta;
      });
      if (c.instagram) qq('a[href*="instagram.com"]').forEach(function (el) { el.href = c.instagram; });
      if (c.facebook) qq('a[href*="facebook.com"]').forEach(function (el) { el.href = c.facebook; });
      if (c.adres) qq('[data-tr="Mehmetçik / İskele, KKTC"]').forEach(function (el) {
        yaz(el, c.adres, c.adres_en);
      });
    }

    /* Dil butonları görünen metni yeniden yazıyor; mevcut dili tazele. */
    if (typeof window.setLang === "function") {
      window.setLang(document.documentElement.lang || "tr");
    }
  }

  function kacis(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function kartHtml(p) {
    var ad = kacis(p.ad), adEn = kacis(p.ad_en || p.ad);
    var rozet = kacis(p.rozet || ""), rozetEn = kacis(p.rozet_en || p.rozet || "");
    var satir = [];
    if (p.oda) satir.push('<div><span data-tr="Oda" data-en="Rooms">Oda</span><b>' + kacis(p.oda) + "</b></div>");
    if (p.alan) satir.push('<div><span data-tr="Alan" data-en="Area">Alan</span><b>' + kacis(p.alan) + "</b></div>");
    if (p.durum) satir.push('<div><span data-tr="Durum" data-en="Status">Durum</span><b data-tr="' +
      kacis(p.durum) + '" data-en="' + kacis(p.durum_en || p.durum) + '">' + kacis(p.durum) + "</b></div>");

    return '<div class="card">' +
      '<div class="ph"><img src="' + kacis(p.foto) + '" alt="' + ad + '" loading="lazy">' +
      (rozet ? '<span class="st" data-tr="' + rozet + '" data-en="' + rozetEn + '">' + rozet + "</span>" : "") +
      "</div>" +
      '<div class="body">' +
      '<h3 data-tr="' + ad + '" data-en="' + adEn + '">' + ad + "</h3>" +
      (p.konum ? '<div class="loc">' + kacis(p.konum) + "</div>" : "") +
      (p.aciklama ? '<p data-tr="' + kacis(p.aciklama) + '" data-en="' +
        kacis(p.aciklama_en || p.aciklama) + '">' + kacis(p.aciklama) + "</p>" : "") +
      (satir.length ? '<div class="facts">' + satir.join("") + "</div>" : "") +
      (p.temsili ? '<div class="pvn" data-tr="Proje görseli" data-en="Visualisation">Proje görseli</div>' : "") +
      "</div></div>";
  }

  /* Kartlar yeniden çizilince main.js'in kurduğu büyüteç bağı kopuyor;
     yeni görsellere aynı davranışı geri takıyoruz. */
  function buyutmeyiBagla(kap) {
    if (typeof window.openLB !== "function") return;
    kap.querySelectorAll(".ph img").forEach(function (el) {
      el.classList.add("zoomable");
      el.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        window.openLB(el.src, el.alt);
      });
    });
  }
})();
