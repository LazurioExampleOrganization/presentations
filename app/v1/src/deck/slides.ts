import type { DeckMessages } from "./messages.ts";
import type {
  AppendixSlide,
  CaseSlide,
  ClosingSlide,
  Language,
  Metric,
  MetricsSlide,
  OptionsSlide,
  ProblemSlide,
  QuoteSlide,
  SectionSlide,
  Slide,
  SlideType,
  Text,
  TimelineSlide,
  TitleSlide,
  VideoSlide,
} from "./source.ts";
import { textIn } from "./source.ts";

/** What a slide renderer knows besides its slide. */
export type RenderContext = {
  language: Language;
  messages: DeckMessages;
  /** The deck shows "Prepared for …" from the link on title and closing slides. */
  personal: boolean;
};

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for HTML content and attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/** Text in the slide's language, escaped; a line break in the source stays a line break. */
function t(value: Text, ctx: RenderContext): string {
  return escapeHtml(textIn(value, ctx.language)).replaceAll("\n", "<br>");
}

function opt(value: Text | undefined, ctx: RenderContext, render: (html: string) => string) {
  return value === undefined ? "" : render(t(value, ctx));
}

function attr(value: string): string {
  return escapeHtml(value);
}

/** The plain title of a slide, for its `data-title` and the outline in the metadata. */
export function slideTitle(slide: Slide, language: Language): string {
  switch (slide.type) {
    case "quote":
      return textIn(slide.author, language);
    default:
      return textIn(slide.title, language);
  }
}

const personalLine = (ctx: RenderContext) =>
  ctx.personal ? '<p class="personal" data-personal hidden></p>' : "";

function metricHtml(metric: Metric, ctx: RenderContext): string {
  return (
    '<div class="metric">' +
    `<p class="metric-value">${t(metric.value, ctx)}</p>` +
    `<p class="metric-label">${t(metric.label, ctx)}</p>` +
    opt(metric.note, ctx, (note) => `<p class="metric-note">${note}</p>`) +
    "</div>"
  );
}

const renderers: { [type in SlideType]: (slide: never, ctx: RenderContext) => string } = {
  title: (slide: TitleSlide, ctx) =>
    opt(slide.eyebrow, ctx, (x) => `<p class="running-head">${x}</p>`) +
    '<div class="title-copy">' +
    `<h1 class="display">${t(slide.title, ctx)}</h1>` +
    opt(slide.subtitle, ctx, (x) => `<p class="lede">${x}</p>`) +
    personalLine(ctx) +
    opt(slide.meta, ctx, (x) => `<p class="slide-meta">${x}</p>`) +
    "</div>" +
    (slide.image
      ? `<img class="title-image" src="./${attr(slide.image.src)}" alt="${attr(textIn(slide.image.alt, ctx.language))}">`
      : ""),
  section: (slide: SectionSlide, ctx) =>
    opt(slide.label, ctx, (x) => `<p class="running-head">${x}</p>`) +
    `<h2 class="section-title">${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`),
  problem: (slide: ProblemSlide, ctx) =>
    `<h2>${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
    `<ol class="points points-${slide.points.length}">` +
    slide.points
      .map((point) => `<li><h3>${t(point.title, ctx)}</h3><p>${t(point.text, ctx)}</p></li>`)
      .join("") +
    "</ol>",
  quote: (slide: QuoteSlide, ctx) =>
    "<figure>" +
    `<blockquote><p>${t(slide.quote, ctx)}</p></blockquote>` +
    `<figcaption><span class="quote-author">${t(slide.author, ctx)}</span>` +
    opt(slide.role, ctx, (x) => `<span class="quote-role">${x}</span>`) +
    "</figcaption></figure>",
  options: (slide: OptionsSlide, ctx) =>
    `<h2>${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
    `<div class="options options-${slide.options.length}">` +
    slide.options
      .map(
        (option) =>
          `<article class="option${option.highlight ? " is-highlight" : ""}">` +
          opt(option.badge, ctx, (x) => `<p class="badge">${x}</p>`) +
          `<h3>${t(option.name, ctx)}</h3>` +
          opt(option.summary, ctx, (x) => `<p class="option-summary">${x}</p>`) +
          `<ul>${option.points.map((point) => `<li>${t(point, ctx)}</li>`).join("")}</ul>` +
          "</article>",
      )
      .join("") +
    "</div>",
  case: (slide: CaseSlide, ctx) =>
    '<div class="case-copy">' +
    `<h2>${t(slide.title, ctx)}</h2>` +
    `<p class="case-client">${t(slide.client, ctx)}</p>` +
    opt(slide.context, ctx, (x) => `<p class="lede">${x}</p>`) +
    '<div class="case-story">' +
    `<div><h3>${escapeHtml(ctx.messages.challenge)}</h3><p>${t(slide.challenge, ctx)}</p></div>` +
    `<div><h3>${escapeHtml(ctx.messages.solution)}</h3><p>${t(slide.solution, ctx)}</p></div>` +
    "</div></div>" +
    `<div class="case-results">${slide.results.map((metric) => metricHtml(metric, ctx)).join("")}</div>` +
    (slide.image
      ? `<img class="case-image" src="./${attr(slide.image.src)}" alt="${attr(textIn(slide.image.alt, ctx.language))}">`
      : ""),
  timeline: (slide: TimelineSlide, ctx) =>
    `<h2>${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
    `<ol class="steps steps-${slide.steps.length}">` +
    slide.steps
      .map(
        (step, index) =>
          `<li style="--step: ${index}">` +
          '<span class="step-dot" aria-hidden="true"></span>' +
          `<h3>${t(step.title, ctx)}</h3>` +
          opt(step.when, ctx, (x) => `<p class="step-when">${x}</p>`) +
          opt(step.text, ctx, (x) => `<p>${x}</p>`) +
          "</li>",
      )
      .join("") +
    "</ol>",
  metrics: (slide: MetricsSlide, ctx) => {
    const chart = slide.chart;
    const top = chart ? Math.max(...chart.bars.map((bar) => bar.value), 1) : 1;
    return (
      `<h2>${t(slide.title, ctx)}</h2>` +
      opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
      `<div class="metrics-body${chart ? " has-chart" : ""}">` +
      `<div class="metrics metrics-${slide.metrics.length}">${slide.metrics.map((metric) => metricHtml(metric, ctx)).join("")}</div>` +
      (chart
        ? '<figure class="chart">' +
          `<figcaption>${t(chart.label, ctx)}${opt(chart.unit, ctx, (x) => ` <span class="chart-unit">(${x})</span>`)}</figcaption>` +
          '<ol class="bars">' +
          chart.bars
            .map(
              (bar, index) =>
                `<li class="${index === chart.bars.length - 1 ? "is-current" : ""}" style="--value: ${(bar.value / top).toFixed(4)}; --bar: ${index}">` +
                `<span class="bar-value">${escapeHtml(bar.value.toLocaleString(ctx.language === "cs" ? "cs-CZ" : "en-GB"))}</span>` +
                '<span class="bar" aria-hidden="true"></span>' +
                `<span class="bar-label">${t(bar.label, ctx)}</span></li>`,
            )
            .join("") +
          "</ol></figure>"
        : "") +
      "</div>"
    );
  },
  video: (slide: VideoSlide, ctx) => {
    const { video } = slide;
    const captions = video.captions?.[ctx.language];
    const m = ctx.messages;
    return (
      `<h2>${t(slide.title, ctx)}</h2>` +
      opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
      `<figure class="video" data-video${video.autoplay === false ? ' data-autoplay="false"' : ""}>` +
      `<video src="./${attr(video.src)}" poster="./${attr(video.poster)}" muted playsinline preload="metadata" aria-label="${attr(`${m.video}: ${slideTitle(slide, ctx.language)}`)}">` +
      (captions
        ? `<track kind="captions" src="./${attr(captions)}" srclang="${ctx.language}" label="${attr(m.languageName)}" default>`
        : "") +
      "</video>" +
      `<img class="video-print" src="./${attr(video.poster)}" alt="">` +
      '<div class="video-controls">' +
      `<button type="button" data-video-toggle data-play="${attr(m.play)}" data-pause="${attr(m.pause)}">${escapeHtml(m.play)}</button>` +
      `<button type="button" data-video-replay>${escapeHtml(m.replay)}</button>` +
      (video.audio
        ? `<button type="button" data-video-sound aria-pressed="false" data-on="${attr(m.soundOn)}" data-off="${attr(m.soundOff)}">${escapeHtml(m.soundOn)}</button>`
        : "") +
      "</div></figure>"
    );
  },
  appendix: (slide: AppendixSlide, ctx) =>
    `<p class="running-head">${escapeHtml(ctx.messages.appendix)}</p>` +
    `<h2>${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
    '<div class="appendix-body">' +
    (slide.items
      ? `<dl class="items">${slide.items.map((item) => `<div><dt>${t(item.title, ctx)}</dt><dd>${t(item.text, ctx)}</dd></div>`).join("")}</dl>`
      : "") +
    (slide.table
      ? '<table class="table"><thead><tr>' +
        slide.table.columns.map((column) => `<th scope="col">${t(column, ctx)}</th>`).join("") +
        "</tr></thead><tbody>" +
        slide.table.rows
          .map(
            (row) =>
              `<tr>${row.map((cell, index) => (index === 0 ? `<th scope="row">${t(cell, ctx)}</th>` : `<td>${t(cell, ctx)}</td>`)).join("")}</tr>`,
          )
          .join("") +
        "</tbody></table>"
      : "") +
    "</div>",
  closing: (slide: ClosingSlide, ctx) =>
    '<div class="closing-copy">' +
    `<h2 class="display">${t(slide.title, ctx)}</h2>` +
    opt(slide.lede, ctx, (x) => `<p class="lede">${x}</p>`) +
    personalLine(ctx) +
    (slide.actions
      ? `<p class="actions">${slide.actions
          .map(
            (action, index) =>
              `<a class="action${index === 0 ? " is-primary" : ""}" href="${attr(action.href)}"${action.href.startsWith("https://") ? ' target="_blank" rel="noreferrer"' : ""}>${t(action.label, ctx)}</a>`,
          )
          .join("")}</p>`
      : "") +
    "</div>" +
    (slide.contact
      ? '<address class="contact">' +
        `<p class="contact-name">${t(slide.contact.name, ctx)}</p>` +
        opt(slide.contact.role, ctx, (x) => `<p class="contact-role">${x}</p>`) +
        (slide.contact.email
          ? `<p><a href="mailto:${attr(slide.contact.email)}">${escapeHtml(slide.contact.email)}</a></p>`
          : "") +
        (slide.contact.phone
          ? `<p><a href="tel:${attr(slide.contact.phone.replaceAll(" ", ""))}">${escapeHtml(slide.contact.phone)}</a></p>`
          : "") +
        "</address>"
      : ""),
};

/** Tone a slide type has unless the source names one. */
const DEFAULT_TONE: { [type in SlideType]: "light" | "dark" } = {
  title: "dark",
  section: "dark",
  problem: "light",
  quote: "light",
  options: "light",
  case: "light",
  timeline: "light",
  metrics: "light",
  video: "light",
  appendix: "light",
  closing: "dark",
};

/** One slide as a `<section class="slide">` of the deck page. */
export function renderSlide(slide: Slide, index: number, ctx: RenderContext): string {
  const tone = slide.tone ?? DEFAULT_TONE[slide.type];
  const render = renderers[slide.type] as (slide: Slide, ctx: RenderContext) => string;
  return (
    `<section class="slide slide--${slide.type}" data-theme="${tone}" data-type="${slide.type}" data-index="${index}" ` +
    `data-title="${attr(slideTitle(slide, ctx.language))}" aria-label="${attr(slideTitle(slide, ctx.language))}">` +
    `<div class="slide-inner">${render(slide, ctx)}</div>` +
    (slide.notes ? `<aside class="notes" hidden>${t(slide.notes, ctx)}</aside>` : "") +
    "</section>"
  );
}
