import React from 'react';

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  // This layout is intentionally left blank to avoid conflicts
  // with the root layout when using `localePrefix: 'never'`.
  return <>{children}</>;
}
