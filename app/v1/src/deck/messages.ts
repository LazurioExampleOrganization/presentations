import type { Language } from "./source.ts";

/**
 * The words of a built deck's own controls, in the deck's language. The build
 * puts the set of each language into its page, so the runtime script stays
 * the same for every language.
 */
export type DeckMessages = {
  controls: string;
  previous: string;
  next: string;
  present: string;
  exitPresent: string;
  print: string;
  library: string;
  /** `{who}` is the person and Organization from the link. */
  preparedFor: string;
  play: string;
  pause: string;
  replay: string;
  soundOn: string;
  soundOff: string;
  appendix: string;
  challenge: string;
  solution: string;
  video: string;
  /** The name of this language in itself, for the switch from the other language. */
  languageName: string;
};

export const DECK_MESSAGES: { [language in Language]: DeckMessages } = {
  cs: {
    controls: "Ovládání prezentace",
    previous: "Předchozí slide",
    next: "Další slide",
    present: "Prezentovat",
    exitPresent: "Ukončit",
    print: "Tisk / PDF",
    library: "Zpět do knihovny",
    preparedFor: "Připraveno pro {who}",
    play: "Přehrát",
    pause: "Pozastavit",
    replay: "Přehrát znovu",
    soundOn: "Zapnout zvuk",
    soundOff: "Vypnout zvuk",
    appendix: "Příloha",
    challenge: "Výzva",
    solution: "Řešení",
    video: "Video",
    languageName: "Čeština",
  },
  en: {
    controls: "Presentation controls",
    previous: "Previous slide",
    next: "Next slide",
    present: "Present",
    exitPresent: "Exit",
    print: "Print / PDF",
    library: "Back to the library",
    preparedFor: "Prepared for {who}",
    play: "Play",
    pause: "Pause",
    replay: "Play again",
    soundOn: "Sound on",
    soundOff: "Sound off",
    appendix: "Appendix",
    challenge: "Challenge",
    solution: "Solution",
    video: "Video",
    languageName: "English",
  },
};
