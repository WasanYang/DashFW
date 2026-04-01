import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'en',
  localePrefix: 'never'
});
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};