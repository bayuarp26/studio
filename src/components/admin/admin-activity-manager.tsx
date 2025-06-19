
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logoutAction } from '@/app/admin/profile/actions';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { LogOut, CheckCircle } from 'lucide-react';
import AdminStopwatch from './admin-stopwatch';

const DIALOG_DISPLAY_TIMEOUT = 15 * 1000; // 15 detik untuk menampilkan dialog (TESTING)
const FORCE_LOGOUT_TIMEOUT = 30 * 1000;   // 30 detik total inaktivitas untuk force logout (TESTING)

interface AdminActivityManagerProps {
  children: React.ReactNode;
}

export default function AdminActivityManager({ children }: AdminActivityManagerProps) {
  const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
  const dialogDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stopwatchResetKey, setStopwatchResetKey] = useState(Date.now());
  
  const router = useRouter();
  const { toast } = useToast();

  const performForceLogout = useCallback(async (isAuto: boolean = true) => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    setIsInactiveDialogOpen(false); 

    const result = await logoutAction();
    if (result.success) {
      toast({
        title: isAuto ? "Logout Otomatis" : "Logout Berhasil",
        description: isAuto ? "Anda telah logout secara otomatis karena inaktivitas." : "Anda telah berhasil logout.",
      });
      router.push("/login");
    } else {
      toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout.",
      });
    }
  }, [router, toast]);

  const resetTimers = useCallback(() => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    
    // Jika dialog inaktivitas sedang terbuka dan timer direset (karena aktivitas), tutup dialognya.
    if (isInactiveDialogOpen) {
        setIsInactiveDialogOpen(false);
    }
    
    setStopwatchResetKey(Date.now());

    dialogDisplayTimerRef.current = setTimeout(() => {
      // Hanya buka dialog inaktivitas jika tidak ada dialog lain yang sedang aktif
      // dan dialog inaktivitas itu sendiri belum terbuka.
      const isAnotherModalOpen = !!document.querySelector(
        '[data-radix-alert-dialog-content][data-state="open"], [data-radix-dialog-content][data-state="open"]'
      );

      if (!isInactiveDialogOpen && !isAnotherModalOpen) {
        setIsInactiveDialogOpen(true);
      } else if (isAnotherModalOpen) {
        // Jika dialog lain terbuka, jangan tampilkan dialog inaktivitas.
        // Timer akan direset lagi ketika pengguna berinteraksi setelah menutup dialog lain tersebut.
      }
    }, DIALOG_DISPLAY_TIMEOUT);

    forceLogoutTimerRef.current = setTimeout(() => {
      performForceLogout(true); 
    }, FORCE_LOGOUT_TIMEOUT);
  }, [isInactiveDialogOpen, performForceLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']; 
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers(); // Panggil resetTimers saat komponen pertama kali dimuat

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
      if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    };
  }, [resetTimers]);

  const handleManualLogout = () => {
    // setIsInactiveDialogOpen(false); // performForceLogout akan menanganinya
    performForceLogout(false); 
  };

  const handleStayLoggedIn = () => {
    setIsInactiveDialogOpen(false); // Tutup dialog
    resetTimers(); // Reset semua timer
  };

  return (
    <>
      {children}
      <AdminStopwatch resetKey={stopwatchResetKey} />
      <AlertDialog 
        open={isInactiveDialogOpen} 
        onOpenChange={(open) => {
          // Jika Radix mencoba menutup dialog (misalnya via ESC atau klik overlay)
          if (!open) {
            // dan dialog memang sedang dalam state terbuka menurut logika kita
            if (isInactiveDialogOpen) {
              handleStayLoggedIn(); // Anggap pengguna ingin tetap login
            }
          } else {
            // Jika Radix mencoba membuka dialog, sinkronkan state (walaupun biasanya tidak terjadi dari sini)
             setIsInactiveDialogOpen(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas selama beberapa waktu. Apakah Anda ingin tetap login? Sesi akan berakhir otomatis setelah {FORCE_LOGOUT_TIMEOUT / 1000} detik total inaktivitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleStayLoggedIn}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Tetap Login
            </Button>
            <Button variant="destructive" onClick={handleManualLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
