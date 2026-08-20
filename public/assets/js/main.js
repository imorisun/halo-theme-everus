/* ========== EverUs Theme JS for Halo ========== */

/* ---------  瞬间 upvote 本地状态  --------- */
var UPVOTE_STORAGE_KEY = 'halo.upvoted.moment.names';

function getUpvotedNames() {
  try {
    return JSON.parse(localStorage.getItem(UPVOTE_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function isMomentUpvoted(name) {
  return getUpvotedNames().indexOf(name) !== -1;
}

function handleMomentUpvote(btn, name) {
  if (isMomentUpvoted(name)) return;

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/apis/api.halo.run/v1alpha1/trackers/upvote');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function () {
    if (xhr.status < 200 || xhr.status >= 300) return;
    var names = getUpvotedNames();
    names.push(name);
    localStorage.setItem(UPVOTE_STORAGE_KEY, JSON.stringify(names));

    // Update all count displays for this moment
    var spans = document.querySelectorAll('[data-upvote-moment-name="' + name + '"]');
    spans.forEach(function (span) {
      var count = parseInt(span.textContent || '0');
      span.textContent = (count + 1) + '';
    });

    // Mark all like buttons for this moment as liked
    markMomentLiked(name);
  };

  xhr.onerror = function () {
    console.error('点赞失败，请稍后再试');
  };

  xhr.send(JSON.stringify({
    group: 'moment.halo.run',
    plural: 'moments',
    name: name
  }));
}

// Mark already-upvoted moments as liked on page load
function markMomentLiked(name) {
  document.querySelectorAll('[data-upvote-moment-name="' + name + '"]').forEach(function (span) {
    var btn = span.closest('.home-moment__action--like, .moment-card__action--like');
    if (btn) {
      btn.style.color = '#e53e3e';
      btn.classList.add('is-liked');
    }
  });
}

function initMomentUpvotes() {
  var names = getUpvotedNames();
  names.forEach(function (name) {
    markMomentLiked(name);
  });
}

/* ---------  瞬间评论切换  --------- */
function toggleMomentComments(name) {
  var el = document.getElementById('moment-comments-' + name);
  if (!el) return;
  el.classList.toggle('is-expanded');
}

/* ==========  音乐播放器初始化  ========== */
var _everusPlayer = null;

function _everusParsePlaylist(text) {
  var songs = [];
  if (!text || !text.trim()) return songs;
  var lines = text.trim().split('\n');
  lines.forEach(function (line) {
    line = line.trim();
    if (!line) return;
    var parts = line.split('|');
    if (parts.length >= 3) {
      var name = (parts[0] || '').trim();
      var artist = (parts[1] || '').trim();
      var url = (parts[2] || '').trim();
      var cover = (parts[3] || '').trim();
      if (name && url) {
        songs.push({ name: name, artist: artist, url: url, cover: cover, lrc: '' });
      }
    }
  });
  return songs;
}

function _everusFetchPlatform(srv, id, cb) {
  var api = 'https://api.i-meto.com/meting/api?server=' + srv + '&type=playlist&id=' + id + '&r=' + Math.random();
  fetch(api)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var songs = [];
      if (data && data.length) {
        songs = data.map(function (s) {
          return {
            name: s.title || 'Unknown',
            artist: s.author || 'Unknown',
            url: s.url || '',
            cover: s.pic || '',
            lrc: s.lrc || ''
          };
        });
      }
      cb(songs);
    })
    .catch(function (e) {
      console.warn('Playlist fetch failed:', e);
      cb([]);
    });
}

function _everusCreatePlayer(songs) {
  var container = document.getElementById('aplayer-container');
  if (!container || !songs.length) return;
  if (typeof APlayer === 'undefined') return;

  if (_everusPlayer) {
    try { _everusPlayer.destroy(); } catch (e) {}
    _everusPlayer = null;
  }

  _everusPlayer = new APlayer({
    container: container,
    audio: songs,
    mutex: true,
    lrcType: 3,
    storageName: 'halo-everus',
    listFolded: true,
    listMaxHeight: '200px'
  });

  _everusPlayer.on('listswitch', function (index) {
    _everusUpdateActive(index);
  });

  _everusBuildPanel(songs);

  // 将歌单按钮移入 APlayer 控制栏的 .aplayer-time，放在循环按钮右边
  var toggle = document.querySelector('.playlist-toggle');
  if (toggle) {
    var timeEl = container.querySelector('.aplayer-time');
    if (timeEl) {
      var loopIcon = timeEl.querySelector('.aplayer-icon-loop');
      if (loopIcon) {
        loopIcon.insertAdjacentElement('afterend', toggle);
      } else {
        timeEl.appendChild(toggle);
      }
    }
  }

  // 移动端：启动自定义歌词显示同步
  _everusInitMobileLrc(container);

  // 将自定义歌词移入 #aplayer-container，使其以固定 41px 容器为定位参考
  var lrcDisplay = document.querySelector('.mobile-lrc-display');
  if (lrcDisplay && container && lrcDisplay.parentElement !== container) {
    container.appendChild(lrcDisplay);
  }
}

function _everusBuildPanel(songs) {
  var list = document.querySelector('.playlist-panel__list');
  if (!list) return;
  list.innerHTML = '';

  songs.forEach(function (song, i) {
    var li = document.createElement('li');
    li.className = 'playlist-panel__song';
    li.setAttribute('data-index', i);
    li.innerHTML =
      '<span class="playlist-panel__song-index">' + (i + 1) + '</span>' +
      '<span class="playlist-panel__song-info">' +
        '<div class="playlist-panel__song-name">' + _everusEscape(song.name) + '</div>' +
        '<div class="playlist-panel__song-artist">' + _everusEscape(song.artist) + '</div>' +
      '</span>';

    li.addEventListener('click', function () {
      if (_everusPlayer) {
        _everusPlayer.list.switch(i);
        _everusPlayer.play();
        _everusUpdateActive(i);
      }
    });

    list.appendChild(li);
  });
}

function _everusUpdateActive(index) {
  document.querySelectorAll('.playlist-panel__song').forEach(function (el) {
    el.classList.remove('is-active');
  });
  var el = document.querySelector('.playlist-panel__song[data-index="' + index + '"]');
  if (el) {
    el.classList.add('is-active');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function _everusEscape(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* 移动端自定义歌词显示：监听 APlayer 原生歌词 DOM 变化，同步到独立显示元素 */
function _everusInitMobileLrc(container) {
  var display = document.querySelector('.mobile-lrc-text');
  if (!display) return;

  // 等待 APlayer 渲染出 .aplayer-lrc-contents（异步创建，需要延迟获取）
  var tryInit = function (retries) {
    retries = retries || 0;
    var lrcContents = container.querySelector('.aplayer-lrc .aplayer-lrc-contents');
    if (!lrcContents) {
      if (retries < 20) {
        setTimeout(function () { tryInit(retries + 1); }, 300);
      }
      return;
    }

    // 定时轮询当前歌词行（确保兼容性）
    var lastText = '';
    var syncLrc = function () {
      var current = lrcContents.querySelector('.aplayer-lrc-current');
      if (current) {
        var text = current.textContent.trim();
        if (text && text !== lastText) {
          lastText = text;
          display.textContent = text;
        }
      }
    };

    // 初始同步
    syncLrc();

    // 每 400ms 轮询一次
    setInterval(syncLrc, 400);
  };

  tryInit();
}

function _everusInitMusic() {
  var config = window.__MUSIC_CONFIG__;
  if (!config) return;

  var custom = config.customPlaylist;
  var pid = config.platformId;
  var srv = config.platform || 'netease';

  if (custom && custom.trim()) {
    var songs = _everusParsePlaylist(custom);
    if (songs.length) { _everusCreatePlayer(songs); return; }
  }

  if (pid && pid.trim()) {
    _everusFetchPlatform(srv, pid, function (songs) {
      if (songs.length) _everusCreatePlayer(songs);
    });
  }
}

/* ==========  布局级初始化（仅首次加载执行一次）  ========== */
function initLayoutOnce() {
  if (window.__everusLayoutReady) return;
  window.__everusLayoutReady = true;

  /* ---------  Scroll Box (Back to top)  --------- */
  var huojianBtn = document.querySelector('.huojian__toggle');
  if (huojianBtn) {
    huojianBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.classList.remove('nav-fixed');
    });
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      var fromTop = window.scrollY;
      var btn = document.querySelector('.huojian__toggle');
      if (btn) {
        if (fromTop > 50) {
          btn.classList.remove('hidden');
          document.body.classList.add('nav-fixed');
        } else {
          btn.classList.add('hidden');
          document.body.classList.remove('nav-fixed');
        }
      }
      scrollTicking = false;
    });
  }, { passive: true });

  /* ---------  Nav toggle (mobile)  --------- */
  var daohang = document.querySelector('.daohang');
  if (daohang) {
    daohang.addEventListener('click', function (e) {
      document.body.classList.toggle('nav-open');
    });
    document.body.classList.remove('nav-open');
  }

  // 点击导航链接关闭移动端菜单
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.site-nav a');
    if (!link) return;
    var parentItem = link.closest('.has-children');
    if (parentItem && parentItem.querySelector('.site-nav__submenu')) {
      return;
    }
    document.body.classList.remove('nav-open');
  });

  /* ---------  Music toggle  --------- */
  var musicToggle = document.querySelector('.music__toggle');
  if (musicToggle) {
    musicToggle.addEventListener('click', function () {
      document.body.classList.toggle('music-on');
    });
  }

  /* ---------  二级菜单键盘导航（布局元素，仅绑定一次）  --------- */
  (function () {
    document.querySelectorAll('.site-nav__submenu').forEach(function (submenu) {
      if (submenu.dataset.everusKeynav) return;
      submenu.dataset.everusKeynav = '1';
      var links = submenu.querySelectorAll('.site-nav__submenu-link');
      links.forEach(function (link, i) {
        link.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            var parentItem = submenu.closest('.site-nav__dropdown-item');
            if (parentItem) {
              var parentLink = parentItem.querySelector('.site-nav__dropdown-link');
              if (parentLink) parentLink.focus();
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (links[i + 1]) links[i + 1].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (links[i - 1]) {
              links[i - 1].focus();
            } else {
              var parentItem = submenu.closest('.site-nav__dropdown-item');
              if (parentItem) {
                var parentLink = parentItem.querySelector('.site-nav__dropdown-link');
                if (parentLink) parentLink.focus();
              }
            }
          }
        });
      });
    });
  })();

  /* ---------  音乐播放器 & 歌单面板（布局元素，仅初始化一次）  --------- */
  _everusInitMusic();

  var playlistToggle = document.querySelector('.playlist-toggle');
  var navMusic = document.getElementById('nav-music');
  var playlistClose = document.querySelector('.playlist-panel__close');

  if (playlistToggle && navMusic) {
    playlistToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      navMusic.classList.toggle('has-playlist-open');
    });
  }

  if (playlistClose && navMusic) {
    playlistClose.addEventListener('click', function () {
      navMusic.classList.remove('has-playlist-open');
    });
  }

  // 点击面板外部关闭
  document.addEventListener('click', function (e) {
    if (navMusic && navMusic.classList.contains('has-playlist-open')) {
      if (!navMusic.contains(e.target)) {
        navMusic.classList.remove('has-playlist-open');
      }
    }
  });

  /* ---------  站点状态面板切换（hover + tap）  --------- */
  (function () {
    var toggleBtn = document.querySelector('.site-status__toggle');
    var panel = document.getElementById('site-status-panel');
    if (!toggleBtn || !panel) return;
    if (toggleBtn.dataset.everusStat) return;
    toggleBtn.dataset.everusStat = '1';

    var closeTimer = null;
    var isTouch = window.matchMedia('(hover: none)').matches;

    function openPanel() {
      clearTimeout(closeTimer);
      panel.classList.add('is-open');
      toggleBtn.classList.add('is-active');
    }

    function closePanel() {
      panel.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
    }

    function scheduleClose() {
      closeTimer = setTimeout(closePanel, 200);
    }

    if (isTouch) {
      // 移动端：点击切换
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (panel.classList.contains('is-open')) {
          closePanel();
        } else {
          openPanel();
        }
      });
      // 点击外部关闭
      document.addEventListener('click', function (e) {
        if (panel.classList.contains('is-open') && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
          closePanel();
        }
      });
    } else {
      // 桌面端：hover 触发
      toggleBtn.addEventListener('mouseenter', openPanel);
      panel.addEventListener('mouseenter', openPanel);
      toggleBtn.addEventListener('mouseleave', scheduleClose);
      panel.addEventListener('mouseleave', scheduleClose);
    }

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
      }
    });
  })();

  /* ---------  Fancybox 全局委托绑定（一次即可）  --------- */
  if (typeof Fancybox !== 'undefined') {
    try {
      Fancybox.bind(
        "[data-fancybox='gallery'], [data-fancybox='post-gallery'], [data-fancybox^='moment-gallery']",
        {
          hideScrollbar: false,
          idle: false,
          Hash: false, /* 禁用 URL 深链，避免关闭时 history.back 触发 PJAX popstate 导致页面重载 */
          Carousel: {
            transition: 'slide',
            Navigation: { arrows: true }
          },
          Toolbar: {
            absolute: true,
            enabled: true,
            display: {
              left: ['infobar'],
              middle: ['prev', 'next', 'zoomIn', 'zoomOut', 'flipX', 'flipY'],
              right: ['rotateCCW', 'rotateCW', 'toggle1to1', 'download', 'fullscreen', 'thumbs', 'close']
            }
          }
        }
      );
    } catch (e) {
      console.warn('[EverUs] Fancybox bind failed:', e);
    }
  } else {
    console.warn('[EverUs] Fancybox not loaded — image lightbox unavailable');
  }
}

/* ==========  文章正文图片：自动包裹 Fancybox 链接  ========== */
function wrapContentImages() {
  var containers = document.querySelectorAll('.post__content');
  if (!containers.length) return;

  containers.forEach(function (container) {
    container.querySelectorAll('img:not([data-fancybox-img])').forEach(function (img) {
      if (img.parentElement && img.parentElement.tagName === 'A') return;
      var w = parseInt(img.getAttribute('width'), 10);
      var h = parseInt(img.getAttribute('height'), 10);
      if ((!isNaN(w) && w < 50) || (!isNaN(h) && h < 50)) {
        img.setAttribute('data-fancybox-img', '1');
        return;
      }

      var src = img.getAttribute('src') || img.currentSrc;
      if (!src) return;

      var link = document.createElement('a');
      link.href = src;
      link.setAttribute('data-fancybox', 'post-gallery');
      link.setAttribute('data-type', 'image');
      link.setAttribute('data-caption', img.getAttribute('alt') || '');

      img.setAttribute('data-fancybox-img', '1');
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');

      img.parentElement.insertBefore(link, img);
      link.appendChild(img);
    });
  });
}

/* ==========  页面级初始化（每次页面加载时执行）  ========== */
function initPageContent() {
  /* ---------  GSAP Scroll Animations  --------- */
  animateParagraphs();

  /* ---------  Active link in nav  --------- */
  setActiveLink();

  /* ---------  文章正文图片自动包裹 Fancybox 链接（PJAX 后重跑）  --------- */
  wrapContentImages();

  /* ---------  初始化瞬间点赞状态  --------- */
  initMomentUpvotes();

  /* ---------  链接页分组 tab 滚动至当前激活项  --------- */
  (function () {
    var tabBar = document.querySelector('.link-groups');
    if (!tabBar) return;
    var activeTab = tabBar.querySelector('.link-groups__tab.is-active');
    if (!activeTab) return;
    var scrollLeft = activeTab.offsetLeft - tabBar.clientWidth / 2 + activeTab.clientWidth / 2;
    if (scrollLeft > 0) {
      tabBar.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  })();

  /* ---------  派发页面就绪事件，允许第三方插件监听  --------- */
  document.dispatchEvent(new CustomEvent('everus:page:ready', {
    bubbles: true
  }));
}

function animateParagraphs() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('.up, .post__content > p').forEach(function (el, i) {
    gsap.fromTo(el, {
      opacity: 0,
      y: 30
    }, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: Math.min(i * 0.01, 0.1),
      scrollTrigger: {
        trigger: el,
        start: 'top 95%',
        once: true
      }
    });
  });
}

function setActiveLink() {
  var currentUrl = window.location.href;
  var links = document.querySelectorAll('.site-nav__dropdown-link, .site-nav__submenu-link');
  links.forEach(function (link) {
    link.classList.remove('mm-active');
    if (link.parentElement) link.parentElement.classList.remove('mm-active');
    // 标记空链接，便于 CSS 禁用交互样式
    var rawHref = link.getAttribute('href');
    var isEmpty = !rawHref || rawHref === '#' || rawHref === 'javascript:void(0)';
    link.classList.toggle('is-empty-href', isEmpty);
  });
  links.forEach(function (link) {
    // 跳过空链接：href 为空时浏览器会解析为当前页 URL，导致误激活
    if (link.classList.contains('is-empty-href')) return;
    if (link.href === currentUrl) {
      link.classList.add('mm-active');
      if (link.parentElement) link.parentElement.classList.add('mm-active');
    }
  });
}

/* ==========  PJAX 页面过渡  ========== */
// 原理：点击内部链接 → 淡出内容 → AJAX 拉取新页面 → 替换内容 + 重新执行脚本 → 淡入。
// 与 swup 的关键区别：PJAX 手动重新执行新内容中的所有 <script>，确保评论组件等正常初始化。

(function () {
  var CONTAINER_ID = 'pjax-container';
  var TRANSITION_MS = 250;
  var isNavigating = false;

  // 拦截内部链接点击
  document.addEventListener('click', function (e) {
    if (isNavigating) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest('a');
    if (!link) return;
    // 空链接：阻止默认跳转（href 为空时浏览器解析为当前页 URL，点击会整页刷新）
    var rawHref = link.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref === 'javascript:void(0)') {
      e.preventDefault();
      return;
    }
    if (!link.href || link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.hasAttribute('data-no-pjax')) return;
    // Fancybox 图片链接交由 Fancybox 处理，PJAX 不得拦截
    if (link.hasAttribute('data-fancybox')) return;

    var url;
    try { url = new URL(link.href, window.location.origin); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    // 同一页面（仅 hash 不同）不拦截
    if (url.pathname === location.pathname && url.search === location.search) return;
    // 后台 / 登录 / API
    if (url.pathname.indexOf('/console') === 0) return;
    if (url.pathname.indexOf('/login') === 0) return;
    if (url.pathname.indexOf('/apis/') === 0) return;

    e.preventDefault();
    navigateTo(url.href, false);
  });

  // 浏览器后退/前进
  window.addEventListener('popstate', function () {
    if (isNavigating) return;
    // Fancybox 关闭时可能触发 popstate，跳过以免 PJAX 重新加载页面
    if (document.querySelector('.fancybox__container')) return;
    navigateTo(location.href, true);
  });

  function navigateTo(url, isPopState) {
    if (isNavigating) return;
    isNavigating = true;

    // 关闭弹层与面板
    if (typeof Fancybox !== 'undefined') { try { Fancybox.close(true); } catch (e) {} }
    var statPanel = document.getElementById('site-status-panel');
    if (statPanel) statPanel.classList.remove('is-open');
    document.body.classList.remove('nav-open');

    var container = document.getElementById(CONTAINER_ID);

    // 淡出 + 加载指示器 + 并行 fetch
    if (container) {
      container.classList.add('is-leaving');
      container.classList.add('is-loading');
    }

    Promise.all([
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }),
      new Promise(function (resolve) { setTimeout(resolve, TRANSITION_MS); })
    ]).then(function (results) {
      var html = results[0];
      var doc = new DOMParser().parseFromString(html, 'text/html');

      // ① 更新标题
      var newTitle = doc.querySelector('title');
      if (newTitle) document.title = newTitle.textContent;

      // ② 更新 meta 标签
      doc.querySelectorAll('head meta[name], head meta[property]').forEach(function (meta) {
        var attr = meta.getAttribute('name') ? 'name' : 'property';
        var val = meta.getAttribute(attr);
        var sel = 'meta[' + attr + '="' + val + '"]';
        var existing = document.head.querySelector(sel);
        if (existing) {
          existing.setAttribute('content', meta.getAttribute('content'));
        } else {
          document.head.appendChild(meta.cloneNode(true));
        }
      });

      // ③ 清理旧实例
      if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); } catch (e) {}
      }
      if (typeof gsap !== 'undefined') {
        try { gsap.killTweensOf('.up, .post__content > p'); } catch (e) {}
      }

      // ④ 替换内容
      var newContainer = doc.getElementById(CONTAINER_ID);
      if (!newContainer || !container) {
        // 容器不存在 → 回退到正常跳转
        window.location.href = url;
        return;
      }
      container.innerHTML = newContainer.innerHTML;

      // ⑤ 重新执行脚本（关键步骤！innerHTML 插入的 <script> 不会自动执行）
      container.querySelectorAll('script').forEach(function (oldScript) {
        var src = oldScript.src;
        // 跳过已加载的外部脚本（避免重复执行 jQuery/GSAP 等库）
        if (src && document.querySelector('script[src="' + src + '"]')) {
          oldScript.remove();
          return;
        }
        var newScript = document.createElement('script');
        if (src) {
          newScript.src = src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        for (var i = 0; i < oldScript.attributes.length; i++) {
          var a = oldScript.attributes[i];
          if (a.name !== 'src') newScript.setAttribute(a.name, a.value);
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // ⑥ 加载页面级新脚本（如评论组件脚本可能在 <body> 底部而非容器内）
      doc.querySelectorAll('body script[src]').forEach(function (script) {
        var src = script.src;
        if (!src) return;
        if (document.querySelector('script[src="' + src + '"]')) return;
        if (src.indexOf('/plugins/') === -1 && src.toLowerCase().indexOf('comment') === -1) return;
        var s = document.createElement('script');
        s.src = src;
        document.body.appendChild(s);
      });

      // ⑦ 更新 URL & 滚动
      if (!isPopState) history.pushState(null, '', url);
      window.scrollTo(0, 0);

      // ⑧ 重新初始化页面组件
      initPageContent();

      // ⑨ 淡入（双 rAF 确保新内容已以 opacity:0 渲染过一帧）
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          container.classList.remove('is-leaving');
          container.classList.remove('is-loading');
          isNavigating = false;
          // 刷新 ScrollTrigger 位置
          if (typeof ScrollTrigger !== 'undefined') {
            try { ScrollTrigger.refresh(); } catch (e) {}
          }
        });
      });
    }).catch(function () {
      // 任何错误 → 回退到正常跳转，同时移除加载状态
      if (container) container.classList.remove('is-loading');
      window.location.href = url;
    });
  }
})();

/* ==========  DOM ready：首次加载初始化  ========== */
document.addEventListener('DOMContentLoaded', function () {
  initLayoutOnce();
  initPageContent();
});
