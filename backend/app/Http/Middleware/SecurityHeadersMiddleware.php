<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tambahkan security headers standar ke setiap response API.
 *
 * Header ini melindungi dari berbagai serangan umum:
 *   - X-Content-Type-Options: mencegah MIME sniffing
 *   - X-Frame-Options: mencegah clickjacking
 *   - Referrer-Policy: batasi informasi referer
 *   - Permissions-Policy: nonaktifkan API browser yang tidak dibutuhkan
 *   - Strict-Transport-Security (HSTS): wajibkan HTTPS di production
 *   - X-XSS-Protection: proteksi legacy browser (tidak ada di modern browsers)
 *
 * Content-Security-Policy sengaja TIDAK di-set di sini karena aplikasi ini
 * adalah pure API — tidak merender HTML. Frontend (React SPA) yang harus
 * menangani CSP via web server (Nginx/Apache) atau meta tag.
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Mencegah browser menebak (sniff) MIME type dari konten response.
        // Penting untuk mencegah XSS via upload file yang dikira teks.
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Mencegah halaman dimuat dalam iframe (clickjacking).
        // SAMEORIGIN: hanya boleh di-iframe oleh domain yang sama.
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Batasi informasi referer yang dikirim ke server tujuan.
        // strict-origin-when-cross-origin: kirim origin saja (bukan path)
        // saat request cross-origin, tidak ada apa-apa saat downgrade ke HTTP.
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Nonaktifkan fitur-fitur browser yang tidak dibutuhkan API ini.
        $response->headers->set(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
        );

        // HSTS: paksa HTTPS untuk 1 tahun di production.
        // includeSubDomains: berlaku untuk semua subdomain (tenant).
        // Hanya diset di production agar development via HTTP tetap bisa berjalan.
        if (app()->isProduction()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        // Legacy XSS protection untuk IE dan browser lama.
        // Browser modern mengabaikan header ini, tapi tidak ada salahnya ditambahkan.
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        return $response;
    }
}

