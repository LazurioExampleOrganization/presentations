// The runtime of a built deck (assets/deck.js), bundled by `bun run
// deck:build`. It works from a file, from the Presentations App and from any
// static host: no network, no storage. The slide position lives in the address
// (#3), and a personal version comes from the link only (?for=…&org=…, in
// Czech also ?pro=…&firma=…); nothing is written anywhere.

type Messages = {
  present: string;
  exitPresent: string;
  preparedFor: string;
  play: string;
  pause: string;
  soundOn: string;
  soundOff: string;
};

import { personalWho, slideFromHash } from "./link.ts";

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;
function start() {
  const slides = Array.from(document.querySelectorAll<HTMLElement>(".slide"));
  if (slides.length === 0) return;
  const counter = document.getElementById("counter") as HTMLElement;
  const progress = document.getElementById("progress") as HTMLElement;
  const previous = document.getElementById("previous") as HTMLButtonElement;
  const next = document.getElementById("next") as HTMLButtonElement;
  const present = document.getElementById("present") as HTMLButtonElement;
  const print = document.getElementById("print") as HTMLButtonElement;
  const library = document.getElementById("library") as HTMLAnchorElement | null;
  const messages = JSON.parse(
    document.getElementById("deck-messages")?.textContent ?? "{}",
  ) as Messages;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = slideFromHash(location.hash, slides.length);

  // Opened as a file there is no library to go back to.
  if (library && location.protocol === "file:") library.hidden = true;

  // A personal version: the link names the person and their Organization.
  const who = personalWho(location.search);
  if (who) {
    for (const line of document.querySelectorAll<HTMLElement>("[data-personal]")) {
      line.textContent = messages.preparedFor.replace("{who}", who);
      line.hidden = false;
    }
  }
  // The language switch keeps the personal link and the slide.
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-language-switch]")) {
    link.addEventListener("click", () => {
      link.href = `${link.href.split(/[?#]/)[0]}${location.search}#${current + 1}`;
    });
  }

  function fit() {
    const width = Math.max(1, document.documentElement.clientWidth);
    const height = Math.max(1, document.documentElement.clientHeight);
    const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
    document.documentElement.style.setProperty("--deck-scale", scale.toFixed(5));
  }

  const videos = slides.map((slide) => slide.querySelector<HTMLElement>("[data-video]"));

  function show(index: number) {
    current = Math.min(Math.max(index, 0), slides.length - 1);
    slides.forEach((slide, n) => {
      const active = n === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    counter.textContent = `${current + 1} / ${slides.length}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    if (location.hash !== `#${current + 1}`) history.replaceState(null, "", `#${current + 1}`);
    videos.forEach((frame, n) => {
      if (frame) videoOnSlide(frame, n === current);
    });
    window.dispatchEvent(new CustomEvent("deck:slide", { detail: slides[current] }));
  }

  // Videos start muted when their slide opens and stop when it closes. Sound
  // starts only with its button; reduced motion starts nothing by itself.
  function videoOnSlide(frame: HTMLElement, active: boolean) {
    const video = frame.querySelector("video");
    if (!video) return;
    if (!active) {
      video.pause();
      return;
    }
    video.currentTime = 0;
    if (!still && frame.dataset.autoplay !== "false") {
      video.muted = true;
      syncSound(frame);
      void video.play().catch(() => {});
    }
  }
  function syncSound(frame: HTMLElement) {
    const video = frame.querySelector("video");
    const sound = frame.querySelector<HTMLButtonElement>("[data-video-sound]");
    if (!video || !sound) return;
    sound.setAttribute("aria-pressed", String(!video.muted));
    sound.textContent = video.muted ? messages.soundOn : messages.soundOff;
  }
  for (const frame of videos) {
    if (!frame) continue;
    const video = frame.querySelector("video");
    const toggle = frame.querySelector<HTMLButtonElement>("[data-video-toggle]");
    if (!video || !toggle) continue;
    const sync = () => {
      toggle.textContent = video.paused ? messages.play : messages.pause;
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    toggle.addEventListener("click", () => {
      if (video.paused) void video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener("click", () => toggle.click());
    frame.querySelector("[data-video-replay]")?.addEventListener("click", () => {
      video.currentTime = 0;
      void video.play().catch(() => {});
    });
    frame.querySelector("[data-video-sound]")?.addEventListener("click", () => {
      video.muted = !video.muted;
      syncSound(frame);
      if (!video.muted && video.paused) void video.play().catch(() => {});
    });
  }

  function togglePresent() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }
  document.addEventListener("fullscreenchange", () => {
    present.textContent = document.fullscreenElement ? messages.exitPresent : messages.present;
    fit();
  });

  let idle = 0;
  function wake() {
    document.body.classList.remove("is-idle");
    clearTimeout(idle);
    idle = window.setTimeout(() => document.body.classList.add("is-idle"), 2600);
  }

  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  present.addEventListener("click", togglePresent);
  print.addEventListener("click", () => window.print());
  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => show(slideFromHash(location.hash, slides.length)));
  window.addEventListener("mousemove", wake);
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    wake();
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button, a, input, textarea")) {
      if (event.key === " " || event.key === "Enter") return;
    }
    let step: number | null = null;
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
        event.preventDefault();
        togglePresent();
        return;
      default:
        return;
    }
    event.preventDefault();
    show(step);
  });
  // A swipe on a touch screen moves one slide.
  let touchX: number | null = null;
  window.addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.pointerType === "touch") touchX = event.clientX;
  });
  window.addEventListener("pointerup", (event: PointerEvent) => {
    if (touchX === null || event.pointerType !== "touch") return;
    const distance = event.clientX - touchX;
    touchX = null;
    if (Math.abs(distance) > 60) show(current + (distance < 0 ? 1 : -1));
  });

  document.body.classList.add("is-ready");
  fit();
  show(current);
  wake();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
}
