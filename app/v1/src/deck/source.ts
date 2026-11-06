// The source of a deck: `data/v1/decks/<slug>/deck.source.json`, written by
// people and agents, built into `index.html` (and `index.<language>.html` for
// every further language) by `bun run deck:build`. This file holds the shape
// of the source and its validation; every error names the path of the field.

export const SOURCE_SCHEMA = "lazurio.presentation.source.v1";
export const LANGUAGES = ["cs", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Text for people: one string for every language, or one per language. */
export type Text = string | { readonly [language in Language]?: string };
export type Tone = "light" | "dark";

export type Image = { src: string; alt: Text };
export type Video = {
  src: string;
  poster: string;
  /** WebVTT captions per language, files in `media/`. */
  captions?: { readonly [language in Language]?: string };
  /** The file has a sound track: the slide offers a sound button. Sound never starts by itself. */
  audio?: boolean;
  /** Start muted when the slide opens (default true; never with reduced motion). */
  autoplay?: boolean;
};
export type Point = { title: Text; text: Text };
export type Metric = { value: Text; label: Text; note?: Text };
export type Bar = { label: Text; value: number };
export type Chart = { label: Text; unit?: Text; bars: Bar[] };
export type Option = {
  name: Text;
  summary?: Text;
  points: Text[];
  badge?: Text;
  highlight?: boolean;
};
export type Step = { when?: Text; title: Text; text?: Text };
export type Table = { columns: Text[]; rows: Text[][] };
export type Contact = { name: Text; role?: Text; email?: string; phone?: string };
export type Action = { label: Text; href: string };

type Common = { tone?: Tone; notes?: Text };
export type TitleSlide = Common & {
  type: "title";
  eyebrow?: Text;
  title: Text;
  subtitle?: Text;
  meta?: Text;
  image?: Image;
};
export type SectionSlide = Common & { type: "section"; label?: Text; title: Text; lede?: Text };
export type ProblemSlide = Common & { type: "problem"; title: Text; lede?: Text; points: Point[] };
export type QuoteSlide = Common & { type: "quote"; quote: Text; author: Text; role?: Text };
export type OptionsSlide = Common & {
  type: "options";
  title: Text;
  lede?: Text;
  options: Option[];
};
export type CaseSlide = Common & {
  type: "case";
  title: Text;
  client: Text;
  context?: Text;
  challenge: Text;
  solution: Text;
  results: Metric[];
  image?: Image;
};
export type TimelineSlide = Common & {
  type: "timeline";
  title: Text;
  lede?: Text;
  steps: Step[];
};
export type MetricsSlide = Common & {
  type: "metrics";
  title: Text;
  lede?: Text;
  metrics: Metric[];
  chart?: Chart;
};
export type VideoSlide = Common & { type: "video"; title: Text; lede?: Text; video: Video };
export type AppendixSlide = Common & {
  type: "appendix";
  title: Text;
  lede?: Text;
  items?: Point[];
  table?: Table;
};
export type ClosingSlide = Common & {
  type: "closing";
  title: Text;
  lede?: Text;
  contact?: Contact;
  actions?: Action[];
};

export type Slide =
  | TitleSlide
  | SectionSlide
  | ProblemSlide
  | QuoteSlide
  | OptionsSlide
  | CaseSlide
  | TimelineSlide
  | MetricsSlide
  | VideoSlide
  | AppendixSlide
  | ClosingSlide;
export type SlideType = Slide["type"];

/** Every slide type, in the order the documentation and the sample deck use. */
export const SLIDE_TYPES = [
  "title",
  "section",
  "problem",
  "quote",
  "options",
  "case",
  "timeline",
  "metrics",
  "video",
  "appendix",
  "closing",
] as const satisfies readonly SlideType[];

export type DeckSource = {
  schema_version: typeof SOURCE_SCHEMA;
  /** The deck's languages; the first is its primary language (`index.html`). */
  languages: Language[];
  title: Text;
  purpose?: string;
  status?: string;
  owner?: Text;
  audience?: Text[];
  sources?: Text[];
  primary_goal?: Text;
  created_at: string;
  updated_at?: string;
  /** Show "Prepared for …" on the title and closing slides from the link (default true). */
  personal?: boolean;
  slides: Slide[];
};

export class DeckSourceError extends Error {
  /** The field the error is about, such as `deck.slides[3].points[1].title`. */
  readonly path: string;
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "DeckSourceError";
    this.path = path;
  }
}

const IMAGE = /\.(jpe?g|png|webp|svg)$/i;
const VIDEO = /\.(mp4|webm)$/i;
const CAPTIONS = /\.vtt$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE = /^[a-z0-9][a-z0-9-]*$/;

type Ctx = { languages: readonly Language[]; mediaExists: (path: string) => boolean };
type Obj = Record<string, unknown>;

function object(value: unknown, path: string, allowed: readonly string[]): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DeckSourceError(path, "must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new DeckSourceError(`${path}.${key}`, `is not a field here (${allowed.join(", ")})`);
    }
  }
  return value as Obj;
}

function plain(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DeckSourceError(path, "must be a non-empty string");
  }
  return value;
}

function text(value: unknown, path: string, ctx: Ctx): Text {
  if (typeof value === "string") return plain(value, path);
  const record = object(value, path, ctx.languages);
  for (const language of ctx.languages) plain(record[language], `${path}.${language}`);
  return record as Text;
}

function optional<T>(value: unknown, read: (value: unknown) => T): T | undefined {
  return value === undefined ? undefined : read(value);
}

function list<T>(
  value: unknown,
  path: string,
  [min, max]: [number, number],
  item: (value: unknown, path: string) => T,
): T[] {
  if (!Array.isArray(value)) throw new DeckSourceError(path, "must be a list");
  if (value.length < min || value.length > max) {
    throw new DeckSourceError(path, `must have ${min} to ${max} items, has ${value.length}`);
  }
  return value.map((entry, index) => item(entry, `${path}[${index}]`));
}

function media(value: unknown, path: string, kind: RegExp, ctx: Ctx): string {
  const src = plain(value, path);
  const segments = src.split("/");
  if (
    segments[0] !== "media" ||
    segments.length < 2 ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
    src.includes("\\")
  ) {
    throw new DeckSourceError(path, `must be a file in the deck's media/ folder, got "${src}"`);
  }
  if (!kind.test(src)) throw new DeckSourceError(path, `has an unsupported file type: ${src}`);
  if (!ctx.mediaExists(src)) throw new DeckSourceError(path, `names a missing file: ${src}`);
  return src;
}

function image(value: unknown, path: string, ctx: Ctx): Image {
  const o = object(value, path, ["src", "alt"]);
  return { src: media(o.src, `${path}.src`, IMAGE, ctx), alt: text(o.alt, `${path}.alt`, ctx) };
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new DeckSourceError(path, "must be true or false");
  return value;
}

function point(value: unknown, path: string, ctx: Ctx): Point {
  const o = object(value, path, ["title", "text"]);
  return { title: text(o.title, `${path}.title`, ctx), text: text(o.text, `${path}.text`, ctx) };
}

function metric(value: unknown, path: string, ctx: Ctx): Metric {
  const o = object(value, path, ["value", "label", "note"]);
  return {
    value: text(o.value, `${path}.value`, ctx),
    label: text(o.label, `${path}.label`, ctx),
    note: optional(o.note, (v) => text(v, `${path}.note`, ctx)),
  };
}

function href(value: unknown, path: string): string {
  const link = plain(value, path);
  if (!/^(https:\/\/|mailto:|tel:)/.test(link)) {
    throw new DeckSourceError(path, "must start with https://, mailto: or tel:");
  }
  return link;
}

const COMMON = ["type", "tone", "notes"] as const;

function common(o: Obj, path: string, ctx: Ctx): Common {
  const tone = o.tone;
  if (tone !== undefined && tone !== "light" && tone !== "dark") {
    throw new DeckSourceError(`${path}.tone`, 'must be "light" or "dark"');
  }
  return {
    tone: tone as Tone | undefined,
    notes: optional(o.notes, (v) => text(v, `${path}.notes`, ctx)),
  };
}

const readers: { [type in SlideType]: (o: Obj, path: string, ctx: Ctx) => Slide } = {
  title: (o, p, ctx) => {
    object(o, p, [...COMMON, "eyebrow", "title", "subtitle", "meta", "image"]);
    return {
      type: "title",
      ...common(o, p, ctx),
      eyebrow: optional(o.eyebrow, (v) => text(v, `${p}.eyebrow`, ctx)),
      title: text(o.title, `${p}.title`, ctx),
      subtitle: optional(o.subtitle, (v) => text(v, `${p}.subtitle`, ctx)),
      meta: optional(o.meta, (v) => text(v, `${p}.meta`, ctx)),
      image: optional(o.image, (v) => image(v, `${p}.image`, ctx)),
    };
  },
  section: (o, p, ctx) => {
    object(o, p, [...COMMON, "label", "title", "lede"]);
    return {
      type: "section",
      ...common(o, p, ctx),
      label: optional(o.label, (v) => text(v, `${p}.label`, ctx)),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
    };
  },
  problem: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "points"]);
    return {
      type: "problem",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      points: list(o.points, `${p}.points`, [2, 4], (v, q) => point(v, q, ctx)),
    };
  },
  quote: (o, p, ctx) => {
    object(o, p, [...COMMON, "quote", "author", "role"]);
    return {
      type: "quote",
      ...common(o, p, ctx),
      quote: text(o.quote, `${p}.quote`, ctx),
      author: text(o.author, `${p}.author`, ctx),
      role: optional(o.role, (v) => text(v, `${p}.role`, ctx)),
    };
  },
  options: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "options"]);
    const options = list(o.options, `${p}.options`, [2, 4], (v, q): Option => {
      const x = object(v, q, ["name", "summary", "points", "badge", "highlight"]);
      return {
        name: text(x.name, `${q}.name`, ctx),
        summary: optional(x.summary, (w) => text(w, `${q}.summary`, ctx)),
        points: list(x.points, `${q}.points`, [1, 5], (w, r) => text(w, r, ctx)),
        badge: optional(x.badge, (w) => text(w, `${q}.badge`, ctx)),
        highlight: optional(x.highlight, (w) => bool(w, `${q}.highlight`)),
      };
    });
    if (options.filter((option) => option.highlight).length > 1) {
      throw new DeckSourceError(`${p}.options`, "highlights at most one option");
    }
    return {
      type: "options",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      options,
    };
  },
  case: (o, p, ctx) => {
    object(o, p, [
      ...COMMON,
      "title",
      "client",
      "context",
      "challenge",
      "solution",
      "results",
      "image",
    ]);
    return {
      type: "case",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      client: text(o.client, `${p}.client`, ctx),
      context: optional(o.context, (v) => text(v, `${p}.context`, ctx)),
      challenge: text(o.challenge, `${p}.challenge`, ctx),
      solution: text(o.solution, `${p}.solution`, ctx),
      results: list(o.results, `${p}.results`, [1, 3], (v, q) => metric(v, q, ctx)),
      image: optional(o.image, (v) => image(v, `${p}.image`, ctx)),
    };
  },
  timeline: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "steps"]);
    return {
      type: "timeline",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      steps: list(o.steps, `${p}.steps`, [2, 6], (v, q): Step => {
        const x = object(v, q, ["when", "title", "text"]);
        return {
          when: optional(x.when, (w) => text(w, `${q}.when`, ctx)),
          title: text(x.title, `${q}.title`, ctx),
          text: optional(x.text, (w) => text(w, `${q}.text`, ctx)),
        };
      }),
    };
  },
  metrics: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "metrics", "chart"]);
    return {
      type: "metrics",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      metrics: list(o.metrics, `${p}.metrics`, [1, 4], (v, q) => metric(v, q, ctx)),
      chart: optional(o.chart, (v): Chart => {
        const q = `${p}.chart`;
        const x = object(v, q, ["label", "unit", "bars"]);
        return {
          label: text(x.label, `${q}.label`, ctx),
          unit: optional(x.unit, (w) => text(w, `${q}.unit`, ctx)),
          bars: list(x.bars, `${q}.bars`, [2, 8], (w, r): Bar => {
            const b = object(w, r, ["label", "value"]);
            if (typeof b.value !== "number" || !Number.isFinite(b.value) || b.value < 0) {
              throw new DeckSourceError(`${r}.value`, "must be a number of zero or more");
            }
            return { label: text(b.label, `${r}.label`, ctx), value: b.value };
          }),
        };
      }),
    };
  },
  video: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "video"]);
    const q = `${p}.video`;
    const v = object(o.video, q, ["src", "poster", "captions", "audio", "autoplay"]);
    const captions = optional(v.captions, (w) => {
      const c = object(w, `${q}.captions`, ctx.languages);
      for (const [language, file] of Object.entries(c)) {
        media(file, `${q}.captions.${language}`, CAPTIONS, ctx);
      }
      return c as Video["captions"];
    });
    return {
      type: "video",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (w) => text(w, `${p}.lede`, ctx)),
      video: {
        src: media(v.src, `${q}.src`, VIDEO, ctx),
        poster: media(v.poster, `${q}.poster`, IMAGE, ctx),
        captions,
        audio: optional(v.audio, (w) => bool(w, `${q}.audio`)),
        autoplay: optional(v.autoplay, (w) => bool(w, `${q}.autoplay`)),
      },
    };
  },
  appendix: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "items", "table"]);
    const items = optional(o.items, (v) =>
      list(v, `${p}.items`, [1, 6], (w, q) => point(w, q, ctx)),
    );
    const table = optional(o.table, (v): Table => {
      const q = `${p}.table`;
      const x = object(v, q, ["columns", "rows"]);
      const columns = list(x.columns, `${q}.columns`, [2, 5], (w, r) => text(w, r, ctx));
      const rows = list(x.rows, `${q}.rows`, [1, 8], (w, r) =>
        list(w, r, [columns.length, columns.length], (cell, s) => text(cell, s, ctx)),
      );
      return { columns, rows };
    });
    if (!items && !table) throw new DeckSourceError(p, "needs items, a table or both");
    return {
      type: "appendix",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      items,
      table,
    };
  },
  closing: (o, p, ctx) => {
    object(o, p, [...COMMON, "title", "lede", "contact", "actions"]);
    return {
      type: "closing",
      ...common(o, p, ctx),
      title: text(o.title, `${p}.title`, ctx),
      lede: optional(o.lede, (v) => text(v, `${p}.lede`, ctx)),
      contact: optional(o.contact, (v): Contact => {
        const q = `${p}.contact`;
        const x = object(v, q, ["name", "role", "email", "phone"]);
        return {
          name: text(x.name, `${q}.name`, ctx),
          role: optional(x.role, (w) => text(w, `${q}.role`, ctx)),
          email: optional(x.email, (w) => plain(w, `${q}.email`)),
          phone: optional(x.phone, (w) => plain(w, `${q}.phone`)),
        };
      }),
      actions: optional(o.actions, (v) =>
        list(v, `${p}.actions`, [1, 2], (w, q): Action => {
          const x = object(w, q, ["label", "href"]);
          return { label: text(x.label, `${q}.label`, ctx), href: href(x.href, `${q}.href`) };
        }),
      ),
    };
  },
};

function slide(value: unknown, path: string, ctx: Ctx): Slide {
  const o = object(value, path, Object.keys(value ?? {}));
  const type = o.type;
  if (typeof type !== "string" || !(SLIDE_TYPES as readonly string[]).includes(type)) {
    throw new DeckSourceError(`${path}.type`, `must be one of ${SLIDE_TYPES.join(", ")}`);
  }
  return readers[type as SlideType](o, path, ctx);
}

/**
 * Validates a parsed `deck.source.json`. `mediaExists` answers whether a path
 * relative to the deck directory (always `media/…`) is a file.
 */
export function parseDeckSource(
  value: unknown,
  mediaExists: (path: string) => boolean,
): DeckSource {
  const o = object(value, "deck", [
    "$schema",
    "schema_version",
    "languages",
    "title",
    "purpose",
    "status",
    "owner",
    "audience",
    "sources",
    "primary_goal",
    "created_at",
    "updated_at",
    "personal",
    "slides",
  ]);
  if (o.schema_version !== SOURCE_SCHEMA) {
    throw new DeckSourceError("deck.schema_version", `must be "${SOURCE_SCHEMA}"`);
  }
  const languages = list(o.languages, "deck.languages", [1, LANGUAGES.length], (v, p) => {
    if (!(LANGUAGES as readonly unknown[]).includes(v)) {
      throw new DeckSourceError(p, `must be one of ${LANGUAGES.join(", ")}`);
    }
    return v as Language;
  });
  if (new Set(languages).size !== languages.length) {
    throw new DeckSourceError("deck.languages", "names a language twice");
  }
  const ctx: Ctx = { languages, mediaExists };
  const date = (v: unknown, p: string) => {
    const d = plain(v, p);
    if (!DATE.test(d)) throw new DeckSourceError(p, "must be a date YYYY-MM-DD");
    return d;
  };
  const code = (v: unknown, p: string) => {
    const c = plain(v, p);
    if (!CODE.test(c)) throw new DeckSourceError(p, "must be a lowercase code such as offer");
    return c;
  };
  return {
    schema_version: SOURCE_SCHEMA,
    languages,
    title: text(o.title, "deck.title", ctx),
    purpose: optional(o.purpose, (v) => code(v, "deck.purpose")),
    status: optional(o.status, (v) => code(v, "deck.status")),
    owner: optional(o.owner, (v) => text(v, "deck.owner", ctx)),
    audience: optional(o.audience, (v) =>
      list(v, "deck.audience", [1, 6], (w, p) => text(w, p, ctx)),
    ),
    sources: optional(o.sources, (v) =>
      list(v, "deck.sources", [1, 12], (w, p) => text(w, p, ctx)),
    ),
    primary_goal: optional(o.primary_goal, (v) => text(v, "deck.primary_goal", ctx)),
    created_at: date(o.created_at, "deck.created_at"),
    updated_at: optional(o.updated_at, (v) => date(v, "deck.updated_at")),
    personal: optional(o.personal, (v) => bool(v, "deck.personal")),
    slides: list(o.slides, "deck.slides", [1, 60], (v, p) => slide(v, p, ctx)),
  };
}

/** The text in one language: a plain string is the same in every language. */
export function textIn(value: Text, language: Language): string {
  if (typeof value === "string") return value;
  const translated = value[language];
  if (translated === undefined) throw new Error(`no ${language} text`);
  return translated;
}
