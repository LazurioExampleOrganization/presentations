# Lazurio design system

The library and the synthetic starter use the Lazurio design system: canonical
`lz-button`, `lz-field` and `lz-article-card` components, neutral paper/white
surfaces, black actions and ultramarine links. Inter Tight Variable and Geist
Mono are hosted locally with their SIL OFL licenses.

`app/v1/public/lazurio/` holds a frozen snapshot of the canonical Lazurio token
and component files. The snapshot keeps every value of the source but drops
its comments (internal decision history), so `tokens.css` and
`components.css` are not byte-identical to the source. `vendor.lock.json`
records the source commit, the Fontsource 5.3.0 font packages and the hash of
every shipped file. The standalone starter carries the same frozen files in
its own `lazurio/` folder, so it can open without the app or a CDN.

The Module Standard forbids cross-repository imports and the design system has
no distributed package, so the files are vendored. Neither copy is edited.
Refresh from a reviewed source commit, update the lock and both copies, run
checks/tests, and verify the library, detail, authoring brief and slides in the
browser. The resource contract checks both copies against the frozen hashes.

Font licenses cover font files only. The template, including the design
snapshot, is distributed under the MIT License; the license grants no right to
the Lazurio name and marks, see [NOTICE](../NOTICE). Receiving Organizations
may adopt their own approved identity through a reviewed consumer change.
