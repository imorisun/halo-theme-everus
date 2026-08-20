/* ========== EverUs Theme JS for Halo ========== */

/* ---------  瞬间 upvote 本地状态  --------- */
var UPVOTE_STORAGE_KEY = 'halo.upvoted.moment.names';

function getUpvotedNames() {
  try {
    var parsed = JSON.parse(localStorage.getItem(UPVOTE_STORAGE_KEY) || '[]');
    // 只 try/catch 解析不够：若该键被写成 {} 或字符串，解析能成功但不是数组，
    // 后续的 names.push / names.forEach 会抛错，整个点赞功能连带失效。
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function isMomentUpvoted(name) {
  return getUpvotedNames().indexOf(name) !== -1;
}

// 正在请求中的瞬间，用于防连点。
// 仅靠 isMomentUpvoted 是不够的：它读 localStorage，而 localStorage 只在
// xhr.onload 里才写入，因此快速双击会有两次点击都通过判断、发出两个 POST，
// 服务端计数 +2 而本地只记一次。
var _everusUpvoteInFlight = {};

function handleMomentUpvote(btn, name) {
  if (isMomentUpvoted(name)) return;
  if (_everusUpvoteInFlight[name]) return;
  _everusUpvoteInFlight[name] = true;

  var done = function () { delete _everusUpvoteInFlight[name]; };

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/apis/api.halo.run/v1alpha1/trackers/upvote');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function () {
    done();
    if (xhr.status < 200 || xhr.status >= 300) return;

    var names = getUpvotedNames();
    names.push(name);
    // 包 try/catch：无痕模式或配额耗尽时 setItem 会抛错，
    // 若不捕获，下面的计数与高亮更新就全都不会执行。
    try {
      localStorage.setItem(UPVOTE_STORAGE_KEY, JSON.stringify(names));
    } catch (e) {}

    // Update all count displays for this moment
    var spans = document.querySelectorAll('[data-upvote-moment-name="' + name + '"]');
    spans.forEach(function (span) {
      var count = parseInt(span.textContent || '0', 10);
      if (isNaN(count)) count = 0;
      span.textContent = (count + 1) + '';
    });

    // Mark all like buttons for this moment as liked
    markMomentLiked(name);
  };

  xhr.onerror = function () {
    done();
    console.error('[EverUs] 点赞失败，请稍后再试');
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
      // 不再写内联 btn.style.color：.is-liked 在 style.css 里已经设了 color: #e53e3e，
      // 内联样式是冗余的，而且优先级高于 CSS，会让这个颜色无法被主题覆盖。
      btn.classList.add('is-liked');
      btn.setAttribute('aria-pressed', 'true');
      // 用 aria-disabled 而不是 disabled 属性：
      // disabled 会让按钮无法聚焦，按钮内的点赞数对键盘/读屏用户就读不到了。
      // aria-disabled 保留可聚焦性，同时告知辅助技术「此操作已不可用」，
      // 实际的拦截由 handleMomentUpvote 开头的判断完成。
      btn.setAttribute('aria-disabled', 'true');
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
  var expanded = el.classList.toggle('is-expanded');
  // 同步触发按钮的 aria-expanded（按钮用 aria-controls 指向该容器）
  document.querySelectorAll('[aria-controls="moment-comments-' + name + '"]').forEach(function (btn) {
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
}

/* ---------  文章点赞  --------- */
var POST_UPVOTE_STORAGE_KEY = 'halo.upvoted.post.names';

function getUpvotedPostNames() {
  try {
    var parsed = JSON.parse(localStorage.getItem(POST_UPVOTE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function isPostUpvoted(name) {
  return getUpvotedPostNames().indexOf(name) !== -1;
}

var _everusPostUpvoteInFlight = {};

function handlePostUpvote(btn, name) {
  if (isPostUpvoted(name)) return;
  if (_everusPostUpvoteInFlight[name]) return;
  _everusPostUpvoteInFlight[name] = true;

  var done = function () { delete _everusPostUpvoteInFlight[name]; };

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/apis/api.halo.run/v1alpha1/trackers/upvote');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function () {
    done();
    if (xhr.status < 200 || xhr.status >= 300) return;

    var names = getUpvotedPostNames();
    names.push(name);
    try {
      localStorage.setItem(POST_UPVOTE_STORAGE_KEY, JSON.stringify(names));
    } catch (e) {}

    document.querySelectorAll('[data-upvote-post-name="' + name + '"]').forEach(function (span) {
      var count = parseInt(span.textContent || '0', 10);
      if (isNaN(count)) count = 0;
      span.textContent = (count + 1) + '';
    });

    markPostLiked(name);
  };

  xhr.onerror = function () {
    done();
    console.error('[EverUs] 点赞失败，请稍后再试');
  };

  xhr.send(JSON.stringify({
    group: 'content.halo.run',
    plural: 'posts',
    name: name
  }));
}

function markPostLiked(name) {
  document.querySelectorAll('[data-upvote-post-name="' + name + '"]').forEach(function (span) {
    var btn = span.closest('.post-upvote');
    if (btn) {
      btn.classList.add('is-liked');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-disabled', 'true');
    }
  });
}

function initPostUpvotes() {
  getUpvotedPostNames().forEach(function (name) {
    markPostLiked(name);
  });
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
    _everusTeardownMobileLrc();
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
var _everusLrcObserver = null;
var _everusLrcRetryTimer = null;

/**
 * 停止歌词同步并释放资源。
 * 播放器被重建（_everusCreatePlayer 里 destroy 旧实例）时必须调用，
 * 否则旧的 observer / 重试定时器会残留并叠加。
 */
function _everusTeardownMobileLrc() {
  if (_everusLrcObserver) {
    _everusLrcObserver.disconnect();
    _everusLrcObserver = null;
  }
  if (_everusLrcRetryTimer) {
    clearTimeout(_everusLrcRetryTimer);
    _everusLrcRetryTimer = null;
  }
}

function _everusInitMobileLrc(container) {
  var display = document.querySelector('.mobile-lrc-text');
  if (!display) return;

  _everusTeardownMobileLrc();

  // 等待 APlayer 渲染出 .aplayer-lrc-contents（异步创建，需要延迟获取）
  var tryInit = function (retries) {
    retries = retries || 0;
    var lrcContents = container.querySelector('.aplayer-lrc .aplayer-lrc-contents');
    if (!lrcContents) {
      if (retries < 20) {
        _everusLrcRetryTimer = setTimeout(function () { tryInit(retries + 1); }, 300);
      }
      return;
    }

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

    // 改用 MutationObserver 取代原先的 setInterval(syncLrc, 400)。
    // 原实现每 400ms 轮询一次且从不 clearInterval：整个会话期间持续运行，
    // 音乐暂停、播放器销毁、甚至桌面端（该元素本就隐藏）都在空转。
    //
    // 之所以能用 observer 精确替代：APlayer 切换歌词行的实现就是
    //   getElementsByClassName('aplayer-lrc-current')[0].classList.remove(...)
    //   getElementsByTagName('p')[t].classList.add('aplayer-lrc-current')
    // 即通过增删子元素的 class 来标记当前行（另外会改容器的 transform），
    // 因此监听 subtree 内的 class/style 变化必然覆盖每一次歌词更新。
    _everusLrcObserver = new MutationObserver(syncLrc);
    _everusLrcObserver.observe(lrcContents, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true,
      childList: true
    });
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

/* ==========  JS 界面文案  ========== */
var EVERUS_I18N = window.__EVERUS_I18N__ || {};

/* ==========  阅读进度条  ========== */
function updateReadingProgress() {
  var bar = document.getElementById('reading-progress-bar');
  if (!bar) return;
  var doc = document.documentElement;
  var scrollable = doc.scrollHeight - doc.clientHeight;
  var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
}

function initReadingProgress() {
  if (!document.getElementById('reading-progress-bar')) return;
  updateReadingProgress();
  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });
}

/* ==========  站点运行时间  ========== */
function initRuntime() {
  var el = document.querySelector('[data-everus-runtime]');
  if (!el) return;
  var startRaw = el.getAttribute('data-start-date');
  if (!startRaw) return;

  // 兼容 "2020-01-01" 与 "2020-01-01T00:00:00" 两种格式
  var start = new Date(startRaw.indexOf('T') === -1 ? startRaw + 'T00:00:00' : startRaw);
  if (isNaN(start.getTime())) return;

  var render = function () {
    var diff = Date.now() - start.getTime();
    if (diff < 0) { el.textContent = ''; return; }

    var days = Math.floor(diff / 86400000);
    var years = Math.floor(days / 365);
    var rest = days % 365;

    var parts = [];
    if (years > 0) parts.push(years + ' ' + (EVERUS_I18N.runtimeYear || '年'));
    parts.push(rest + ' ' + (EVERUS_I18N.runtimeDay || '天'));
    el.textContent = (EVERUS_I18N.runtimePrefix || '本站已运行') + ' ' + parts.join(' ');
  };

  render();
  setInterval(render, 60000);
}

/* ==========  粒子背景  ========== */
function initParticles() {
  var canvas = document.getElementById('everus-particles');
  if (!canvas) return;
  if (canvas.dataset.everusParticles) return;
  canvas.dataset.everusParticles = '1';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var count = parseInt(canvas.getAttribute('data-count') || '60', 10);
  if (isNaN(count) || count < 10) count = 10;
  if (count > 150) count = 150;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var resize = function () {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // 粒子使用归一化坐标（0~1），缩放窗口时无需重新布局
  var particles = [];
  for (var i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0008,
      vy: (Math.random() - 0.5) * 0.0008,
      r: Math.random() * 1.6 + 0.6
    });
  }

  var LINK_DIST = 0.12;

  var step = function () {
    if (document.hidden) return;
    var w = canvas.width;
    var h = canvas.height;
    var color = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary').trim() || '#26a760';

    ctx.clearRect(0, 0, w, h);

    var i, j, p, q;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = 1; else if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; else if (p.y > 1) p.y = 0;
    }

    // 连接线
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 * dpr;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        var dx = p.x - q.x;
        var dy = p.y - q.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.3;
          ctx.beginPath();
          ctx.moveTo(p.x * w, p.y * h);
          ctx.lineTo(q.x * w, q.y * h);
          ctx.stroke();
        }
      }
    }

    // 粒子
    ctx.fillStyle = color;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.globalAlpha = 0.25 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // 只在可见时运行：visibilitychange 切换 rAF 循环
  var running = true;
  var loop = function () {
    if (!running) return;
    step();
    requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) loop();
  });
  loop();
}

/* ==========  文章目录（TOC）  ========== */
function initToc() {
  var toc = document.getElementById('post-toc');
  if (!toc) return;
  if (toc.dataset.everusToc) return;
  toc.dataset.everusToc = '1';

  var listEl = toc.querySelector('.post-toc__list');
  var wrapper = toc.parentElement;
  var article = wrapper ? wrapper.querySelector('.post__content') : null;
  if (!listEl || !article) return;

  var headings = article.querySelectorAll('h2, h3, h4');
  // 标题太少时目录没有意义，整体隐藏
  if (headings.length < 3) return;

  toc.classList.remove('hidden');
  listEl.innerHTML = '';

  var anchors = [];
  headings.forEach(function (h, i) {
    var id = h.getAttribute('id');
    if (!id) {
      id = 'everus-heading-' + (i + 1);
      h.setAttribute('id', id);
    }
    var item = document.createElement('a');
    item.className = 'post-toc__item post-toc__item--' + h.tagName.toLowerCase();
    item.href = '#' + id;
    item.textContent = h.textContent;
    listEl.appendChild(item);
    anchors.push({ heading: h, link: item });
  });

  /* ---------  目录点击：显式滚动跳转  --------- */
  // 不依赖浏览器原生锚点跳转：PJAX 的历史状态管理与第三方插件脚本都可能
  // 干扰原生 hash 导航，导致「URL 变了但页面不动」。这里用 stopPropagation
  // 阻断事件继续冒泡到 PJAX 的全局 click 拦截，并手动平滑滚动到目标标题。
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 固定导航的底部位置（导航 top: 0.5rem + height: 4rem）再留少量呼吸空间
  var NAV_OFFSET = 80;

  anchors.forEach(function (a) {
    a.link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var target = document.getElementById(a.heading.getAttribute('id'));
      if (!target) return;

      var y = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: Math.max(0, y), behavior: prefersReduced ? 'auto' : 'smooth' });

      // 同步地址栏 hash，但不新增历史记录，避免触发 PJAX 的 popstate 逻辑
      try {
        history.replaceState(history.state, '', '#' + a.heading.getAttribute('id'));
      } catch (err) {}

      // 跳转目标短暂高亮，帮助读者定位
      target.classList.remove('everus-toc-flash');
      void target.offsetWidth; // 强制重排以重启动画
      target.classList.add('everus-toc-flash');
      setTimeout(function () {
        target.classList.remove('everus-toc-flash');
      }, 1500);
    });
  });

  // 滚动时高亮当前所在章节
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        anchors.forEach(function (a) {
          a.link.classList.toggle('is-active', a.heading === entry.target);
        });
      });
    }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });
    anchors.forEach(function (a) { observer.observe(a.heading); });
  }
}

/* ==========  字数统计与阅读时长  ========== */
function initMetaStats() {
  var wordEl = document.querySelector('[data-everus-wordcount]');
  var timeEl = document.querySelector('[data-everus-readtime]');
  if (!wordEl && !timeEl) return;

  var content = document.querySelector('.post__content');
  if (!content) return;

  var text = content.innerText || '';
  // CJK 字符按「字」计，其余按空格分词计「词」
  var cjk = (text.match(/[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  var rest = text.replace(/[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g, ' ');
  var words = (rest.match(/[A-Za-z0-9]+/g) || []).length;
  var total = cjk + words;

  // 中文约 400 字/分钟、西文约 200 词/分钟
  var minutes = Math.max(1, Math.ceil(cjk / 400 + words / 200));

  var fmt = function (n) {
    try { return n.toLocaleString(); } catch (e) { return String(n); }
  };

  if (wordEl) wordEl.textContent = fmt(total) + ' ' + (EVERUS_I18N.wordCount || '字');
  if (timeEl) timeEl.textContent = minutes + ' ' + (EVERUS_I18N.readTime || '分钟读完');
}

/* ==========  代码块复制按钮  ========== */
function _everusCopyFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  return ok;
}

function initCodeCopy() {
  var containers = document.querySelectorAll('.post__content[data-code-copy="1"]');
  containers.forEach(function (container) {
    container.querySelectorAll('pre').forEach(function (pre) {
      if (pre.dataset.everusCopy) return;
      pre.dataset.everusCopy = '1';
      pre.classList.add('has-copy-btn');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.setAttribute('aria-label', EVERUS_I18N.copyCode || '复制代码');
      btn.innerHTML = '<i class="Nug Nug-fuzhi" aria-hidden="true"></i>';

      btn.addEventListener('click', function () {
        var code = pre.innerText || '';
        var onDone = function (ok) {
          btn.classList.add('is-copied');
          btn.setAttribute('aria-label', ok ? (EVERUS_I18N.copied || '已复制') : (EVERUS_I18N.copyCode || '复制代码'));
          setTimeout(function () {
            btn.classList.remove('is-copied');
            btn.setAttribute('aria-label', EVERUS_I18N.copyCode || '复制代码');
          }, 1600);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(code).then(
            function () { onDone(true); },
            function () { onDone(_everusCopyFallback(code)); }
          );
        } else {
          onDone(_everusCopyFallback(code));
        }
      });

      pre.appendChild(btn);
    });
  });
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
      var open = document.body.classList.toggle('nav-open');
      daohang.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.body.classList.remove('nav-open');
    daohang.setAttribute('aria-expanded', 'false');
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
    if (daohang) daohang.setAttribute('aria-expanded', 'false');
  });

  /* ---------  Music toggle  --------- */
  var musicToggle = document.querySelector('.music__toggle');
  if (musicToggle) {
    musicToggle.addEventListener('click', function () {
      var on = document.body.classList.toggle('music-on');
      musicToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* ---------  二级菜单展开态同步（aria-expanded + .is-expanded）  --------- */
  // 二级菜单原本只靠 CSS :hover 展开，而模板里的 aria-expanded 是写死的 "false"，
  // 永远不会变 —— 对屏幕阅读器是错误信息。
  // style.css 里本就有 .is-expanded 这个钩子但从未被 JS 设置过，这里一并用上：
  // 鼠标移入/移出与焦点进入/离开都同步类名与 aria 状态，使该属性真实反映状态。
  // （键盘可达性另由 CSS 的 :focus-within 兜底，即使本段 JS 失效也能打开子菜单。）
  document.querySelectorAll('.site-nav__dropdown-item.has-children').forEach(function (item) {
    if (item.dataset.everusAria) return;
    item.dataset.everusAria = '1';
    var link = item.querySelector('.site-nav__dropdown-link');
    if (!link) return;

    var sync = function (expanded) {
      link.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      item.classList.toggle('is-expanded', expanded);
    };

    item.addEventListener('mouseenter', function () { sync(true); });
    item.addEventListener('mouseleave', function () { sync(false); });
    item.addEventListener('focusin', function () { sync(true); });
    item.addEventListener('focusout', function (e) {
      // 焦点仍在子菜单内部时不收起
      if (!item.contains(e.relatedTarget)) sync(false);
    });
  });

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

  /* ---------  阅读进度条（布局元素，仅初始化一次）  --------- */
  initReadingProgress();

  /* ---------  站点运行时间（布局元素，仅初始化一次）  --------- */
  initRuntime();

  /* ---------  粒子背景（布局元素，仅初始化一次）  --------- */
  initParticles();

  var playlistToggle = document.querySelector('.playlist-toggle');
  var navMusic = document.getElementById('nav-music');
  var playlistClose = document.querySelector('.playlist-panel__close');

  // 统一入口：类名与 aria-expanded 必须一起变，避免三处调用各自漏掉一个
  function setPlaylistOpen(open) {
    if (!navMusic) return;
    navMusic.classList.toggle('has-playlist-open', open);
    if (playlistToggle) playlistToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (playlistToggle && navMusic) {
    playlistToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setPlaylistOpen(!navMusic.classList.contains('has-playlist-open'));
    });
  }

  if (playlistClose && navMusic) {
    playlistClose.addEventListener('click', function () {
      setPlaylistOpen(false);
    });
  }

  // 点击面板外部关闭
  document.addEventListener('click', function (e) {
    if (navMusic && navMusic.classList.contains('has-playlist-open')) {
      if (!navMusic.contains(e.target)) {
        setPlaylistOpen(false);
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
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      panel.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
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
      // 键盘可达：桌面端原本只响应 hover，键盘用户根本打不开这个面板
      toggleBtn.addEventListener('focus', openPanel);
      toggleBtn.addEventListener('blur', scheduleClose);
      panel.addEventListener('focusin', openPanel);
      panel.addEventListener('focusout', function (e) {
        if (!panel.contains(e.relatedTarget) && e.relatedTarget !== toggleBtn) scheduleClose();
      });
    }

    // ESC 关闭，并把焦点交还触发按钮 —— 否则焦点会滞留在已隐藏的面板内部
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
        toggleBtn.focus();
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

  /* ---------  文章目录（PJAX 后重跑）  --------- */
  initToc();

  /* ---------  字数统计与阅读时长（PJAX 后重跑）  --------- */
  initMetaStats();

  /* ---------  代码块复制按钮（PJAX 后重跑）  --------- */
  initCodeCopy();

  /* ---------  文章点赞状态回填（PJAX 后重跑）  --------- */
  initPostUpvotes();

  /* ---------  阅读进度条随新内容刷新  --------- */
  updateReadingProgress();

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
  // ScrollTrigger 是与 gsap 分开的一个 CDN 文件，可能单独加载失败。
  // 若不判断就调用 registerPlugin(ScrollTrigger) 会抛 ReferenceError，
  // 从而中断 initPageContent() 里后续的全部初始化（导航高亮、图片灯箱包裹、
  // 点赞状态回填），并让每次 PJAX 跳转都退化成整页刷新。
  // 这里直接跳过动画即可：.up 元素在 CSS 中没有 opacity:0，内容依然正常可见。
  if (typeof ScrollTrigger === 'undefined') return;
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
  // 去掉结尾斜杠（根路径除外），使 /archives 与 /archives/ 视为同一路径
  var normalize = function (p) {
    if (!p) return '/';
    return p.length > 1 ? p.replace(/\/+$/, '') : p;
  };

  var currentPath = normalize(window.location.pathname);
  var links = document.querySelectorAll('.site-nav__dropdown-link, .site-nav__submenu-link');

  links.forEach(function (link) {
    link.classList.remove('mm-active');
    if (link.parentElement) link.parentElement.classList.remove('mm-active');
    // 标记空链接，便于 CSS 禁用交互样式
    var rawHref = link.getAttribute('href');
    var isEmpty = !rawHref || rawHref === '#' || rawHref === 'javascript:void(0)';
    link.classList.toggle('is-empty-href', isEmpty);
  });

  // 原实现是 link.href === window.location.href 全等比较，只要 URL 带上查询串或
  // 结尾斜杠就匹配不上 —— 例如翻到第 2 页（/archives?page=2 或 /archives/page/2）
  // 导航高亮就会整个丢失。
  // 改为按 pathname 比较：先找精确匹配；没有精确匹配时，退而选择「路径前缀最长」
  // 的那个链接（例如在 /tags/foo 上高亮「标签」）。取最长可避免多个条目同时高亮。
  var best = null;
  var bestLen = -1;

  links.forEach(function (link) {
    // 跳过空链接：href 为空时浏览器会解析为当前页 URL，导致误激活
    if (link.classList.contains('is-empty-href')) return;

    var linkPath;
    try {
      linkPath = normalize(new URL(link.href, window.location.origin).pathname);
    } catch (e) {
      return;
    }

    var score = -1;
    if (linkPath === currentPath) {
      score = Infinity; // 精确匹配优先
    } else if (linkPath !== '/' && currentPath.indexOf(linkPath + '/') === 0) {
      // 前缀匹配；排除 '/' 否则首页会命中所有页面
      score = linkPath.length;
    }

    if (score > bestLen) {
      bestLen = score;
      best = link;
    }
  });

  if (best) {
    best.classList.add('mm-active');
    if (best.parentElement) best.parentElement.classList.add('mm-active');
  }
}

/* ==========  PJAX 页面过渡  ========== */
// 原理：点击内部链接 → 淡出内容 → AJAX 拉取新页面 → 替换内容 + 重新执行脚本 → 淡入。
// 与 swup 的关键区别：PJAX 手动重新执行新内容中的所有 <script>，确保评论组件等正常初始化。

(function () {
  var CONTAINER_ID = 'pjax-container';
  var TRANSITION_MS = 250;
  var NAV_TIMEOUT_MS = 10000; // 单次跳转的最长等待时间，超时则回退为整页跳转
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

    // 离开当前页前，把滚动位置存进「当前」这条 history 记录。
    // 只在前进导航时做：popstate 触发时 history.state 已经切到目标记录，
    // 此时再写就会用当前滚动位置覆盖掉目标记录里保存的值。
    if (!isPopState) {
      try {
        history.replaceState({ everusScrollY: window.scrollY }, '', location.href);
      } catch (e) {}
    }

    // 关闭弹层与面板
    if (typeof Fancybox !== 'undefined') { try { Fancybox.close(true); } catch (e) {} }
    var statPanel = document.getElementById('site-status-panel');
    if (statPanel) statPanel.classList.remove('is-open');
    var statToggle = document.querySelector('.site-status__toggle');
    if (statToggle) {
      statToggle.classList.remove('is-active');
      statToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('nav-open');
    var navToggle = document.querySelector('.daohang');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');

    var container = document.getElementById(CONTAINER_ID);

    // 淡出 + 加载指示器 + 并行 fetch
    if (container) {
      container.classList.add('is-leaving');
      container.classList.add('is-loading');
    }

    // 给 fetch 加上超时与中断能力。
    // 若不加：请求悬挂（弱网、连接被挂住）时 Promise 永不 settle，
    // isNavigating 一直是 true，加载遮罩不会消失，而且此后所有链接点击
    // 都会被本函数开头的 isNavigating 判断吞掉 —— 表现为「整站点不动」。
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function () {
      if (controller) controller.abort();
    }, NAV_TIMEOUT_MS);

    Promise.all([
      fetch(url, controller ? { signal: controller.signal } : undefined).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }),
      new Promise(function (resolve) { setTimeout(resolve, TRANSITION_MS); })
    ]).then(function (results) {
      clearTimeout(timeoutId);
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

      // ⑦ 更新 URL & 滚动位置
      // 前进导航：新记录初始滚动位置为 0；后退/前进：取回该记录保存的位置。
      // 原实现无条件 scrollTo(0, 0)，导致浏览器「后退」后总是跳到页顶，
      // 丢失用户原来的阅读位置。
      var targetScrollY = 0;
      if (isPopState) {
        targetScrollY = (history.state && history.state.everusScrollY) || 0;
      } else {
        try { history.pushState({ everusScrollY: 0 }, '', url); } catch (e) {}
      }

      // ⑧ 重新初始化页面组件
      initPageContent();

      // ⑨ 焦点管理：内容被整体替换后，原焦点元素已从 DOM 移除，
      // 键盘/读屏用户会失去位置。把焦点移到新内容容器上。
      // tabindex=-1 使容器可编程聚焦但不进入 Tab 序列；preventScroll 避免
      // 聚焦行为覆盖下面刚设置好的滚动位置。
      if (container) {
        container.setAttribute('tabindex', '-1');
        try { container.focus({ preventScroll: true }); } catch (e) { container.focus(); }
      }

      // ⑩ 淡入（双 rAF 确保新内容已以 opacity:0 渲染过一帧）
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          // 在新内容完成布局后再滚动，否则目标位置可能超出当时的文档高度而被截断
          window.scrollTo(0, targetScrollY);
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
      // 任何错误（含超时中断）→ 回退到正常跳转，同时移除加载状态
      clearTimeout(timeoutId);
      isNavigating = false;
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
