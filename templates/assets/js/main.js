/* ========== EverUs Theme JS for Halo ========== */
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
})(jQuery);

/* ==========  DOM ready (vanilla JS + Swup + GSAP)  ========== */
document.addEventListener('DOMContentLoaded', function () {
  var swup;

  try {
    swup = new Swup({
      containers: ['#swup'],
      animateHistoryBrowsing: true,
      animationSelector: '.transition-fade',
      cache: true
    });
  } catch (e) {
    console.warn('Swup initialization failed:', e);
  }

  /* ---------  GSAP Scroll Animations  --------- */
  function animateParagraphs() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    $('.post__content p, .up').each(function (i, el) {
      gsap.fromTo(el, {
        opacity: 0,
        y: 30,
        pointerEvents: 'none'
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        delay: i * 0.01,
        pointerEvents: 'all',
        scrollTrigger: {
          trigger: el,
          start: 'top 100%',
          once: false,
          toggleActions: 'restart none none reverse'
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

  /* ---------  Slick Carousel (Musings)  --------- */
  function initCarousel() {
    if (typeof $.fn.slick === 'undefined') return;

    $('.commentator-slick').not('.slick-initialized').each(function () {
      $(this).slick({
        dots: true,
        infinite: true,
        speed: 500,
        fade: true,
        cssEase: 'linear',
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        pauseOnFocus: true,
        arrows: false,
        responsive: [
          { breakpoint: 1024, settings: { slidesToShow: 1, slidesToScroll: 1 } },
          { breakpoint: 600, settings: { arrows: false, dots: true } }
        ]
      });
    });

    $('.slick-custom-prev').off('click').on('click', function () {
      $('.commentator-slick').slick('slickPrev');
    });
    $('.slick-custom-next').off('click').on('click', function () {
      $('.commentator-slick').slick('slickNext');
    });
  }

  initCarousel();

  /* ---------  Swup hooks: re-run everything after page transition  --------- */
  if (swup) {
    swup.hooks.on('content:replace', function () {
      setTimeout(function () {
        animateParagraphs();
        setActiveLink();
        initFancybox();
        initCarousel();
      }, 100);
    });
  }
});
