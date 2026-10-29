import type { ReactNode } from 'react';
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import appCss from '../index.css?url';

// Preserved from the original index.html: keeps a passthrough getter/setter on
// window.fetch so an override set by other tooling is never clobbered.
const fetchPreserveScript = `(function() {
  try {
    var _origFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: function() {
        return _origFetch;
      },
      set: function(fn) {
        _origFetch = fn;
      }
    });
  } catch (_) {}
})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
      {
        title: 'AuditSphere — Set up your team’s access',
      },
      {
        name: 'description',
        content:
          'Choose responsibilities, add your people and prepare a team access request for administrator review.',
      },
      {
        property: 'og:title',
        content: 'AuditSphere — Set up your team’s access',
      },
      {
        property: 'og:description',
        content:
          'Choose responsibilities, add your people and prepare a team access request for administrator review.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: fetchPreserveScript }} />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
