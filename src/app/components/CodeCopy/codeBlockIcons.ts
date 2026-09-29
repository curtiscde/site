// The copy button is emitted as a string by the `code` renderer in types/Post.ts, where
// lucide-react components can't be rendered. These are Lucide's `copy` and `check` icons
// (lucide-react v1.37.0, ISC licence) written out as markup so they match the icons used
// elsewhere on the site. Imported by the server-side renderer only — never from a client
// component.

const svg = (modifier: string, body: string) =>
  `<svg class="code-block__icon code-block__icon--${modifier}" aria-hidden="true" ` +
  `xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" ` +
  `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `${body}</svg>`;

export const COPY_ICON = svg('copy',
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>' +
  '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');

export const DONE_ICON = svg('done', '<path d="M20 6 9 17l-5-5"/>');
