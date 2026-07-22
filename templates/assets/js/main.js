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

(function ($) {
  'use strict';

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
  $(function () {
    $('.daohang').on('click', function (e) {
      $('body').toggleClass('nav-open');
    });
    $('body').removeClass('nav-open');

    $(document).on('click', '.site-nav a', function () {
      $('body').removeClass('nav-open');
    });
  });

  /* ---------  Music toggle  --------- */
  $('.music__toggle').on('click', function () {
    $('body').toggleClass('music-on');
  });
})(jQuery);

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

/* ==========  DOM ready  ========== */
document.addEventListener('DOMContentLoaded', function () {
  /* ---------  GSAP Scroll Animations  --------- */
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

  animateParagraphs();

  /* ---------  Active link in nav  --------- */
  function setActiveLink() {
    var currentUrl = window.location.href;
    var links = document.querySelectorAll('.site-nav__dropdown-item > a');
    links.forEach(function (link) {
      link.classList.remove('mm-active');
      link.parentElement.classList.remove('mm-active');
    });
    links.forEach(function (link) {
      if (link.href === currentUrl) {
        link.classList.add('mm-active');
        link.parentElement.classList.add('mm-active');
      }
    });
  }

  setActiveLink();

  /* ---------  Fancybox  --------- */
  function initFancybox() {
    if (typeof Fancybox === 'undefined') return;

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

    document.querySelectorAll('.zoom').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var parentCard = button.closest('.work-card');
        var image = parentCard ? parentCard.querySelector('a[data-fancybox="gallery"]') : null;
        if (image) image.click();
      });
    });
  }

  initFancybox();

  /* ---------  初始化瞬间点赞状态  --------- */
  initMomentUpvotes();

  /* ---------  音乐播放器 & 歌单面板  --------- */
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

  /* ---------  站点状态面板切换（hover + tap）  --------- */
  (function () {
    var toggleBtn = document.querySelector('.site-status__toggle');
    var panel = document.getElementById('site-status-panel');
    if (!toggleBtn || !panel) return;

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
});
