/**
 * Luồng mở đầu + menu + đăng nhập API (cùng origin). Khách trên http:// nhận JWT và gửi điểm; file:// chỉ chơi local.
 */
/* global THREE */

(function () {
  var STORAGE_GUEST_NAMES = 'gpa_destroyer_used_names';
  var SESSION_PLAYER = 'gpa_current_player';
  var TOKEN_KEY = 'gpa_access_token';
  var LAUNCHER_FOLLOWUP_KEY = 'gpa_launcher_followup';
  var AUTH_MODE_KEY = 'gpa_auth_mode';
  var STORAGE_MENU_BGM_VOLUME = 'gpa_menu_bgm_volume';
  var STORAGE_MENU_BGM_MUTED = 'gpa_menu_bgm_muted';

  function getMenuBgmVolume01() {
    try {
      var v = parseFloat(localStorage.getItem(STORAGE_MENU_BGM_VOLUME));
      if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
    } catch (_) {}
    return 0.45;
  }

  function setMenuBgmVolume01(v) {
    var x = Math.max(0, Math.min(1, Number(v) || 0));
    try {
      localStorage.setItem(STORAGE_MENU_BGM_VOLUME, String(x));
    } catch (_) {}
  }

  function isMenuBgmMuted() {
    try {
      return localStorage.getItem(STORAGE_MENU_BGM_MUTED) === '1';
    } catch (_) {}
    return false;
  }

  function setMenuBgmMuted(m) {
    try {
      if (m) localStorage.setItem(STORAGE_MENU_BGM_MUTED, '1');
      else localStorage.removeItem(STORAGE_MENU_BGM_MUTED);
    } catch (_) {}
  }

  function applyMenuBgmToAudio() {
    var el = document.getElementById('menu-bgm');
    if (!el) return;
    el.volume = getMenuBgmVolume01();
    el.muted = isMenuBgmMuted();
    if (!el.muted && el.volume > 0) {
      el.play().catch(function () {});
    }
  }

  function syncSettingAudioUi() {
    var toggle = document.getElementById('setting-bgm-toggle');
    var range = document.getElementById('setting-bgm-volume');
    var pct = document.getElementById('setting-bgm-pct');
    if (!toggle || !range || !pct) return;
    var vol = getMenuBgmVolume01();
    var muted = isMenuBgmMuted();
    var pctInt = Math.round(vol * 100);
    toggle.setAttribute('aria-checked', muted ? 'false' : 'true');
    range.value = String(pctInt);
    pct.textContent = pctInt + '%';
  }

  function canUseApi() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }

  function apiPath(path) {
    var base = typeof window.GPA_API_BASE === 'string' ? window.GPA_API_BASE : '';
    return base + path;
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setSessionUser(token, username, mode) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.setItem(SESSION_PLAYER, username);
    sessionStorage.setItem(AUTH_MODE_KEY, mode || 'guest');
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_PLAYER);
    sessionStorage.removeItem(AUTH_MODE_KEY);
  }

  function getAuthMode() {
    return sessionStorage.getItem(AUTH_MODE_KEY) || 'guest';
  }

  function getDisplayName() {
    return sessionStorage.getItem(SESSION_PLAYER) || '';
  }

  var stages = {
    loading: document.getElementById('stage-loading'),
    name: document.getElementById('stage-name'),
    letter: document.getElementById('stage-letter'),
    menu: document.getElementById('stage-menu'),
    playJourney: document.getElementById('stage-play-journey'),
  };

  function showStage(id) {
    Object.keys(stages).forEach(function (k) {
      stages[k].classList.remove('active');
    });
    stages[id].classList.add('active');
  }

  function setPlayJourneyDirection(homeToSchool) {
    var caption = document.querySelector('.play-journey-caption');
    var icons = document.querySelector('.play-progress-icons');
    if (caption) {
      caption.textContent = homeToSchool ? 'Nhà → Trường' : 'Trường → Nhà';
    }
    if (icons) {
      icons.innerHTML = homeToSchool
        ? '<img src="assets/2D/iconofhouse.png" alt="" /><img src="assets/2D/iconofchar2.png" alt="" /><img src="assets/2D/iconofschool.png" alt="" />'
        : '<img src="assets/2D/iconofschool.png" alt="" /><img src="assets/2D/iconofchar2.png" alt="" /><img src="assets/2D/iconofhouse.png" alt="" />';
    }
  }

  function getUsedGuestNames() {
    try {
      var raw = localStorage.getItem(STORAGE_GUEST_NAMES);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function normalizeName(s) {
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function isGuestNameTaken(name) {
    var key = normalizeName(name);
    if (!key) return true;
    return getUsedGuestNames().some(function (n) {
      return normalizeName(n) === key;
    });
  }

  function commitGuestName(displayName) {
    var list = getUsedGuestNames();
    var key = normalizeName(displayName);
    if (!list.some(function (n) {
      return normalizeName(n) === key;
    })) {
      list.push(displayName.trim());
      localStorage.setItem(STORAGE_GUEST_NAMES, JSON.stringify(list));
    }
    var tok = sessionStorage.getItem(TOKEN_KEY);
    setSessionUser(tok, displayName.trim(), 'guest');
  }

  function showNameError(msg) {
    var err = document.getElementById('name-error');
    err.textContent = msg || '';
    err.hidden = !msg;
  }

  function runLoading() {
    var fill = document.getElementById('loading-bar-fill');
    var pctEl = document.getElementById('loading-pct');
    var duration = 3000 + Math.random() * 2000;
    var start = performance.now();

    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var pct = Math.round(t * 100);
      fill.style.width = pct + '%';
      pctEl.textContent = pct + '%';
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        showStage('name');
        focusFirstAuthField();
      }
    }
    requestAnimationFrame(tick);
  }

  function focusFirstAuthField() {
    var el = document.getElementById('login-username');
    if (el && !el.closest('.is-hidden') && !el.closest('[hidden]')) {
      el.focus();
      return;
    }
    var g = document.getElementById('guest-display-name');
    if (g) g.focus();
  }

  var pendingDisplayName = '';

  function goToLetter(name) {
    pendingDisplayName = name;
    showStage('letter');
    startLetterSequence();
  }

  function setupAuthStage() {
    var serverWrap = document.getElementById('auth-server-wrap');
    var guestWrap = document.getElementById('auth-guest-wrap');
    var tabLogin = document.getElementById('tab-login');
    var tabRegister = document.getElementById('tab-register');
    var panelLogin = document.getElementById('panel-login');
    var panelRegister = document.getElementById('panel-register');

    function showLoginTab() {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabRegister.setAttribute('aria-selected', 'false');
      panelLogin.classList.remove('is-hidden');
      panelLogin.hidden = false;
      panelRegister.classList.add('is-hidden');
      panelRegister.hidden = true;
    }

    function showRegisterTab() {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabLogin.setAttribute('aria-selected', 'false');
      panelRegister.classList.remove('is-hidden');
      panelRegister.hidden = false;
      panelLogin.classList.add('is-hidden');
      panelLogin.hidden = true;
    }

    if (!canUseApi()) {
      serverWrap.classList.add('is-hidden');
      serverWrap.hidden = true;
      guestWrap.classList.remove('is-hidden');
      guestWrap.hidden = false;
    } else {
      serverWrap.classList.remove('is-hidden');
      serverWrap.hidden = false;
      guestWrap.classList.add('is-hidden');
      guestWrap.hidden = true;
      showLoginTab();
    }

    tabLogin.addEventListener('click', showLoginTab);
    tabRegister.addEventListener('click', showRegisterTab);

    function refreshGuestCardDesc() {
      var el = document.getElementById('guest-card-desc');
      if (!el) return;
      if (canUseApi()) {
        el.innerHTML =
          'Nhập tên hiển thị để vào game. Trên <strong>http://</strong> (ví dụ <code class="inline-code">http://localhost:3333</code>), điểm của bạn <strong>sẽ được gửi</strong> lên bảng xếp hạng với tên này. Đăng ký tài khoản nếu muốn giữ tên cố định trên nhiều máy.';
      } else {
        el.innerHTML =
          'Nhập tên hiển thị để vào game. Bạn đang mở file trực tiếp (<code class="inline-code">file://</code>) — điểm <strong>không</strong> lưu server. Chạy <code class="inline-code">npm start</code> trong thư mục <code class="inline-code">server</code> rồi mở <code class="inline-code">http://localhost:3333</code>.';
      }
    }
    refreshGuestCardDesc();

    document.getElementById('btn-show-guest').addEventListener('click', function () {
      if (!canUseApi()) return;
      serverWrap.classList.add('is-hidden');
      serverWrap.hidden = true;
      guestWrap.classList.remove('is-hidden');
      guestWrap.hidden = false;
      refreshGuestCardDesc();
      showNameError('');
      document.getElementById('guest-display-name').focus();
    });

    document.getElementById('btn-back-to-login').addEventListener('click', function () {
      if (!canUseApi()) {
        showNameError('Chế độ khách: mở qua http://localhost (npm start) nếu muốn đăng nhập.');
        return;
      }
      guestWrap.classList.add('is-hidden');
      guestWrap.hidden = true;
      serverWrap.classList.remove('is-hidden');
      serverWrap.hidden = false;
      showLoginTab();
      showNameError('');
      document.getElementById('login-username').focus();
    });

    document.getElementById('btn-login').addEventListener('click', function () {
      showNameError('');
      if (!canUseApi()) {
        showNameError('Đăng nhập cần mở qua server: trong thư mục server chạy npm start, rồi vào http://localhost:3333 (không mở file .html trực tiếp).');
        return;
      }
      var u = document.getElementById('login-username').value.trim();
      var p = document.getElementById('login-password').value;
      if (!u || !p) {
        showNameError('Nhập đủ tên đăng nhập và mật khẩu.');
        return;
      }
      fetch(apiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, body: j };
          });
        })
        .then(function (_ref) {
          var ok = _ref.ok;
          var body = _ref.body;
          if (!ok) throw new Error(body.error || 'Đăng nhập thất bại');
          setSessionUser(body.token, body.user.username, 'user');
          goToLetter(body.user.username);
        })
        .catch(function (e) {
          showNameError(e.message || 'Lỗi mạng');
        });
    });

    document.getElementById('btn-register').addEventListener('click', function () {
      showNameError('');
      if (!canUseApi()) {
        showNameError('Đăng ký cần mở qua server: trong thư mục server chạy npm start, rồi vào http://localhost:3333 (không mở file .html trực tiếp).');
        return;
      }
      var u = document.getElementById('reg-username').value.trim();
      var p = document.getElementById('reg-password').value;
      var p2 = document.getElementById('reg-password2').value;
      if (!u || !p) {
        showNameError('Nhập đủ thông tin đăng ký.');
        return;
      }
      if (p !== p2) {
        showNameError('Mật khẩu không khớp.');
        return;
      }
      fetch(apiPath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, body: j };
          });
        })
        .then(function (_ref2) {
          var ok = _ref2.ok;
          var body = _ref2.body;
          if (!ok) throw new Error(body.error || 'Đăng ký thất bại');
          setSessionUser(body.token, body.user.username, 'user');
          goToLetter(body.user.username);
        })
        .catch(function (e) {
          showNameError(e.message || 'Lỗi mạng');
        });
    });

    document.getElementById('login-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-login').click();
    });
    document.getElementById('reg-password2').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-register').click();
    });
    document.getElementById('guest-display-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('btn-guest-continue').click();
    });

    document.getElementById('btn-guest-continue').addEventListener('click', function () {
      showNameError('');
      var raw = document.getElementById('guest-display-name').value.trim();
      if (!raw) {
        showNameError('Vui lòng nhập tên hiển thị.');
        return;
      }
      if (isGuestNameTaken(raw)) {
        showNameError('Tên đã được dùng. Vui lòng chọn tên khác.');
        return;
      }
      if (canUseApi()) {
        fetch(apiPath('/api/auth/guest'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: raw }),
        })
          .then(function (r) {
            return r.json().then(function (j) {
              return { ok: r.ok, body: j };
            });
          })
          .then(function (ref) {
            if (!ref.ok) throw new Error(ref.body.error || 'Không tạo phiên khách');
            var dn = ref.body.user && ref.body.user.displayName ? ref.body.user.displayName : raw;
            setSessionUser(ref.body.token, dn, 'guest');
            goToLetter(dn);
          })
          .catch(function (e) {
            showNameError(e.message || 'Không kết nối server. Trong thư mục server chạy npm start, rồi vào http://localhost:3333.');
          });
      } else {
        setSessionUser(null, raw, 'guest');
        goToLetter(raw);
      }
    });
  }

  function startLetterSequence() {
    var wrap = document.getElementById('letter-wrap');
    var recipient = document.getElementById('letter-recipient');
    var after = document.getElementById('letter-after');
    var btnContinue = document.getElementById('btn-letter-continue');

    if (recipient) {
      recipient.textContent = pendingDisplayName ? pendingDisplayName.trim() : '';
    }

    after.hidden = true;
    wrap.classList.remove('visible');
    void wrap.offsetWidth;
    wrap.classList.add('visible');

    function onAnimEnd() {
      after.hidden = false;
    }
    wrap.addEventListener('animationend', onAnimEnd, { once: true });

    var fallback = setTimeout(function () {
      after.hidden = false;
    }, 1600);

    btnContinue.onclick = function () {
      clearTimeout(fallback);
      if (getAuthMode() === 'guest') {
        commitGuestName(pendingDisplayName);
      } else {
        sessionStorage.setItem(SESSION_PLAYER, pendingDisplayName.trim());
      }
      showStage('menu');
      updateMenuUserPill();
      initMenuStage();
    };
  }

  function updateMenuUserPill() {
    var pill = document.getElementById('menu-user-pill');
    var label = document.getElementById('menu-user-label');
    var name = getDisplayName();
    if (!name) {
      pill.hidden = true;
      return;
    }
    pill.hidden = false;
    label.textContent = getAuthMode() === 'guest' ? name + ' (Khách)' : name;
  }

  var menuInited = false;
  var menuAnimationId = null;
  var menuScene = null;
  var menuCamera = null;
  var menuRenderer = null;
  var menuControls = null;
  var menuCharacter = null;
  var menuMixer = null;
  var menuClock = new THREE.Clock();

  function disposeMenuThree() {
    if (menuAnimationId) {
      cancelAnimationFrame(menuAnimationId);
      menuAnimationId = null;
    }
    if (menuControls) {
      menuControls.dispose();
      menuControls = null;
    }
    if (menuRenderer) {
      menuRenderer.dispose();
      menuRenderer = null;
    }
    menuScene = null;
    menuCamera = null;
    menuCharacter = null;
    menuMixer = null;
    menuInited = false;
  }

  function initMenuStage() {
    if (typeof THREE === 'undefined') {
      console.warn('THREE không có — bỏ qua mô hình 3D menu.');
      return;
    }
    var bgm = document.getElementById('menu-bgm');
    if (bgm) applyMenuBgmToAudio();

    document.getElementById('menu-tutorial').hidden = false;
    document.getElementById('play-progress').hidden = true;

    if (menuInited) return;
    menuInited = true;

    var canvas = document.getElementById('menu-canvas');
    function rect() {
      return canvas.getBoundingClientRect();
    }

    menuScene = new THREE.Scene();
    menuCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    menuCamera.position.set(0, 1.35, 3.2);

    menuRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    menuRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (menuRenderer.outputEncoding !== undefined) {
      menuRenderer.outputEncoding = THREE.sRGBEncoding;
    }
    menuRenderer.setClearColor(0x000000, 0);

    var hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 0.9);
    menuScene.add(hemi);
    var dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(3, 6, 4);
    menuScene.add(dir);

    var LoaderCtor = THREE.GLTFLoader;
    if (!LoaderCtor) {
      console.error('THREE.GLTFLoader không có');
      return;
    }
    var loader = new LoaderCtor();
    loader.load(
      'assets/models/vaytay.glb',
      function (gltf) {
        menuCharacter = gltf.scene;
        // Animation
        if (gltf.animations && gltf.animations.length > 0) {
          menuMixer = new THREE.AnimationMixer(menuCharacter);
          var clip = gltf.animations[0];
          var action = menuMixer.clipAction(clip);
          action.play();
        }
        var box = new THREE.Box3().setFromObject(menuCharacter);
        var size = new THREE.Vector3();
        box.getSize(size);
        var maxDim = Math.max(size.x, size.y, size.z) || 1;
        var scale = 1.6 / maxDim;
        menuCharacter.scale.setScalar(scale);
        box.setFromObject(menuCharacter);
        var center = new THREE.Vector3();
        box.getCenter(center);
        menuCharacter.position.x -= center.x;
        menuCharacter.position.z -= center.z;
        menuCharacter.position.y -= box.min.y;
        menuScene.add(menuCharacter);

        box.setFromObject(menuCharacter);
        var torsoY = box.min.y + (box.max.y - box.min.y) * 0.55;
        menuControls = new THREE.OrbitControls(menuCamera, menuRenderer.domElement);
        menuControls.target.set(0, torsoY, 0);
        menuControls.enableDamping = true;
        menuControls.dampingFactor = 0.06;
        menuControls.minPolarAngle = Math.PI / 2.15;
        menuControls.maxPolarAngle = Math.PI / 2.15;
        menuControls.minAzimuthAngle = -Infinity;
        menuControls.maxAzimuthAngle = Infinity;
        menuControls.enablePan = false;
        menuControls.minDistance = 2.2;
        menuControls.maxDistance = 5;
        menuControls.update();
      },
      undefined,
      function (e) {
        console.error('GLB menu:', e);
      }
    );

    function resize() {
      var r = rect();
      var w = Math.max(1, r.width);
      var h = Math.max(1, r.height);
      menuCamera.aspect = w / h;
      menuCamera.updateProjectionMatrix();
      menuRenderer.setSize(w, h, false);
    }

    resize();
    window.addEventListener('resize', resize);

    function loop() {
      menuAnimationId = requestAnimationFrame(loop);

      var delta = menuClock.getDelta();

      if (menuMixer) {
        menuMixer.update(delta);
      }

      if (menuControls) menuControls.update();

      if (menuRenderer && menuScene && menuCamera) {
        menuRenderer.render(menuScene, menuCamera);
      }
    }
//4. Đổi file model
    menuAnimationId = requestAnimationFrame(loop);
  }

  var COMBINED_LEADERBOARD_ID = 'combined';

  function renderRankEntries(entries) {
    var list = document.getElementById('rank-list');
    var empty = document.getElementById('rank-empty');
    list.innerHTML = '';
    if (!entries || !entries.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    entries.forEach(function (row, i) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="rank-pos">#' +
        (i + 1) +
        '</span><span class="rank-name"></span><span class="rank-score"></span>';
      li.querySelector('.rank-name').textContent = row.username;
      var sc = li.querySelector('.rank-score');
      sc.textContent = String(row.score);
      sc.setAttribute('title', 'Tổng: ĐKTC + Deadline/Jerry');
      list.appendChild(li);
    });
  }

  function loadLeaderboard(gameId) {
    var loading = document.getElementById('rank-loading');
    var offline = document.getElementById('rank-offline');
    var empty = document.getElementById('rank-empty');
    offline.hidden = true;
    empty.hidden = true;
    if (!canUseApi()) {
      offline.hidden = false;
      document.getElementById('rank-list').innerHTML = '';
      return;
    }
    loading.hidden = false;
    fetch(apiPath('/api/leaderboards/' + encodeURIComponent(gameId) + '?limit=20'))
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        loading.hidden = true;
        renderRankEntries(data.entries || []);
      })
      .catch(function () {
        loading.hidden = true;
        offline.hidden = false;
        document.getElementById('rank-list').innerHTML = '';
      });
  }

  function openRankModal() {
    var modal = document.getElementById('menu-rank-modal');
    if (!modal) return;
    modal.hidden = false;
    loadLeaderboard(COMBINED_LEADERBOARD_ID);
  }

  function queuePostGame2Followup(data) {
    data = data || {};
    function showRankIfNeeded() {
      if (data.showRank) openRankModal();
    }
    if (data.scholarship) {
      var wrap = document.getElementById('menu-scholarship-modal');
      var btn = document.getElementById('btn-scholarship-continue');
      var sfx = document.getElementById('scholarship-sfx');
      if (wrap && btn) {
        wrap.hidden = false;
        if (sfx) {
          try {
            sfx.currentTime = 0;
            sfx.play().catch(function () {});
          } catch (e) {}
        }
        btn.onclick = function () {
          wrap.hidden = true;
          if (sfx) {
            try {
              sfx.pause();
            } catch (e2) {}
          }
          btn.onclick = null;
          showRankIfNeeded();
        };
        return;
      }
    }
    showRankIfNeeded();
  }

  function tryConsumePostGame2Return() {
    var raw;
    try {
      raw = sessionStorage.getItem(LAUNCHER_FOLLOWUP_KEY);
    } catch (e) {
      return false;
    }
    if (!raw) return false;
    var name = getDisplayName();
    var token = getToken();
    if (!name && !token) {
      try {
        sessionStorage.removeItem(LAUNCHER_FOLLOWUP_KEY);
      } catch (e0) {}
      return false;
    }
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e2) {
      try {
        sessionStorage.removeItem(LAUNCHER_FOLLOWUP_KEY);
      } catch (e3) {}
      return false;
    }
    try {
      sessionStorage.removeItem(LAUNCHER_FOLLOWUP_KEY);
    } catch (e4) {}
    showStage('menu');
    updateMenuUserPill();
    initMenuStage();
    var tutorial = document.getElementById('menu-tutorial');
    if (tutorial) tutorial.hidden = true;
    var bgm = document.getElementById('menu-bgm');
    if (bgm) applyMenuBgmToAudio();
    queuePostGame2Followup(data);
    return true;
  }

  function setupMenuUi() {
    var tutorial = document.getElementById('menu-tutorial');
    var playBusy = false;

    document.getElementById('btn-tutorial-agree').addEventListener('click', function () {
      tutorial.hidden = true;
    });

    document.querySelectorAll('.modal-close').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-close');
        if (id === 'rank') document.getElementById('menu-rank-modal').hidden = true;
        if (id === 'setting') document.getElementById('menu-setting-modal').hidden = true;
      });
    });

    document.getElementById('btn-rank').addEventListener('click', function () {
      openRankModal();
    });

    document.getElementById('btn-setting').addEventListener('click', function () {
      document.getElementById('menu-setting-modal').hidden = false;
      syncSettingAudioUi();
    });

    var bgmToggle = document.getElementById('setting-bgm-toggle');
    var bgmRange = document.getElementById('setting-bgm-volume');
    if (bgmToggle) {
      bgmToggle.addEventListener('click', function () {
        setMenuBgmMuted(!isMenuBgmMuted());
        applyMenuBgmToAudio();
        syncSettingAudioUi();
      });
    }
    if (bgmRange) {
      bgmRange.addEventListener('input', function () {
        var p = Number(bgmRange.value);
        if (!Number.isFinite(p)) return;
        setMenuBgmVolume01(p / 100);
        applyMenuBgmToAudio();
        var pctEl = document.getElementById('setting-bgm-pct');
        if (pctEl) pctEl.textContent = Math.round(p) + '%';
      });
    }

    syncSettingAudioUi();
    document.getElementById('btn-logout').addEventListener('click', function () {
      var token = getToken();
      function backToAuth() {
        disposeMenuThree();
        clearSession();
        document.getElementById('menu-setting-modal').hidden = true;
        showStage('name');
        if (canUseApi()) {
          document.getElementById('auth-server-wrap').classList.remove('is-hidden');
          document.getElementById('auth-server-wrap').hidden = false;
          document.getElementById('auth-guest-wrap').classList.add('is-hidden');
          document.getElementById('auth-guest-wrap').hidden = true;
        }
        showNameError('');
        focusFirstAuthField();
      }
      if (token && canUseApi()) {
        fetch(apiPath('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        }).finally(backToAuth);
      } else {
        backToAuth();
      }
    });

    document.getElementById('btn-play').addEventListener('click', function () {
      if (playBusy) return;
      playBusy = true;
      var bgm = document.getElementById('menu-bgm');
      if (bgm) bgm.pause();
      var isReturning = false;
      try {
        if (sessionStorage.getItem('gpa_returned_to_menu') === '1') {
          sessionStorage.removeItem('gpa_returned_to_menu');
          isReturning = true;
        }
      } catch (e) {}
      setPlayJourneyDirection(false);
      showStage('playJourney');
      var bar = document.getElementById('play-progress');
      var fill = document.getElementById('play-progress-fill');
      bar.hidden = false;
      fill.style.width = '0%';
      var duration = 2800;
      var t0 = performance.now();
      function step(now) {
        var t = Math.min(1, (now - t0) / duration);
        fill.style.width = Math.round(t * 100) + '%';
        if (t < 1) requestAnimationFrame(step);
        else {
          try {
            sessionStorage.setItem('gpa_door_intro', '1');
          } catch (e) {}
          window.location.href = 'src/game2_2/index.html';
        }
      }
      requestAnimationFrame(step);
    });
  }

  setupAuthStage();
  setupMenuUi();

  if (typeof THREE === 'undefined') {
    var pctEl = document.getElementById('loading-pct');
    if (pctEl) {
      pctEl.textContent = 'Cảnh báo: không tải Three.js — menu 3D tắt. Vẫn chơi khách/đăng nhập qua http:// nếu cần.';
    }
  }

  function runReverseJourney() {
    setPlayJourneyDirection(true);
    showStage('playJourney');
    var bar = document.getElementById('play-progress');
    var fill = document.getElementById('play-progress-fill');
    bar.hidden = false;
    fill.style.width = '0%';
    var duration = 2800;
    var t0 = performance.now();
    function step(now) {
      var t = Math.min(1, (now - t0) / duration);
      fill.style.width = Math.round(t * 100) + '%';
      if (t < 1) requestAnimationFrame(step);
      else {
        bar.hidden = true;
        fill.style.width = '0%';
        showStage('menu');
        updateMenuUserPill();
        initMenuStage();
        try {
          sessionStorage.setItem('gpa_returned_to_menu', '1');
        } catch (e) {}
      }
    }
    requestAnimationFrame(step);
  }

  if (!tryConsumePostGame2Return()) {
    try {
      if (sessionStorage.getItem('gpa_home_to_menu') === '1') {
        sessionStorage.removeItem('gpa_home_to_menu');
        runReverseJourney();
        return;
      }
    } catch (_) {}
    runLoading();
  }
})();
