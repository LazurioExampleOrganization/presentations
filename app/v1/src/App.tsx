import { greeting } from "./greeting.ts";

const TITLE = "Presentations";
const MODULE = "presentations";
const ORGANIZATION = "LazurioExampleOrganization";

export function App() {
  return (
    <main>
      <h1>{greeting(TITLE)}</h1>
      <p>
        Modul {MODULE} Organizace {ORGANIZATION} běží podle Lazurio Module Standardu.
      </p>
    </main>
  );
}
