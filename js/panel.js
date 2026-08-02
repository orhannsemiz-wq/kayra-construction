/* ============================================================
   PANEL MANTIĞI
   Supabase'in REST arayüzünü doğrudan kullanır — dışarıdan kütüphane
   yüklenmez, dolayısıyla panel çevrimdışı bir CDN'e bağımlı değildir.

   Güvenlik notu: buradaki "anon" anahtar herkese açıktır, olması gereken
   de budur. Yazma yetkisini anahtar değil, Supabase'deki RLS kuralları
   verir: yalnız giriş yapmış kullanıcı yazabilir, herkes okuyabilir.
   ============================================================ */
(function () {
  var A = window.PANEL_AYAR || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* Kurulum yapılmadıysa panel açılmaz. */
  if (!A.url || !A.anahtar) { $("#ekranKurulum").classList.remove("gizli"); return; }

  var OTURUM = null, ICERIK = null, KIRLI = false, YUKLENEN_PROJE = null;

  /* ---------- sitenin bugünkü içeriği: ilk açılışta bunlar gelir ---------- */
  var VARSAYILAN = {
    surum: 1,
    anasayfa: {
      slogan1: "Adımızı", slogan1_en: "Our name",
      slogan2: "Temele yazdık.", slogan2_en: "in the foundation.",
      giris: "Söz de beton da — ikisi de tutar. Kuzey Kıbrıs'ta yüz yıllık Kıbrıs taşını modern evle buluşturuyoruz: arsayı bulan, projeyi yürüten ve anahtarı elinize bırakan aynı imza.",
      giris_en: "Our word and our concrete — both of them set. In North Cyprus we bring century-old Cyprus stone into the modern home: one signature finds the land, runs the build and hands you the key.",
      istatistik: [
        { sayi: "8", etiket: "Teslim edilen konut", etiket_en: "Homes delivered" },
        { sayi: "3.", etiket: "Yılımız", etiket_en: "Years in business" },
        { sayi: "610", birim: "m²", etiket: "Yapımdaki en büyük villa", etiket_en: "Largest villa in build" }
      ]
    },
    projeler: [
      { id: "p1", ad: "Modern Villa", ad_en: "Modern Villa", konum: "Mehmetçik, İskele",
        aciklama: "Sade çizgili, ferah bir modern villa. 250 m² kullanım alanı, 3 oda; teslim edildi, sahibi içinde yaşıyor.",
        oda: "3", alan: "250 m²", durum: "Teslim edildi", durum_en: "Delivered",
        rozet: "Tamamlandı", rozet_en: "Completed",
        foto: "assets/foto/proje-modern.jpg", temsili: true },
      { id: "p2", ad: "Kemerli Villa", ad_en: "Arched Villa", konum: "Büyükkonuk, İskele",
        aciklama: "Geçmişten gelen kültürü modern yapıyla buluşturan proje: kemerli geçişler, 610 m² alan, 6 oda.",
        oda: "6", alan: "610 m²", durum: "Yapımda", durum_en: "In build",
        rozet: "Yapımda", rozet_en: "In build",
        foto: "assets/foto/proje-teslim.jpg", temsili: false },
      { id: "p3", ad: "Kemerli Taş Ev", ad_en: "Stone Arch House", konum: "Büyükkonuk, İskele",
        aciklama: "Eski Kıbrıs kültürünü hissettiren kemerli taş ev — 300 m², 6 oda; müstakil ve karakterli.",
        oda: "6", alan: "300 m²", durum: "Yapımda", durum_en: "In build",
        rozet: "Yapımda", rozet_en: "In build",
        foto: "assets/foto/proje-tasev.jpg", temsili: true }
    ],
    iletisim: {
      telefon: "0533 829 80 30", telefonHam: "+905338298030", whatsapp: "905338298030",
      eposta: "kayraconstruction0@gmail.com",
      adres: "Mehmetçik / İskele, KKTC", adres_en: "Mehmetçik / İskele, N. Cyprus",
      instagram: "https://instagram.com/kayra_constructionn",
      facebook: "https://www.facebook.com/share/17DKp3gFcU/"
    }
  };

  /* ---------------- yardımcılar ---------------- */
  function al(o, yol) { return yol.split(".").reduce(function (a, k) { return a && a[k]; }, o); }
  function koy(o, yol, d) {
    var p = yol.split("."), s = p.pop();
    p.reduce(function (a, k) { return a[k] || (a[k] = {}); }, o)[s] = d;
  }
  function durum(m, renk) {
    var el = $("#durum"); el.innerHTML = m;
    el.style.color = renk || "";
  }
  function kirlet() {
    KIRLI = true; $("#btnYayinla").disabled = false;
    durum("Kaydedilmemiş değişiklikleriniz var.", "#A8443A");
  }
  addEventListener("beforeunload", function (e) {
    if (KIRLI) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------------- giriş ---------------- */
  function girisEkrani(mesaj) {
    $("#ekranPanel").classList.add("gizli");
    $("#ekranGiris").classList.remove("gizli");
    if (mesaj) { $("#girisHata").textContent = mesaj; $("#girisHata").classList.remove("gizli"); }
  }
  function girisYap() {
    var e = $("#gEposta").value.trim(), s = $("#gSifre").value;
    if (!e || !s) return girisEkrani("E-posta ve şifre gerekli.");
    $("#btnGiris").disabled = true; $("#btnGiris").textContent = "Giriş yapılıyor…";
    fetch(A.url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: A.anahtar, "Content-Type": "application/json" },
      body: JSON.stringify({ email: e, password: s })
    }).then(function (r) { return r.json(); }).then(function (j) {
      $("#btnGiris").disabled = false; $("#btnGiris").textContent = "Giriş Yap";
      if (!j.access_token) return girisEkrani("E-posta veya şifre hatalı.");
      OTURUM = { token: j.access_token, eposta: (j.user && j.user.email) || e };
      try { sessionStorage.setItem("kayraOturum", JSON.stringify(OTURUM)); } catch (x) {}
      paneliAc();
    }).catch(function () {
      $("#btnGiris").disabled = false; $("#btnGiris").textContent = "Giriş Yap";
      girisEkrani("Bağlanılamadı. İnternetinizi kontrol edin.");
    });
  }
  $("#btnGiris").addEventListener("click", girisYap);
  $("#gSifre").addEventListener("keydown", function (e) { if (e.key === "Enter") girisYap(); });
  $("#btnCikis").addEventListener("click", function () {
    if (KIRLI && !confirm("Kaydedilmemiş değişiklikleriniz var. Yine de çıkılsın mı?")) return;
    try { sessionStorage.removeItem("kayraOturum"); } catch (x) {}
    location.reload();
  });

  /* ---------------- içeriği getir ---------------- */
  function paneliAc() {
    $("#ekranGiris").classList.add("gizli");
    $("#ekranPanel").classList.remove("gizli");
    $("#kimBilgi").textContent = OTURUM.eposta;
    fetch(A.url + "/rest/v1/site_icerik?id=eq.1&select=veri", {
      headers: { apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token }
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (j) {
      ICERIK = (j && j[0] && j[0].veri) ? j[0].veri : JSON.parse(JSON.stringify(VARSAYILAN));
      if (!Array.isArray(ICERIK.projeler)) ICERIK.projeler = VARSAYILAN.projeler.slice();
      doldur();
    }).catch(function () {
      ICERIK = JSON.parse(JSON.stringify(VARSAYILAN)); doldur();
      durum("İçerik sunucudan alınamadı; sitenin mevcut hâli gösteriliyor.", "#A8443A");
    });
  }

  /* ---------------- formu doldur ---------------- */
  function doldur() {
    $$("[data-i]").forEach(function (el) {
      var v = al(ICERIK, el.getAttribute("data-i"));
      el.value = v == null ? "" : v;
      el.addEventListener("input", function () {
        koy(ICERIK, el.getAttribute("data-i"), el.value); kirlet();
      });
    });
    istatistikCiz();
    projeleriCiz();
    $("#btnYayinla").disabled = true;
    durum("Hazır. Değişiklik yapıp <b>Yayınla</b> deyin.");
  }

  function istatistikCiz() {
    var k = $("#istatistikler"); k.innerHTML = "";
    (ICERIK.anasayfa.istatistik || []).forEach(function (s, i) {
      var d = document.createElement("div");
      d.className = "ikili";
      d.innerHTML =
        '<div class="alan"><label>' + (i + 1) + '. rakam</label>' +
        '<input type="text" value="' + kacis(s.sayi || "") + '" data-r="' + i + '.sayi"></div>' +
        '<div class="alan"><label>Altındaki yazı</label>' +
        '<input type="text" value="' + kacis(s.etiket || "") + '" data-r="' + i + '.etiket"></div>';
      k.appendChild(d);
    });
    k.querySelectorAll("[data-r]").forEach(function (el) {
      el.addEventListener("input", function () {
        var p = el.getAttribute("data-r").split(".");
        ICERIK.anasayfa.istatistik[+p[0]][p[1]] = el.value; kirlet();
      });
    });
  }

  function kacis(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- projeler ---------------- */
  function projeleriCiz() {
    var k = $("#projeListe"); k.innerHTML = "";
    ICERIK.projeler.forEach(function (p, i) {
      var d = document.createElement("div");
      d.className = "proje"; d.dataset.i = i;
      d.innerHTML =
        '<div class="proje-ust">' +
          '<img src="' + kacis(p.foto || "") + '" alt="">' +
          '<div><div class="ad">' + kacis(p.ad || "Adsız proje") + '</div>' +
          '<div class="yer">' + kacis(p.konum || "") + '</div></div>' +
          '<button class="ac-kapa" type="button">Düzenle</button>' +
        '</div>' +
        '<div class="proje-govde">' +
          alanHtml("Proje adı", "ad", p.ad) +
          alanHtml("Konum", "konum", p.konum) +
          '<div class="alan"><label>Açıklama</label>' +
            '<textarea data-p="aciklama">' + kacis(p.aciklama || "") + '</textarea></div>' +
          '<div class="ikili">' + alanHtml("Oda sayısı", "oda", p.oda) +
            alanHtml("Alan", "alan", p.alan) + '</div>' +
          '<div class="ikili">' + alanHtml("Durum", "durum", p.durum) +
            alanHtml("Fotoğraf üstündeki etiket", "rozet", p.rozet) + '</div>' +
          '<div class="alan"><label>Fotoğraf</label>' +
            '<div class="ipucu">Telefonunuzdan seçebilirsiniz. Büyük fotoğraflar otomatik küçültülür.</div>' +
            '<button class="foto-sec" type="button">📷 Fotoğrafı değiştir</button></div>' +
          '<div class="alan"><label style="font-weight:500;font-size:14px">' +
            '<input type="checkbox" data-p="temsili" ' + (p.temsili ? "checked" : "") +
            ' style="width:auto;min-height:0;margin-right:8px;vertical-align:middle">' +
            'Bu bir proje görseli (gerçek fotoğraf değil)</label></div>' +
          '<button class="sil" type="button">Bu projeyi sil</button>' +
        '</div>';
      k.appendChild(d);
    });
    projeOlaylari(k);
  }

  function alanHtml(etiket, anahtar, deger) {
    return '<div class="alan"><label>' + etiket + '</label>' +
      '<input type="text" data-p="' + anahtar + '" value="' + kacis(deger || "") + '"></div>';
  }

  function projeOlaylari(k) {
    k.querySelectorAll(".proje").forEach(function (d) {
      var i = +d.dataset.i;
      d.querySelector(".ac-kapa").addEventListener("click", function () {
        d.classList.toggle("acik");
        this.textContent = d.classList.contains("acik") ? "Kapat" : "Düzenle";
      });
      d.querySelectorAll("[data-p]").forEach(function (el) {
        el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
          ICERIK.projeler[i][el.dataset.p] = el.type === "checkbox" ? el.checked : el.value;
          if (el.dataset.p === "ad") d.querySelector(".ad").textContent = el.value || "Adsız proje";
          if (el.dataset.p === "konum") d.querySelector(".yer").textContent = el.value;
          kirlet();
        });
      });
      d.querySelector(".foto-sec").addEventListener("click", function () {
        YUKLENEN_PROJE = i; $("#fotoSecici").click();
      });
      d.querySelector(".sil").addEventListener("click", function () {
        if (!confirm("“" + (ICERIK.projeler[i].ad || "Bu proje") + "” silinsin mi?\n\nYayınlayana kadar sitede kalmaya devam eder.")) return;
        ICERIK.projeler.splice(i, 1); projeleriCiz(); kirlet();
      });
    });
  }

  $("#btnYeniProje").addEventListener("click", function () {
    ICERIK.projeler.push({
      id: "p" + Date.now(), ad: "Yeni proje", konum: "", aciklama: "",
      oda: "", alan: "", durum: "Yapımda", rozet: "Yapımda", foto: "", temsili: false
    });
    projeleriCiz(); kirlet();
    var son = $("#projeListe").lastElementChild;
    son.classList.add("acik"); son.querySelector(".ac-kapa").textContent = "Kapat";
    son.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ---------------- fotoğraf yükleme ---------------- */
  $("#fotoSecici").addEventListener("change", function () {
    var dosya = this.files && this.files[0]; this.value = "";
    if (!dosya || YUKLENEN_PROJE == null) return;
    durum("Fotoğraf hazırlanıyor…");
    kucult(dosya, function (blob) {
      if (!blob) return durum("Bu dosya okunamadı. Başka bir fotoğraf deneyin.", "#A8443A");
      var ad = "proje-" + Date.now() + ".jpg";
      durum("Fotoğraf yükleniyor…");
      fetch(A.url + "/storage/v1/object/medya/" + ad, {
        method: "POST",
        headers: { apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token, "Content-Type": "image/jpeg" },
        body: blob
      }).then(function (r) {
        if (!r.ok) throw 0;
        var url = A.url + "/storage/v1/object/public/medya/" + ad;
        ICERIK.projeler[YUKLENEN_PROJE].foto = url;
        var kart = $('#projeListe .proje[data-i="' + YUKLENEN_PROJE + '"]');
        if (kart) kart.querySelector("img").src = url;
        kirlet(); durum("Fotoğraf yüklendi. <b>Yayınla</b> demeyi unutmayın.", "#A8443A");
      }).catch(function () {
        durum("Fotoğraf yüklenemedi. İnternetinizi kontrol edip tekrar deneyin.", "#A8443A");
      });
    });
  });

  /* Tarayıcıda küçültme: telefondan gelen 5–10 MB'lık fotoğraflar siteyi
     yavaşlatmasın diye en uzun kenar 1600px, JPEG %82. */
  function kucult(dosya, bitince) {
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      var img = new Image();
      img.onload = function () {
        var enBuyuk = 1600, o = Math.min(1, enBuyuk / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
        var x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(bitince, "image/jpeg", 0.82);
      };
      img.onerror = function () { bitince(null); };
      img.src = okuyucu.result;
    };
    okuyucu.onerror = function () { bitince(null); };
    okuyucu.readAsDataURL(dosya);
  }

  /* ---------------- yayınla ---------------- */
  $("#btnYayinla").addEventListener("click", function () {
    var b = this; b.disabled = true; b.textContent = "Yayınlanıyor…";
    ICERIK.guncelleme = new Date().toISOString();
    fetch(A.url + "/rest/v1/site_icerik?id=eq.1", {
      method: "PATCH",
      headers: {
        apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token,
        "Content-Type": "application/json", Prefer: "return=minimal"
      },
      body: JSON.stringify({ veri: ICERIK })
    }).then(function (r) {
      b.textContent = "Yayınla";
      if (!r.ok) throw 0;
      KIRLI = false; b.disabled = true;
      durum('Yayınlandı. <a href="index.html" target="_blank" style="color:#2B4D41"><b>Siteyi aç →</b></a>', "#2B4D41");
    }).catch(function () {
      b.disabled = false; b.textContent = "Yayınla";
      durum("Yayınlanamadı. İnternetinizi kontrol edip tekrar deneyin.", "#A8443A");
    });
  });

  /* ---------------- sekmeler & isteğe bağlı İngilizce ---------------- */
  $$("nav.sek button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("nav.sek button").forEach(function (x) { x.classList.remove("on"); });
      $$("section.sayfa").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); $("#s-" + b.dataset.sayfa).classList.add("on");
      scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  $$(".en-ac").forEach(function (b) {
    b.addEventListener("click", function () {
      var kutu = b.nextElementSibling;
      kutu.classList.toggle("acik");
      b.textContent = kutu.classList.contains("acik")
        ? "İngilizceyi gizle" : "İngilizcesini yaz (isteğe bağlı)";
    });
  });

  /* ---------------- açılış ---------------- */
  try {
    var kayit = sessionStorage.getItem("kayraOturum");
    if (kayit) { OTURUM = JSON.parse(kayit); paneliAc(); } else girisEkrani();
  } catch (x) { girisEkrani(); }
})();
