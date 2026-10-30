// Google Analytics runs only on the official production hostname.
(function () {
  "use strict";
  if (window.location.hostname !== "tochigi-kyoryokutai.or.jp") return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", "G-K4M6ZRL4F3", {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-K4M6ZRL4F3";
  document.head.appendChild(script);
})();
