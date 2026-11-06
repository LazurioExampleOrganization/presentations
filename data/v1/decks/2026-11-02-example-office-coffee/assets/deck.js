// Presentations deck runtime, built by bun run deck:build. Do not edit.
(() => {
  // src/deck/link.ts
  function personalValue(raw) {
    if (!raw)
      return "";
    let clean = "";
    for (let char of raw) {
      let code = char.codePointAt(0) ?? 0;
      clean += code < 32 || code === 127 ? " " : char;
    }
    return Array.from(clean.replace(/\s+/g, " ").trim()).slice(0, 80).join("").trim();
  }
  function personalWho(search) {
    let params = new URLSearchParams(search), name = personalValue(params.get("for") ?? params.get("pro")), organization = personalValue(params.get("org") ?? params.get("firma"));
    return [name, organization].filter(Boolean).join(", ");
  }
  function slideFromHash(hash, count) {
    let number = Number.parseInt(hash.replace(/^#/, ""), 10);
    if (!Number.isFinite(number))
      return 0;
    return Math.min(Math.max(number - 1, 0), count - 1);
  }

  // src/deck/runtime.ts
  var STAGE_WIDTH = 1920, STAGE_HEIGHT = 1080;
  function start() {
    let slides = Array.from(document.querySelectorAll(".slide"));
    if (slides.length === 0)
      return;
    let counter = document.getElementById("counter"), progress = document.getElementById("progress"), previous = document.getElementById("previous"), next = document.getElementById("next"), present = document.getElementById("present"), print = document.getElementById("print"), library = document.getElementById("library"), messages = JSON.parse(document.getElementById("deck-messages")?.textContent ?? "{}"), still = matchMedia("(prefers-reduced-motion: reduce)").matches, current = slideFromHash(location.hash, slides.length);
    if (library && location.protocol === "file:")
      library.hidden = !0;
    let who = personalWho(location.search);
    if (who)
      for (let line of document.querySelectorAll("[data-personal]"))
        line.textContent = messages.preparedFor.replace("{who}", who), line.hidden = !1;
    for (let link of document.querySelectorAll("[data-language-switch]"))
      link.addEventListener("click", () => {
        link.href = `${link.href.split(/[?#]/)[0]}${location.search}#${current + 1}`;
      });
    function fit() {
      let width = Math.max(1, document.documentElement.clientWidth), height = Math.max(1, document.documentElement.clientHeight), scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
      document.documentElement.style.setProperty("--deck-scale", scale.toFixed(5));
    }
    let videos = slides.map((slide) => slide.querySelector("[data-video]"));
    function show(index) {
      if (current = Math.min(Math.max(index, 0), slides.length - 1), slides.forEach((slide, n) => {
        let active = n === current;
        slide.classList.toggle("is-active", active), slide.setAttribute("aria-hidden", String(!active)), slide.inert = !active;
      }), counter.textContent = `${current + 1} / ${slides.length}`, progress.style.width = `${(current + 1) / slides.length * 100}%`, previous.disabled = current === 0, next.disabled = current === slides.length - 1, location.hash !== `#${current + 1}`)
        history.replaceState(null, "", `#${current + 1}`);
      videos.forEach((frame, n) => {
        if (frame)
          videoOnSlide(frame, n === current);
      }), window.dispatchEvent(new CustomEvent("deck:slide", { detail: slides[current] }));
    }
    function videoOnSlide(frame, active) {
      let video = frame.querySelector("video");
      if (!video)
        return;
      if (!active) {
        video.pause();
        return;
      }
      if (video.currentTime = 0, !still && frame.dataset.autoplay !== "false")
        video.muted = !0, syncSound(frame), video.play().catch(() => {});
    }
    function syncSound(frame) {
      let video = frame.querySelector("video"), sound = frame.querySelector("[data-video-sound]");
      if (!video || !sound)
        return;
      sound.setAttribute("aria-pressed", String(!video.muted)), sound.textContent = video.muted ? messages.soundOn : messages.soundOff;
    }
    for (let frame of videos) {
      if (!frame)
        continue;
      let video = frame.querySelector("video"), toggle = frame.querySelector("[data-video-toggle]");
      if (!video || !toggle)
        continue;
      let sync = () => {
        toggle.textContent = video.paused ? messages.play : messages.pause;
      };
      video.addEventListener("play", sync), video.addEventListener("pause", sync), toggle.addEventListener("click", () => {
        if (video.paused)
          video.play().catch(() => {});
        else
          video.pause();
      }), video.addEventListener("click", () => toggle.click()), frame.querySelector("[data-video-replay]")?.addEventListener("click", () => {
        video.currentTime = 0, video.play().catch(() => {});
      }), frame.querySelector("[data-video-sound]")?.addEventListener("click", () => {
        if (video.muted = !video.muted, syncSound(frame), !video.muted && video.paused)
          video.play().catch(() => {});
      });
    }
    function togglePresent() {
      if (document.fullscreenElement)
        document.exitFullscreen().catch(() => {});
      else
        document.documentElement.requestFullscreen?.().catch(() => {});
    }
    document.addEventListener("fullscreenchange", () => {
      present.textContent = document.fullscreenElement ? messages.exitPresent : messages.present, fit();
    });
    let idle = 0;
    function wake() {
      document.body.classList.remove("is-idle"), clearTimeout(idle), idle = window.setTimeout(() => document.body.classList.add("is-idle"), 2600);
    }
    previous.addEventListener("click", () => show(current - 1)), next.addEventListener("click", () => show(current + 1)), present.addEventListener("click", togglePresent), print.addEventListener("click", () => window.print()), window.addEventListener("resize", fit), window.addEventListener("hashchange", () => show(slideFromHash(location.hash, slides.length))), window.addEventListener("mousemove", wake), window.addEventListener("keydown", (event) => {
      if (wake(), event.ctrlKey || event.metaKey || event.altKey)
        return;
      let target = event.target;
      if (target instanceof HTMLElement && target.closest("button, a, input, textarea")) {
        if (event.key === " " || event.key === "Enter")
          return;
      }
      let step = null;
      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          step = current + 1;
          break;
        case "ArrowLeft":
        case "PageUp":
          step = current - 1;
          break;
        case "Home":
          step = 0;
          break;
        case "End":
          step = slides.length - 1;
          break;
        case "f":
        case "F":
          event.preventDefault(), togglePresent();
          return;
        default:
          return;
      }
      event.preventDefault(), show(step);
    });
    let touchX = null;
    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch")
        touchX = event.clientX;
    }), window.addEventListener("pointerup", (event) => {
      if (touchX === null || event.pointerType !== "touch")
        return;
      let distance = event.clientX - touchX;
      if (touchX = null, Math.abs(distance) > 60)
        show(current + (distance < 0 ? 1 : -1));
    }), document.body.classList.add("is-ready"), fit(), show(current), wake();
  }
  if (typeof document < "u")
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", start);
    else
      start();
})();
