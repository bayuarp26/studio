
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
    
    // Pastikan dialog ditutup sebelum proses logout dan redirect
    if(isInactiveDialogOpen) {
        setIsInactiveDialogOpen(false); 
    }

    const result = await logoutAction(); // logoutAction sudah mengatur isAppUnderConstruction
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
      // Jika logout gagal, mungkin kita ingin mereset timer agar pengguna tidak terjebak
      // resetTimers(); // Opsional, tergantung perilaku yang diinginkan
    }
  }, [router, toast, isInactiveDialogOpen]); // Tambahkan isInactiveDialogOpen sebagai dependency jika setIsInactiveDialogOpen dipanggil di dalamnya


  const resetTimers = useCallback(() => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    
    setStopwatchResetKey(Date.now());

    dialogDisplayTimerRef.current = setTimeout(() => {
      // Jika dialog inaktivitas belum terbuka, coba buka.
      // Tidak perlu cek 'isAnotherModalOpen' karena aktivitas di dialog lain akan me-reset timer ini.
      if (!isInactiveDialogOpen) {
          setIsInactiveDialogOpen(true);
      }
    }, DIALOG_DISPLAY_TIMEOUT);

    forceLogoutTimerRef.current = setTimeout(() => {
      performForceLogout(true); 
    }, FORCE_LOGOUT_TIMEOUT);
  }, [isInactiveDialogOpen, performForceLogout]); // isInactiveDialogOpen penting di sini

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']; 
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers(); 

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
      if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    };
  }, [resetTimers]);


  const handleStayLoggedIn = useCallback(() => {
    setIsInactiveDialogOpen(false); 
    resetTimers(); 
  }, [resetTimers]);

  const handleManualLogout = useCallback(() => {
    // performForceLogout akan menutup dialog jika terbuka
    performForceLogout(false); 
  }, [performForceLogout]);
  

  return (
    <>
      {children}
      <AdminStopwatch resetKey={stopwatchResetKey} />
      <AlertDialog 
        open={isInactiveDialogOpen} 
        onOpenChange={(openState) => {
            // Handler ini dipanggil ketika Radix mencoba mengubah state dialog
            // (misalnya via ESC atau klik overlay)
            if (!openState && isInactiveDialogOpen) {
                // Jika dialog akan ditutup (openState=false) DAN state kita sebelumnya adalah dialog terbuka
                // Anggap pengguna ingin tetap login (misalnya menekan ESC atau klik overlay)
                handleStayLoggedIn();
            } else {
                // Sinkronkan state jika perlu (misalnya jika dialog dibuka secara eksternal,
                // meskipun tidak diharapkan untuk dialog ini)
                setIsInactiveDialogOpen(openState);
            }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas. Apakah Anda ingin tetap login? Sesi akan berakhir otomatis setelah {FORCE_LOGOUT_TIMEOUT / 1000} detik total inaktivitas.
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

