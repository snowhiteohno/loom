import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Builds a redirect that works both locally and behind a proxy (e.g. Vercel),
// where the request `origin` is the internal host rather than the public URL.
function redirectTo(request: NextRequest, path: string) {
    const { origin } = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
    const base =
        process.env.NODE_ENV === 'development' || !forwardedHost
            ? origin
            : `${forwardedProto}://${forwardedHost}`;
    return NextResponse.redirect(`${base}${path}`);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const providerError =
        searchParams.get('error_description') || searchParams.get('error');

    // The OAuth provider (GitHub/Supabase) bounced us back with an error.
    if (providerError) {
        console.error('[auth/callback] provider error:', providerError);
        return redirectTo(
            request,
            `/login?error=auth_failed&reason=${encodeURIComponent(providerError)}`
        );
    }

    if (!code) {
        console.error('[auth/callback] no code in URL');
        return redirectTo(request, '/login?error=auth_failed&reason=no_code');
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('[auth/callback] exchange failed:', error.message, error);
        return redirectTo(
            request,
            `/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`
        );
    }

    return redirectTo(request, '/');
}
