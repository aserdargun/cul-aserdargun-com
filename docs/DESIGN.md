# CUL design reference and implementation review

Reference: [generated complete workbench concept](assets/design-concept.png), produced with the built-in image generation tool on 2026-09-20. It is a design reference, never rendered as interactive application UI.

Prompt summary: complete desktop CUL workbench in Turkish; dark neutral background, restrained lime/cyan, grotesk typography and monospace evidence; three navigation sections; short Observe/Act/Verify introduction; six numbered scenarios at left, working Atlas record list/form in the center, four-part evidence inspector at right, playback and event trace underneath. Fixed 640 × 480 logical environment, mobile bounded scrolling, no fictitious benchmarks or model claims. The generation output included unrequested browser chrome; the implementation follows the user brief for functional scope.

## Extracted system

- Neutral `#111311` canvas; `#171a16` panels; `#30352e` borders; `#c3f46b` actions; `#7edbd6` evidence.
- Locally bundled DM Sans Variable for headings and controls, IBM Plex Mono for IDs/coordinates/evidence.
- Fine outline Lucide icons, thin borders, 6–9px corners, no decorative hero imagery.
- Three-column workbench on desktop, compact scenario grid and one-column content on phones; readable fixed logical environment scrolls within its own frame.
- Separate Sidebar, Environment, Inspector, Player, Comparison and Method components; text and controls remain native HTML.

## Fidelity ledger

| Comparison point       | Concept / implementation / decision                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header and identity    | CUL cursor mark, full product name, three navigation items and TR/EN retained. Product-name subtitle hides at constrained widths.                                                                   |
| Hero copy and CTA      | Requested Observe/Act/Verify copy, explanatory sentence, simulation boundary and first-experiment action retained in both languages.                                                                |
| Palette and typography | Dark neutral + lime/cyan and sans/mono hierarchy retained. Increased sidebar, inspector and event text after screenshot review for legibility.                                                      |
| Workspace anatomy      | Scenario rail → working Atlas → four-part evidence inspector retained. Actual dimensions constrain the center frame; content is centered when space permits.                                        |
| Table and target       | Functional rows, search, filter, sort, records, field and target outline replace mock controls. Fixed logical hit bounds scale as a unit.                                                           |
| Playback and evidence  | Play, step, pause, reset and JSON controls retained. Added a real event trace and read-only event selection required by the brief; timestamps were omitted because there is no latency measurement. |
| Mobile                 | One column with full-size horizontally scrollable Atlas; no whole-page horizontal overflow in tested widths. Reset restores the environment's horizontal viewport.                                  |
| Accessibility          | Keyboard focus, skip link, labels and reduced motion. Fixed an offscreen skip-link artifact found in full-page screenshots while preserving keyboard focusability.                                  |

Intentional deviations from generated reference: no fake browser address, no irrelevant Analysis/Settings/User controls, no unrequested create-record feature, no fabricated real-time seconds, no success evidence before the engine produces it. Added scoped approval, actual history, method/source and comparison views required by the brief. Initial evidence panels honestly start empty.

Above-the-fold copy review: navigation, identity, requested introductory copy and CTA match the implementation inventory. Scenario subtitles and scope statements follow the user requirements. The generated mock's extra feature labels are deliberately absent.

QA uses Codex IAB for direct interaction and screenshots, with a supplementary reproducible Playwright Chromium suite. The reference and rendered screenshots are opened with `view_image`; layout, typography, palette, target geometry, controls and responsive framing are compared directly. This is faithful to the chosen design system and required workflow, with the intentional functional deviations above; it is not a claim of pixel-identical reproduction of incidental generated text.

Final captures include the reference's native 1488 × 1056 viewport, plus 1440px full-page and 320/390px mobile renders. The functional event trace and longer task/evidence text extend the page vertically beyond the generated mock; this intentional difference preserves readable, truthful state instead of shrinking the workbench to a single screen.
