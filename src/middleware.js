// import { NextResponse } from 'next/server';

// export const config = {
//   matcher: ['/', '/dashboard', '/((?!_next|api|favicon.ico).*)'],
// };

// export function middleware(req) {
//   const token = req.cookies.get('token')?.value;

//   const { pathname } = req.nextUrl;

//   if (token && pathname === '/') {
//     return NextResponse.redirect(new URL('/dashboard', req.url));
//   }

//   if (!token && pathname.startsWith('/dashboard')) {
//     return NextResponse.redirect(new URL('/', req.url));
//   }

//   return NextResponse.next();
// }
