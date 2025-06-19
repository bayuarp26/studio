
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logoutAction, refreshAdminActivityAction } from '@/app/admin/profile/actions';
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

const DIALOG_DISPLAY_TIMEOUT = 2 * 60 * 1000; // 2 menit
const FORCE_LOGOUT_TIMEOUT = 3 * 60 * 1000;   // 3 menit
// const DIALOG_DISPLAY_TIMEOUT = 15 * 1000; // 15 detik - UNTUK TES
// const FORCE_LOGOUT_TIMEOUT = 30 * 1000;   // 30 detik - UNTUK TES


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
    
    if(isInactiveDialogOpen) {
        setIsInactiveDialogOpen(false); 
    }

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
  }, [router, toast, isInactiveDialogOpen]);


  const resetTimers = useCallback(async () => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    
    setStopwatchResetKey(Date.now());

    // Refresh server-side activity timestamp
    try {
      const refreshResult = await refreshAdminActivityAction();
      if (!refreshResult.success) {
        console.warn("AdminActivityManager: Failed to refresh admin activity timestamp:", refreshResult.error);
        // Potentially show a non-critical toast to the admin
      }
    } catch (e) {
        console.error("AdminActivityManager: Error calling refreshAdminActivityAction", e);
    }


    dialogDisplayTimerRef.current = setTimeout(() => {
      // Selalu coba buka dialog jika timer ini selesai, kecuali dialognya sudah terbuka
      if (!isInactiveDialogOpen) {
          setIsInactiveDialogOpen(true);
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
    // Tidak perlu setIsInactiveDialogOpen(false) di sini karena performForceLogout sudah menanganinya
    performForceLogout(false); 
  }, [performForceLogout]);
  

  return (
    <>
      {children}
      <AdminStopwatch resetKey={stopwatchResetKey} />
      <AlertDialog 
        open={isInactiveDialogOpen} 
        onOpenChange={(openState) => {
          // Jika dialog akan ditutup (openState menjadi false)
          // dan dialog sebelumnya memang terbuka (isInactiveDialogOpen adalah true),
          // dan penutupan BUKAN karena logout otomatis atau manual (yang akan mengubah isInactiveDialogOpen sendiri),
          // maka anggap pengguna menutupnya (ESC/overlay) dan ingin tetap login.
          if (!openState && isInactiveDialogOpen) {
            // Pengecekan tambahan bisa dilakukan di sini jika ingin membedakan
            // penutupan oleh tombol "Keluar" vs ESC/overlay,
            // tapi saat ini kedua tombol di footer dialog secara eksplisit memanggil handler-nya.
            // Jadi, jika onOpenChange dipanggil dengan openState=false dan kita tidak sedang dalam proses logout,
            // itu berarti ESC atau klik overlay.
            handleStayLoggedIn();
          }
          // setIsInactiveDialogOpen(openState); // Biarkan state dikontrol oleh timer dan aksi tombol
        }}
      >
        <AlertDialogContent 
          onEscapeKeyDown={handleStayLoggedIn} 
          onPointerDownOutside={(e) => {
            if (e.target === e.currentTarget) {
                handleStayLoggedIn();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas. Apakah Anda ingin tetap login? Sesi akan berakhir otomatis setelah {FORCE_LOGOUT_TIMEOUT / (60*1000)} menit total inaktivitas.
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
