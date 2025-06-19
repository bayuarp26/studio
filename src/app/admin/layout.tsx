
// Layout dasar untuk semua halaman di bawah /admin
// Middleware akan menangani proteksi autentikasi untuk rute-rute ini.
// Di sini Anda bisa menambahkan navigasi admin bersama, sidebar, dll. jika diperlukan.

import type { Metadata } from 'next';
import AdminActivityManager from '@/components/admin/admin-activity-manager'; // Impor komponen baru

export const metadata: Metadata = {
  title: 'Admin Panel - Navigator Profile',
  description: 'Pengelolaan konten untuk Navigator Profile.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminActivityManager> {/* Bungkus children dengan AdminActivityManager */}
      <div>
        {/* 
          Contoh jika ingin menambahkan header/navbar admin bersama:
          <header className="bg-primary text-primary-foreground p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Admin Panel</h1>
              // Tombol logout juga bisa diletakkan di sini
              // Contoh: <LogoutButton />
            </div>
          </header>
        */}
        <main>{children}</main>
        {/* Footer bisa ditambahkan di sini jika diperlukan untuk semua halaman admin */}
      </div>
    </AdminActivityManager>
  );
}
