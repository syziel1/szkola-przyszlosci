import { NextResponse, type NextRequest } from 'next/server';

// 1. Securely get Supabase host
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// UWAGA: Jeśli nie masz jeszcze .env.local, ta linia wyrzuci błąd, co jest celowe.
if (!supabaseUrl) {
  throw new Error('CRITICAL_ERROR: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
}
const supabaseHost = new URL(supabaseUrl).hostname;

// Funkcja pomocnicza do budowania CSP
function buildCSP(nonce: string) {
  const cspDirectives = [
    "default-src 'self'",
    // Pozwalamy na skrypty z 'self', 'unsafe-eval' (potrzebne w dev) oraz te oznaczone naszym nonce
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic'`,
    
    // Style: 'unsafe-inline' jest potrzebne dla Tailwind/Shadcn w trybie runtime
    `style-src 'self' https://fonts.googleapis.com 'unsafe-inline'`,
    
    // Obrazki: Supabase, Gravatar, Google Favicons itp.
    `img-src 'self' data: blob: https://${supabaseHost} https://avatars.githubusercontent.com https://gravatar.com https://*.gravatar.com https://image.thum.io https://www.google.com`,
    
    // Fonty
    `font-src 'self' data: https://fonts.gstatic.com`,
    
    // Połączenia: Supabase API
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return cspDirectives.join('; ').replace(/\s{2,}/g, ' ').trim();
}

export function middleware(request: NextRequest) {
  // 2. Wygeneruj nonce
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

  // 3. Utwórz KOPIĘ nagłówków żądania i dodaj do niej nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Nonce', nonce);

  // 4. Stwórz odpowiedź, przekazując ZMODYFIKOWANE nagłówki ŻĄDANIA
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Zbuduj i ustaw CSP na nagłówkach ODPOWIEDZI
  const csp = buildCSP(nonce);
  response.headers.set('Content-Security-Policy', csp);

  // 6. Ustaw pozostałe nagłówki bezpieczeństwa
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Przekaż nonce w nagłówku odpowiedzi (aby layout mógł go odczytać)
  response.headers.set('X-Nonce', nonce);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};