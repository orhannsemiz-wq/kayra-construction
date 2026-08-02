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

  var OTURUM = null, ICERIK = null, KIRLI = false, YUKLENEN_PROJE = null, YUKLENEN_ILAN = null;
  var GECMIS = [];          // son 5 yayının kaydı
  var SON_YAYIN = null;     // sunucuda o an duran hâl (geçmişe bu yazılır)
  var TASLAK = "kayraTaslak";

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
    ilanlar: [
      { id: "i1", yayinda: true, tur: "Arazi", tur_en: "Land",
        baslik: "2.242 m² arazi", baslik_en: "2,242 m² plot",
        konum: "Mehmetçik, İskele",
        aciklama: "Köyün hemen dışında, tarlaların arasında düz bir parsel. Yola cephesi var, uzaktan deniz görünüyor. Sınırları fotoğraflarda işaretli.",
        alan: "2.242 m²", kocan: "Türk koçanlı", kocan_en: "Turkish title",
        fiyat: "£15.000", rozet: "Satılık", rozet_en: "For sale",
        not: "Fiyat arsanın tamamı içindir, metrekare fiyatı değildir.",
        fotolar: ["assets/foto/arsa-mehmetcik-1.jpg",
                  "assets/foto/arsa-mehmetcik-2.jpg",
                  "assets/foto/arsa-mehmetcik-3.jpg"] }
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
  /* Sığ değil, iç içe birleştirme: diziler ve düz değerler olduğu gibi
     geçer, nesneler alan alan üst üste biner. */
  function birlestir(temel, gelen) {
    if (!gelen || typeof gelen !== "object" || Array.isArray(gelen)) return temel;
    Object.keys(gelen).forEach(function (k) {
      var g = gelen[k];
      if (g && typeof g === "object" && !Array.isArray(g) &&
          temel[k] && typeof temel[k] === "object" && !Array.isArray(temel[k])) {
        temel[k] = birlestir(temel[k], g);
      } else if (g !== undefined && g !== null) {
        temel[k] = g;
      }
    });
    return temel;
  }

  function durum(m, renk) {
    var el = $("#durum"); el.innerHTML = m;
    el.style.color = renk || "";
  }
  function kirlet() {
    KIRLI = true; $("#btnYayinla").disabled = false;
    durum("Kaydedilmemiş değişiklikleriniz var.", "#A8443A");
    taslakYaz();
  }

  /* Tarayıcı kapanırsa emek çöpe gitmesin: her değişiklik yerelde saklanır.
     Yayınlanınca silinir. Sunucuya değil, yalnız bu cihaza yazılır. */
  function taslakYaz() {
    try {
      localStorage.setItem(TASLAK, JSON.stringify({ tarih: Date.now(), veri: ICERIK }));
    } catch (x) {}
  }
  function taslakSil() { try { localStorage.removeItem(TASLAK); } catch (x) {} }
  function taslakOku() {
    try { return JSON.parse(localStorage.getItem(TASLAK) || "null"); } catch (x) { return null; }
  }

  function zamanYaz(ms) {
    var d = new Date(ms), bugun = new Date();
    var saat = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    if (d.toDateString() === bugun.toDateString()) return "bugün " + saat;
    var ay = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz",
              "Ağustos","Eylül","Ekim","Kasım","Aralık"][d.getMonth()];
    return d.getDate() + " " + ay + " " + saat;
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
    fetch(A.url + "/rest/v1/site_icerik?id=eq.1&select=veri,gecmis", {
      headers: { apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token }
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (j) {
      var s = j && j[0];
      /* Gelen içeriği varsayılanın ÜZERİNE bindiriyoruz. Elle düzenlenmiş ya
         da yarım kalmış bir kayıt (ör. anasayfa bölümü hiç yoksa) paneli
         çökertmesin; eksik alanlar sitenin bugünkü hâliyle dolar. */
      ICERIK = birlestir(JSON.parse(JSON.stringify(VARSAYILAN)), s && s.veri);
      GECMIS = (s && Array.isArray(s.gecmis)) ? s.gecmis : [];
      if (!Array.isArray(ICERIK.projeler) || !ICERIK.projeler.length) {
        ICERIK.projeler = JSON.parse(JSON.stringify(VARSAYILAN.projeler));
      }
      /* İlanlar silinebilir olmalı — boş dizi geçerli bir durumdur, o yüzden
         projelerden farklı olarak "boşsa varsayılanı geri getir" YAPMIYORUZ. */
      if (!Array.isArray(ICERIK.ilanlar)) {
        ICERIK.ilanlar = JSON.parse(JSON.stringify(VARSAYILAN.ilanlar));
      }
      SON_YAYIN = JSON.stringify(ICERIK);
      doldur();
      taslakSor();
    }).catch(function () {
      ICERIK = JSON.parse(JSON.stringify(VARSAYILAN)); doldur();
      durum("İçerik sunucudan alınamadı; sitenin mevcut hâli gösteriliyor.", "#A8443A");
    });
  }

  /* Yarım kalmış düzenleme varsa sor — sessizce geri yüklemek,
     kullanıcının bilmediği bir değişikliği yayınlamasına yol açardı. */
  function taslakSor() {
    var t = taslakOku();
    if (!t || !t.veri) return;
    if (JSON.stringify(t.veri) === SON_YAYIN) { taslakSil(); return; }
    $("#taslakZaman").textContent = zamanYaz(t.tarih) + " tarihinde bırakıldı";
    $("#taslakBar").classList.remove("gizli");
    $("#btnTaslakDevam").onclick = function () {
      ICERIK = t.veri;
      if (!Array.isArray(ICERIK.projeler)) ICERIK.projeler = [];
      $("#taslakBar").classList.add("gizli");
      doldur(); kirlet();
      durum("Kaldığınız yerden devam ediyorsunuz. <b>Yayınla</b> demeyi unutmayın.", "#A8443A");
    };
    $("#btnTaslakAt").onclick = function () {
      taslakSil(); $("#taslakBar").classList.add("gizli");
    };
  }

  /* ---------------- sürüm geçmişi ---------------- */
  function gecmisCiz() {
    var k = $("#gecmisListe");
    if (!GECMIS.length) {
      k.innerHTML = '<div class="bos">Henüz kayıt yok. İlk yayınınızdan sonra burada görünecek.</div>';
      return;
    }
    k.innerHTML = GECMIS.map(function (g, i) {
      var n = (g.veri && Array.isArray(g.veri.projeler)) ? g.veri.projeler.length : 0;
      return '<div class="gecmis"><div class="t">' + zamanYaz(g.tarih) +
        "<small>" + n + " proje</small></div>" +
        '<button type="button" data-g="' + i + '">Bu hâle dön</button></div>';
    }).join("");
    k.querySelectorAll("[data-g]").forEach(function (b) {
      b.addEventListener("click", function () {
        var g = GECMIS[+b.dataset.g];
        if (!g || !g.veri) return;
        if (!confirm(zamanYaz(g.tarih) + " tarihindeki hâle dönülsün mü?\n\n" +
          "Yazılar o hâle döner. Sitede görünmesi için Yayınla demeniz gerekir.")) return;
        ICERIK = JSON.parse(JSON.stringify(g.veri));
        if (!Array.isArray(ICERIK.projeler)) ICERIK.projeler = [];
        doldur(); kirlet();
        durum("Eski hâle dönüldü. Sitede görünmesi için <b>Yayınla</b> deyin.", "#A8443A");
        scrollTo({ top: 0, behavior: "smooth" });
      });
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
    ilanlariCiz();
    gecmisCiz();
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
          '<div class="sira">' +
            '<button type="button" class="yukari" title="Yukarı taşı"' +
              (i === 0 ? " disabled" : "") + ">↑</button>" +
            '<button type="button" class="asagi" title="Aşağı taşı"' +
              (i === ICERIK.projeler.length - 1 ? " disabled" : "") + ">↓</button>" +
          "</div>" +
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
      d.querySelector(".yukari").addEventListener("click", function () { tasi(i, -1); });
      d.querySelector(".asagi").addEventListener("click", function () { tasi(i, 1); });
      d.querySelector(".sil").addEventListener("click", function () {
        if (!confirm("“" + (ICERIK.projeler[i].ad || "Bu proje") + "” silinsin mi?\n\nYayınlayana kadar sitede kalmaya devam eder.")) return;
        ICERIK.projeler.splice(i, 1); projeleriCiz(); kirlet();
      });
    });
  }

  /* Sitedeki kart sırası bu listeyle aynı. */
  function tasi(i, yon) {
    var j = i + yon, p = ICERIK.projeler;
    if (j < 0 || j >= p.length) return;
    var t = p[i]; p[i] = p[j]; p[j] = t;
    projeleriCiz(); kirlet();
    var k = $('#projeListe .proje[data-i="' + j + '"]');
    if (k) k.scrollIntoView({ block: "center" });
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

  /* ---------------- emlak ilanları ---------------- */
  function ilanlariCiz() {
    var k = $("#ilanListe"); if (!k) return;
    if (!ICERIK.ilanlar.length) {
      k.innerHTML = '<div class="bos">Henüz ilan yok. Aşağıdan ekleyebilirsiniz.</div>';
      return;
    }
    k.innerHTML = ICERIK.ilanlar.map(function (x, i) {
      var f = x.fotolar || [];
      return '<div class="proje' + (x.yayinda === false ? "" : "") + '" data-i="' + i + '">' +
        '<div class="proje-ust">' +
          '<img src="' + kacis(f[0] || "") + '" alt="">' +
          '<div><div class="ad">' + kacis(x.baslik || "Adsız ilan") + "</div>" +
          '<div class="yer">' + kacis(x.konum || "") +
            (x.yayinda === false ? " · <b>gizli</b>" : "") + "</div></div>" +
          '<div class="sira">' +
            '<button type="button" class="yukari"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
            '<button type="button" class="asagi"' + (i === ICERIK.ilanlar.length - 1 ? " disabled" : "") + ">↓</button>" +
          "</div>" +
          '<button class="ac-kapa" type="button">Düzenle</button>' +
        "</div>" +
        '<div class="proje-govde">' +
          '<label class="yayin-anahtar"><input type="checkbox" data-x="yayinda" ' +
            (x.yayinda === false ? "" : "checked") + "> Bu ilan sitede görünsün</label>" +
          ialan("İlan başlığı", "baslik", x.baslik) +
          '<div class="ikili">' + ialan("Tür (Arazi, Villa, Daire…)", "tur", x.tur) +
            ialan("Konum", "konum", x.konum) + "</div>" +
          '<div class="alan"><label>Açıklama</label><textarea data-x="aciklama">' +
            kacis(x.aciklama || "") + "</textarea></div>" +
          '<div class="ikili">' + ialan("Alan", "alan", x.alan) +
            ialan("Koçan", "kocan", x.kocan) + "</div>" +
          '<div class="ikili">' + ialan("Fiyat", "fiyat", x.fiyat) +
            ialan("Fotoğraf üstündeki etiket", "rozet", x.rozet) + "</div>" +
          '<div class="alan"><label>Küçük not (isteğe bağlı)</label>' +
            '<div class="ipucu">Fiyatın altında küçük yazıyla çıkar.</div>' +
            '<input type="text" data-x="not" value="' + kacis(x.not || "") + '"></div>' +
          '<div class="alan"><label>Fotoğraflar</label>' +
            '<div class="ipucu">İlki büyük görünür, diğer ikisi altında küçük çıkar.</div>' +
            '<div class="foto-serit">' + [0, 1, 2].map(function (n) {
              return '<div class="foto-kutu" data-slot="' + n + '">' +
                (f[n] ? '<img src="' + kacis(f[n]) + '" alt="">' : "Fotoğraf ekle") +
                '<span class="rozet">' + (n === 0 ? "Büyük" : n + 1) + "</span></div>";
            }).join("") + "</div></div>" +
          '<button class="sil" type="button">Bu ilanı sil</button>' +
        "</div></div>";
    }).join("");
    ilanOlaylari(k);
  }

  function ialan(etiket, anahtar, deger) {
    return '<div class="alan"><label>' + etiket + '</label>' +
      '<input type="text" data-x="' + anahtar + '" value="' + kacis(deger || "") + '"></div>';
  }

  function ilanOlaylari(k) {
    k.querySelectorAll(".proje").forEach(function (d) {
      var i = +d.dataset.i;
      d.querySelector(".ac-kapa").addEventListener("click", function () {
        d.classList.toggle("acik");
        this.textContent = d.classList.contains("acik") ? "Kapat" : "Düzenle";
      });
      d.querySelectorAll("[data-x]").forEach(function (el) {
        el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
          ICERIK.ilanlar[i][el.dataset.x] = el.type === "checkbox" ? el.checked : el.value;
          if (el.dataset.x === "baslik") d.querySelector(".ad").textContent = el.value || "Adsız ilan";
          if (el.dataset.x === "yayinda") ilanlariCiz();
          kirlet();
        });
      });
      d.querySelectorAll(".foto-kutu").forEach(function (kutu) {
        kutu.addEventListener("click", function () {
          YUKLENEN_PROJE = null; YUKLENEN_ILAN = { i: i, slot: +kutu.dataset.slot };
          $("#fotoSecici").click();
        });
      });
      d.querySelector(".yukari").addEventListener("click", function () { ilanTasi(i, -1); });
      d.querySelector(".asagi").addEventListener("click", function () { ilanTasi(i, 1); });
      d.querySelector(".sil").addEventListener("click", function () {
        if (!confirm("“" + (ICERIK.ilanlar[i].baslik || "Bu ilan") + "” tamamen silinsin mi?\n\n" +
          "Satıldıysa silmek yerine “sitede görünsün” işaretini kaldırabilirsiniz — " +
          "böylece bilgiler kaybolmaz.")) return;
        ICERIK.ilanlar.splice(i, 1); ilanlariCiz(); kirlet();
      });
    });
  }

  function ilanTasi(i, yon) {
    var j = i + yon, p = ICERIK.ilanlar;
    if (j < 0 || j >= p.length) return;
    var t = p[i]; p[i] = p[j]; p[j] = t;
    ilanlariCiz(); kirlet();
  }

  $("#btnYeniIlan").addEventListener("click", function () {
    ICERIK.ilanlar.push({
      id: "i" + Date.now(), yayinda: true, tur: "Arazi", baslik: "Yeni ilan",
      konum: "", aciklama: "", alan: "", kocan: "Türk koçanlı", fiyat: "",
      rozet: "Satılık", not: "", fotolar: []
    });
    ilanlariCiz(); kirlet();
    var son = $("#ilanListe").lastElementChild;
    son.classList.add("acik"); son.querySelector(".ac-kapa").textContent = "Kapat";
    son.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ---------------- fotoğraf yükleme ---------------- */
  $("#fotoSecici").addEventListener("change", function () {
    var dosya = this.files && this.files[0]; this.value = "";
    if (!dosya || (YUKLENEN_PROJE == null && YUKLENEN_ILAN == null)) return;
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
        if (YUKLENEN_ILAN) {
          var x = ICERIK.ilanlar[YUKLENEN_ILAN.i];
          x.fotolar = x.fotolar || [];
          /* Boş slotlar arada delik bırakmasın: 3. kutuya basıp 2. boşsa
             fotoğraf 2. sıraya yerleşir. */
          while (x.fotolar.length < YUKLENEN_ILAN.slot) x.fotolar.push("");
          x.fotolar[YUKLENEN_ILAN.slot] = url;
          x.fotolar = x.fotolar.filter(Boolean);
          var acik = $('#ilanListe .proje[data-i="' + YUKLENEN_ILAN.i + '"]');
          var acikMi = acik && acik.classList.contains("acik");
          ilanlariCiz();
          if (acikMi) {
            var yeni = $('#ilanListe .proje[data-i="' + YUKLENEN_ILAN.i + '"]');
            yeni.classList.add("acik"); yeni.querySelector(".ac-kapa").textContent = "Kapat";
          }
          YUKLENEN_ILAN = null;
        } else {
          ICERIK.projeler[YUKLENEN_PROJE].foto = url;
          var kart = $('#projeListe .proje[data-i="' + YUKLENEN_PROJE + '"]');
          if (kart) kart.querySelector("img").src = url;
        }
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

    /* Yayınlamadan ÖNCEKİ hâli geçmişe al — geri dönülecek nokta bu. */
    var yeniGecmis = GECMIS.slice();
    if (SON_YAYIN) {
      try { yeniGecmis.unshift({ tarih: Date.now(), veri: JSON.parse(SON_YAYIN) }); } catch (x) {}
    }
    yeniGecmis = yeniGecmis.slice(0, 5);

    fetch(A.url + "/rest/v1/site_icerik?id=eq.1", {
      method: "PATCH",
      headers: {
        apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token,
        "Content-Type": "application/json", Prefer: "return=minimal"
      },
      body: JSON.stringify({ veri: ICERIK, gecmis: yeniGecmis })
    }).then(function (r) {
      b.textContent = "Yayınla";
      if (!r.ok) throw 0;
      KIRLI = false; b.disabled = true;
      GECMIS = yeniGecmis; SON_YAYIN = JSON.stringify(ICERIK);
      taslakSil(); gecmisCiz();
      durum('Yayınlandı. <a href="index.html" target="_blank" style="color:#2B4D41"><b>Siteyi aç →</b></a>', "#2B4D41");
    }).catch(function () {
      b.disabled = false; b.textContent = "Yayınla";
      durum("Yayınlanamadı. İnternetinizi kontrol edip tekrar deneyin.", "#A8443A");
    });
  });

  /* ---------------- şifre değiştirme ---------------- */
  $("#btnSifre").addEventListener("click", function () {
    var s1 = $("#yeniSifre").value, s2 = $("#yeniSifre2").value, d = $("#sifreDurum");
    function soyle(m, renk) { d.textContent = m; d.style.color = renk; }
    if (s1.length < 6) return soyle("Şifre en az 6 karakter olmalı.", "#A8443A");
    if (s1 !== s2) return soyle("İki şifre birbirini tutmuyor.", "#A8443A");
    var b = this; b.disabled = true; b.textContent = "Değiştiriliyor…";
    fetch(A.url + "/auth/v1/user", {
      method: "PUT",
      headers: {
        apikey: A.anahtar, Authorization: "Bearer " + OTURUM.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: s1 })
    }).then(function (r) {
      b.disabled = false; b.textContent = "Şifreyi değiştir";
      if (!r.ok) throw 0;
      $("#yeniSifre").value = ""; $("#yeniSifre2").value = "";
      soyle("Şifreniz değiştirildi. Bir dahaki girişte yenisini kullanın.", "#2B4D41");
    }).catch(function () {
      b.disabled = false; b.textContent = "Şifreyi değiştir";
      soyle("Değiştirilemedi. İnternetinizi kontrol edip tekrar deneyin.", "#A8443A");
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
