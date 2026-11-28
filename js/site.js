// ÖZTÜRK CAD sitesi. Sürüm ve indirme bilgileri yalnız surum.json'dan okunur.
(function () {
  'use strict';
  var kok = document.documentElement;

  // --- Sürüm ve indirme -------------------------------------------------------
  function boyutYaz(bayt) {
    if (!(bayt > 0)) return '';
    return (bayt / 1048576).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' MB';
  }
  function tarihYaz(iso) {
    var d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function hataGoster(metin) {
    document.querySelectorAll('[data-indir-hata]').forEach(function (el) { el.textContent = metin; el.hidden = false; });
  }
  function hataGizle() {
    document.querySelectorAll('[data-indir-hata]').forEach(function (el) { el.hidden = true; });
  }

  // Güncel sürümün notları ve önceki sürümlerin indirme listesi (yalnız GitHub Releases adresleri).
  function notListesi(ul, notlar) {
    (notlar || []).forEach(function (n) {
      if (typeof n !== 'string' || !n) return;
      var li = document.createElement('li'); li.textContent = n; ul.appendChild(li);
    });
    return ul.children.length > 0;
  }
  function guvenliAdres(u) { return typeof u === 'string' && u.indexOf('https://github.com/Night-X-dev/ozturk-cad/releases/download/') === 0; }
  function surumGecmisiKur(s) {
    var notUl = document.querySelector('[data-surum-notlari]');
    if (notUl && notListesi(notUl, s.notlar)) document.querySelector('[data-surum-notu]').hidden = false;
    var liste = document.querySelector('[data-onceki-surumler]');
    if (!liste || !Array.isArray(s.oncekiSurumler)) return;
    s.oncekiSurumler.forEach(function (o) {
      if (!o || !o.surum || !guvenliAdres(o.dosya)) return;
      var li = document.createElement('li');
      var bas = document.createElement('div'); bas.className = 'onceki-bas';
      var ad = document.createElement('b'); ad.textContent = 'Sürüm ' + o.surum; bas.appendChild(ad);
      var ek = document.createElement('span'); ek.className = 'onceki-ek';
      ek.textContent = [o.tarih ? tarihYaz(o.tarih) : '', boyutYaz(o.boyutBayt)].filter(Boolean).join(' · ');
      bas.appendChild(ek);
      var a = document.createElement('a'); a.className = 'onceki-indir'; a.href = o.dosya; a.setAttribute('download', o.dosyaAdi || '');
      a.textContent = 'İndir'; a.setAttribute('aria-label', 'ÖZTÜRK CAD ' + o.surum + ' kurulum dosyasını indir');
      bas.appendChild(a); li.appendChild(bas);
      var ul = document.createElement('ul'); if (notListesi(ul, o.notlar)) li.appendChild(ul);
      if (o.sha256) { var h = document.createElement('p'); h.className = 'onceki-ozet'; h.textContent = 'SHA-256: ' + o.sha256; li.appendChild(h); }
      liste.appendChild(li);
    });
    if (liste.children.length) document.querySelector('[data-onceki-bolum]').hidden = false;
  }

  var bilgi = null;
  fetch('surum.json', { cache: 'no-cache' })
    .then(function (y) { if (!y.ok) throw new Error(y.status); return y.json(); })
    .then(function (s) {
      if (!s || !s.dosya || !s.surum) throw new Error('eksik');
      bilgi = s;
      var degerler = {
        surum: s.surum,
        boyut: boyutYaz(s.boyutBayt),
        tarih: tarihYaz(s.tarih),
        isletimSistemi: s.isletimSistemi,
        gereksinim: s.gereksinim,
        dosyaAdi: s.dosyaAdi,
        sha256: s.sha256
      };
      document.querySelectorAll('[data-alan]').forEach(function (el) {
        var v = degerler[el.dataset.alan];
        if (v) el.textContent = v;
        if (el.dataset.alan === 'tarih' && s.tarih) el.setAttribute('datetime', s.tarih);
      });
      document.querySelectorAll('[data-indir]').forEach(function (a) {
        a.href = s.dosya;
        a.setAttribute('download', s.dosyaAdi || '');
        a.setAttribute('aria-label', 'ÖZTÜRK CAD ' + s.surum + ' kurulum dosyasını indir' + (degerler.boyut ? ', ' + degerler.boyut : ''));
      });
      if (s.kilavuz) document.querySelectorAll('[data-kilavuz]').forEach(function (a) { a.href = s.kilavuz; });
      surumGecmisiKur(s);
      if (s.eposta && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.eposta)) {
        document.querySelectorAll('[data-eposta]').forEach(function (a) { a.href = 'mailto:' + s.eposta; });
        document.querySelectorAll('[data-iletisim]').forEach(function (li) { li.hidden = false; });
        document.querySelectorAll('[data-satin-al]').forEach(function (a) {
          a.href = 'mailto:' + s.eposta + '?subject=' + encodeURIComponent('ÖZTÜRK CAD yıllık lisans');
          a.hidden = false;
        });
        document.querySelectorAll('[data-satin-al-yok]').forEach(function (el) { el.hidden = true; });
      }
      if (s.fiyat && s.fiyat.tutar > 0) {
        var tutar = s.fiyat.tutar.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ' + (s.fiyat.paraBirimi || 'USD');
        document.querySelectorAll('[data-fiyat-tutar]').forEach(function (el) { el.textContent = tutar; });
        if (s.fiyat.sureGun > 0) document.querySelectorAll('[data-fiyat-gun]').forEach(function (el) { el.textContent = s.fiyat.sureGun; });
      }
      if (s.videoListesi) videolariKur(s.videoListesi);
    })
    .catch(function () {
      document.querySelectorAll('[data-indir]').forEach(function (a) { a.setAttribute('aria-disabled', 'true'); });
      hataGoster('İndirme bilgileri şu an yüklenemedi. Sayfayı yenileyin; sorun sürerse daha sonra tekrar deneyin.');
    });


  // --- Videolar: liste yoksa ya da boşsa bölüm gizli kalır -------------------
  function sureYaz(sn) { sn = Math.round(sn || 0); return sn ? Math.floor(sn / 60) + ':' + ('0' + sn % 60).slice(-2) : ''; }
  function videoKur(v, ana) {
    var fig = document.createElement('figure');
    var vid = document.createElement('video');
    vid.controls = true; vid.preload = 'none'; vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    if (v.poster) vid.poster = v.poster;
    if (v.genislik && v.yukseklik) { vid.width = v.genislik; vid.height = v.yukseklik; }
    vid.setAttribute('aria-label', v.baslik || 'ÖZTÜRK CAD videosu');
    var kay = document.createElement('source'); kay.src = v.dosya; kay.type = 'video/mp4'; vid.appendChild(kay);
    if (v.altyazi) { var t = document.createElement('track'); t.kind = 'subtitles'; t.srclang = 'tr'; t.label = 'Türkçe'; t.src = v.altyazi; vid.appendChild(t); }
    vid.addEventListener('play', function () { document.querySelectorAll('[data-video-bolum] video').forEach(function (o) { if (o !== vid) o.pause(); }); });
    var cap = document.createElement('figcaption');
    var b = document.createElement('b'); b.textContent = v.baslik || ''; cap.appendChild(b);
    var d = document.createElement('span'); d.className = 'video-sure'; d.textContent = sureYaz(v.sure_sn); cap.appendChild(d);
    if (ana && v.aciklama) { var a = document.createElement('span'); a.className = 'video-aciklama'; a.textContent = v.aciklama; cap.appendChild(a); }
    fig.appendChild(vid); fig.appendChild(cap);
    return fig;
  }
  function videolariKur(adres) {
    fetch(adres, { cache: 'no-cache' })
      .then(function (y) { if (!y.ok) throw new Error(y.status); return y.json(); })
      .then(function (liste) {
        liste = (Array.isArray(liste) ? liste : []).filter(function (v) { return v && v.dosya; });
        if (!liste.length) return;
        var taban = new URL(adres, location.href);
        liste.forEach(function (v) {
          v.dosya = new URL(v.dosya, taban).href;
          if (v.poster) v.poster = new URL(v.poster, taban).href;
          if (v.altyazi) v.altyazi = new URL(v.altyazi, taban).href;
        });
        var ilk = liste.filter(function (v) { return v.yon !== 'dikey'; })[0] || liste[0];
        document.querySelector('[data-video-ana]').appendChild(videoKur(ilk, true));
        var ul = document.querySelector('[data-video-liste]');
        var dikeyler = liste.filter(function (v) { return v.yon === 'dikey'; });
        dikeyler.concat(liste.filter(function (v) { return v.yon !== 'dikey'; })).forEach(function (v) {
          if (v === ilk) return;
          var li = document.createElement('li'); li.className = v.yon === 'dikey' ? 'dikey' : 'yatay';
          li.appendChild(videoKur(v, false)); ul.appendChild(li);
        });
        document.querySelectorAll('[data-video-bolum], [data-video-menu]').forEach(function (el) { el.hidden = false; });
        if (window.ozcadSahneYenile) window.ozcadSahneYenile();
      })
      .catch(function () { /* video listesi yoksa bölüm gizli kalır */ });
  }

  // Aynı sunucudaki dosyayı indirmeden önce var mı diye bakar; bozuk bağlantıda anlaşılır mesaj verir.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-indir]');
    if (!a) return;
    if (!bilgi) { e.preventDefault(); hataGoster('İndirme bilgileri henüz yüklenmedi. Birkaç saniye sonra tekrar deneyin.'); return; }
    var hedef = new URL(bilgi.dosya, location.href);
    if (hedef.origin !== location.origin || location.protocol === 'file:') return;
    e.preventDefault();
    hataGizle();
    a.setAttribute('aria-busy', 'true');
    fetch(hedef.href, { method: 'HEAD', cache: 'no-store' })
      .then(function (y) {
        if (!y.ok) throw new Error(y.status);
        location.href = hedef.href;
      })
      .catch(function () {
        hataGoster('Kurulum dosyasına şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.');
      })
      .then(function () { a.removeAttribute('aria-busy'); });
  });

  // --- Ekran görüntüsü yoksa boş plaka -----------------------------------------
  document.querySelectorAll('[data-ekran]').forEach(function (img) {
    function yok() { img.closest('.plaka').classList.add('yok'); }
    if (img.complete && img.naturalWidth === 0) yok(); else img.addEventListener('error', yok);
  });

  // --- Menü ----------------------------------------------------------------
  var ust = document.querySelector('[data-ust]');
  function kaydir() { ust.classList.toggle('kaydi', window.scrollY > 8); }
  kaydir();
  window.addEventListener('scroll', kaydir, { passive: true });

  var ac = document.querySelector('[data-menu-ac]'), menu = document.querySelector('[data-menu]');
  function menuKapat() { menu.classList.remove('acik'); ac.setAttribute('aria-expanded', 'false'); }
  ac.addEventListener('click', function () {
    var acik = menu.classList.toggle('acik');
    ac.setAttribute('aria-expanded', acik ? 'true' : 'false');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) menuKapat(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menuKapat(); });

  // --- Tema -----------------------------------------------------------------
  document.querySelector('[data-tema-dugme]').addEventListener('click', function () {
    var koyuSistem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var simdiKoyu = kok.dataset.tema ? kok.dataset.tema === 'koyu' : koyuSistem;
    var yeni = simdiKoyu ? 'acik' : 'koyu';
    kok.dataset.tema = yeni;
    try { localStorage.setItem('ozcad-tema', yeni); } catch (e) { }
  });

  // --- Kaydırmayla ilerleyen sahneler ------------------------------------------
  // Her değer kaydırma konumundan hesaplanır: aşağı inince ileri, yukarı çıkınca geri.
  // Hareket azaltma tercihinde hiçbir sahne kurulmaz; sayfa düz ve tamamen görünür kalır.
  var azHareket = window.matchMedia('(prefers-reduced-motion: reduce)');
  var genis = window.matchMedia('(min-width: 900px)');
  function sinir(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function yumusak(x) { return 1 - Math.pow(1 - x, 3); }
  function yaz(el, ad, deger) {
    var v = Math.round(deger * 1000) / 1000;
    if (el['_' + ad] !== v) { el['_' + ad] = v; el.style.setProperty(ad, v); }
  }
  // Sabitlenen sahnenin ilerlemesi: sahnenin üstü ekranın üstüne değince 0, sahne bitince 1.
  function sahneIlerleme(el, vh) {
    var r = el.getBoundingClientRect(), boy = r.height - vh;
    return boy > 0 ? sinir(-r.top / boy) : (r.top < 0 ? 1 : 0);
  }
  // Ekrana giriş ilerlemesi: öğenin üstü ekranın altındayken 0, ekranın %62'sine gelince 1.
  function girisIlerleme(el, vh, oran) {
    var r = el.getBoundingClientRect();
    return sinir((vh - r.top) / (vh * (oran || 0.38)));
  }

  var giris = document.querySelector('[data-sahne="giris"]');
  var ozet = document.querySelector('[data-sahne="ozet"]');
  var hikaye = document.querySelector('[data-hikaye]');
  var adimlar = hikaye ? [].slice.call(hikaye.querySelectorAll('[data-adim]')) : [];
  var katmanKutusu = document.querySelector('[data-hikaye-katman]');
  var altYazi = document.querySelector('[data-hikaye-alt]');
  var katmanlar = [], sonAlt = -1;

  // Özet cümlesini kelimelere ayır (iç içe vurgu korunur).
  var kelimeKutusu = document.querySelector('[data-kelime]'), kelimeSayisi = 0;
  if (kelimeKutusu) {
    (function bol(dugum) {
      [].slice.call(dugum.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parca = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (k) {
            if (!k) return;
            if (/^\s+$/.test(k)) { parca.appendChild(document.createTextNode(k)); return; }
            var sp = document.createElement('span'); sp.className = 'kelime'; sp.textContent = k;
            sp.style.setProperty('--k', kelimeSayisi++); parca.appendChild(sp);
          });
          dugum.replaceChild(parca, c);
        } else if (c.nodeType === 1) bol(c);
      });
    })(kelimeKutusu);
    kelimeKutusu.style.setProperty('--n', kelimeSayisi);
  }

  // Özellik sahnesi: her adımın ekran görüntüsü sabit sahnede üst üste durur.
  if (katmanKutusu) {
    adimlar.forEach(function (a) {
      var img = a.querySelector('img'), kat = document.createElement('div');
      kat.className = 'hikaye-katman';
      if (img) {
        var k = document.createElement('img');
        k.src = img.getAttribute('src'); k.srcset = img.getAttribute('srcset') || ''; k.sizes = '(min-width: 900px) 58vw, 100vw';
        k.alt = ''; k.width = 2560; k.height = 1600; k.decoding = 'async'; k.loading = 'lazy';
        k.addEventListener('error', function () { kat.classList.add('yok'); });
        kat.appendChild(k);
      }
      katmanKutusu.appendChild(kat);
      var cap = a.querySelector('figcaption');
      katmanlar.push({ el: kat, alt: cap ? cap.textContent : '' });
    });
  }

  var gostergeler = [], buyuyenler = [], egimler = [];
  function listele() {
    gostergeler = [].slice.call(document.querySelectorAll('[data-goster]'));
    buyuyenler = [].slice.call(document.querySelectorAll('[data-buyu]'));
    egimler = [].slice.call(document.querySelectorAll('[data-egim]'));
  }

  var bekliyor = false, acik = false;
  function guncelle() {
    bekliyor = false;
    if (!acik) return;
    var vh = window.innerHeight;
    if (giris) {
      var p = sahneIlerleme(giris, vh);
      yaz(giris, '--p', p);
      yaz(giris, '--a', yumusak(sinir(p / 0.42)));
      yaz(giris, '--b', yumusak(sinir((p - 0.14) / 0.6)));
      yaz(giris, '--c', yumusak(sinir((p - 0.74) / 0.2)));
      giris.classList.toggle('gecti', p > 0.3);
    }
    if (ozet) yaz(ozet, '--p', sinir(sahneIlerleme(ozet, vh) * 1.18));
    if (hikaye && katmanlar.length && genis.matches) {
      var r = hikaye.getBoundingClientRect();
      var konum = sinir((vh * 0.5 - r.top) / r.height) * adimlar.length - 0.5;
      konum = Math.max(0, Math.min(adimlar.length - 1, konum));
      katmanlar.forEach(function (k, i) {
        var d = konum - i, m = Math.abs(d);
        yaz(k.el, '--o', sinir(1 - m * 1.7));
        yaz(k.el, '--d', Math.max(-1.2, Math.min(1.2, d)));
      });
      var yakin = Math.round(konum);
      if (yakin !== sonAlt && altYazi) { sonAlt = yakin; altYazi.textContent = katmanlar[yakin].alt; }
      adimlar.forEach(function (a, i) { var m = a.querySelector('.kalem-metin'); if (m) yaz(m, '--g', sinir(1 - Math.abs(konum - i) * 1.25)); });
    } else {
      adimlar.forEach(function (a) {
        var m = a.querySelector('.kalem-metin'), f = a.querySelector('.plaka');
        if (m) yaz(m, '--g', yumusak(girisIlerleme(m, vh)));
        if (f) yaz(f, '--g', yumusak(girisIlerleme(f, vh, 0.5)));
      });
    }
    gostergeler.forEach(function (el) { yaz(el, '--g', yumusak(girisIlerleme(el, vh))); });
    buyuyenler.forEach(function (el) { yaz(el, '--v', yumusak(girisIlerleme(el, vh, 0.75))); });
    egimler.forEach(function (el) { yaz(el, '--v', yumusak(girisIlerleme(el, vh, 0.7))); });
  }
  function iste() { if (!bekliyor) { bekliyor = true; window.requestAnimationFrame(guncelle); } }

  function kur() {
    acik = !azHareket.matches;
    kok.classList.toggle('sinema', acik);
    listele();
    if (acik) guncelle();
  }
  kur();
  window.addEventListener('scroll', iste, { passive: true });
  window.addEventListener('resize', iste);
  [azHareket, genis].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', kur); else if (m.addListener) m.addListener(kur);
  });
  // Videolar sonradan eklenince onları da sahneye kat.
  window.ozcadSahneYenile = function () { listele(); iste(); };
})();
