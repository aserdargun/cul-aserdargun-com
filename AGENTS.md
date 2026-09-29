# CUL working contract

- Build the bilingual computer-use laboratory: a controlled, deterministic experiment surface that runs entirely in the browser. Every Atlas record is synthetic. No API key, account, backend, real model, or OCR is required, and the app must never reach the real desktop, filesystem, account, email, or other tabs.
- Keep environment and action truth in `src/engine` and `src/environment`; `src/content` owns the Turkish and English copy. The synthetic sandbox is a model, not a shim around a real operating system.
- An agent acts only through the exposed synthetic surface and observes only what that surface returns. A blocked or unsupported action must fail visibly rather than being faked as a completed step.
- Keep Turkish and English controls, task steps and explanations equivalent. Label which parts of the interface are simulated; do not present synthetic state as a real screen capture or a real application result.
- Verify `npm run validate` and review `git diff --check` before handoff.
- Local work only unless the user authorizes external publication. Preserve unrelated work and processes.
