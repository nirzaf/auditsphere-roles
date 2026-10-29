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
        title: 'AuditSphere — Roles & Access End-User Guide',
      },
      {
        name: 'description',
        content:
          'Interactive end-user and Administrator guide to AuditSphere user roles, scopes, separation of duties, lifecycle responsibilities, and role assignment requests.',
      },
      {
        property: 'og:title',
        content: 'AuditSphere — Roles & Access End-User Guide',
      },
      {
        property: 'og:description',
        content:
          'Interactive end-user and Administrator guide to AuditSphere user roles, scopes, separation of duties, lifecycle responsibilities, and role assignment requests.',
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
