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

  (function ($) {
    /* ---------  Scroll Box (Back to top)  --------- */
    $('.huojian__toggle').click(function () {
      $('html,body').animate({ scrollTop: 0 }, 500, function () {
        $('body').removeClass('nav-fixed');
      });
    });

    $(window).on('scroll', function () {
      var fromTop = $(window).scrollTop();
      if (fromTop > 50) {
        $('.huojian__toggle').removeClass('hidden');
        $('body').addClass('nav-fixed');
      } else {
        $('.huojian__toggle').addClass('hidden');
        $('body').removeClass('nav-fixed');
      }
    });

    /* ---------  Nav toggle (mobile)  --------- */
    $('.daohang').on('click', function (e) {
      $('body').toggleClass('nav-open');
    });
    $('body').removeClass('nav-open');

    // 点击导航链接关闭移动端菜单
    // 有子菜单的父项 → 不关闭（由手风琴逻辑控制）
    // 子菜单链接 / 普通链接 → 关闭 overlay
    $(document).on('click', '.site-nav a', function (e) {
      var parentItem = this.closest('.has-children');
      if (parentItem && parentItem.querySelector('.site-nav__submenu')) {
        return;
      }
      $('body').removeClass('nav-open');
    });

    /* ---------  Music toggle  --------- */
    $('.music__toggle').on('click', function () {
      $('body').toggleClass('music-on');
    });
  })(jQuery);

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
      Fancybox.bind("[data-fancybox='gallery']", {
        hideScrollbar: false,
        idle: false,
        Carousel: {
          transition: 'slide'
        }
      });
    } catch (e) {
      console.warn('Fancybox bind failed:', e);
    }
  }
}

/* ==========  页面级初始化（每次页面加载时执行）  ========== */
function initPageContent() {
  /* ---------  GSAP Scroll Animations  --------- */
  animateParagraphs();

  /* ---------  Active link in nav  --------- */
  setActiveLink();

  /* ---------  Fancybox .zoom 按钮委托（每页重新绑定）  --------- */
  initZoomButtons();

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
  var currentPath = window.location.pathname + window.location.search;
  var links = document.querySelectorAll('.site-nav__dropdown-link, .site-nav__submenu-link');
  // 清理所有激活状态（含 is-expanded，避免切换页面后残留）
  links.forEach(function (link) {
    link.classList.remove('mm-active');
    if (link.parentElement) link.parentElement.classList.remove('mm-active');
  });
  document.querySelectorAll('.site-nav__dropdown-item.has-children').forEach(function (item) {
    item.classList.remove('is-expanded');
  });
  // 标记当前页对应的链接
  links.forEach(function (link) {
    // 跳过无 URL 或 hash 锚点链接（父级菜单项可能没有 URL，href 为空会被浏览器解析为当前页）
    var hrefAttr = link.getAttribute('href');
    if (!hrefAttr || hrefAttr === '#' || hrefAttr.charAt(0) === '#') return;
    var linkPath;
    try {
      var u = new URL(link.href);
      linkPath = u.pathname + u.search;
    } catch (e) { return; }
    if (linkPath === currentPath) {
      link.classList.add('mm-active');
      if (link.parentElement) link.parentElement.classList.add('mm-active');
      // 如果是子菜单链接，展开父级
      var parentItem = link.closest('.site-nav__dropdown-item.has-children');
      if (parentItem) parentItem.classList.add('is-expanded');
    }
  });
}

function initZoomButtons() {
  if (typeof Fancybox === 'undefined') return;
  document.querySelectorAll('.zoom').forEach(function (button) {
    if (button.dataset.everusZoom) return;
    button.dataset.everusZoom = '1';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      var parentCard = button.closest('.work-card');
      var image = parentCard ? parentCard.querySelector('a[data-fancybox="gallery"]') : null;
      if (image) image.click();
    });
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
    if (!link.href || link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.hasAttribute('data-no-pjax')) return;

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

    // 淡出 + 并行 fetch
    if (container) container.classList.add('is-leaving');

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
          isNavigating = false;
          // 刷新 ScrollTrigger 位置
          if (typeof ScrollTrigger !== 'undefined') {
            try { ScrollTrigger.refresh(); } catch (e) {}
          }
        });
      });
    }).catch(function () {
      // 任何错误 → 回退到正常跳转
      window.location.href = url;
    });
  }
})();

/* ==========  DOM ready：首次加载初始化  ========== */
document.addEventListener('DOMContentLoaded', function () {
  initLayoutOnce();
  initPageContent();
});
