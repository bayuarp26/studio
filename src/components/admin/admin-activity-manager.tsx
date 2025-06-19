
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

// Standard production timeouts
const DIALOG_DISPLAY_TIMEOUT = 2 * 60 * 1000; // 2 menit
const FORCE_LOGOUT_TIMEOUT = 3 * 60 * 1000;   // 3 menit

// Testing timeouts (uncomment to use, and comment out production timeouts)
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
    
    // Tutup dialog jika sedang terbuka sebelum logout
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
  }, [router, toast, isInactiveDialogOpen]); // Tambahkan isInactiveDialogOpen sebagai dependensi


  const resetTimers = useCallback(async () => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    
    setStopwatchResetKey(Date.now());

    try {
      const refreshResult = await refreshAdminActivityAction(); // DRP: Heartbeat
      if (!refreshResult.success) {
        console.warn("AdminActivityManager: Failed to refresh admin activity timestamp:", refreshResult.error);
      }
    } catch (e) {
        console.error("AdminActivityManager: Error calling refreshAdminActivityAction", e);
    }

    dialogDisplayTimerRef.current = setTimeout(() => {
      // Hanya buka dialog jika belum terbuka.
      // Tidak perlu memeriksa dialog lain di sini, karena aktivitas pada dialog lain
      // seharusnya sudah mereset timer ini.
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
      if (isInactiveDialogOpen) {
        // Jika dialog inaktivitas sedang terbuka dan ada aktivitas,
        // anggap pengguna ingin tetap login.
        handleStayLoggedIn();
      } else {
        resetTimers();
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers(); // Initial setup

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
      if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    };
  }, [resetTimers, isInactiveDialogOpen]); // isInactiveDialogOpen ditambahkan sebagai dependensi


  const handleStayLoggedIn = useCallback(() => {
    setIsInactiveDialogOpen(false); 
    resetTimers(); 
  }, [resetTimers]);

  const handleManualLogout = useCallback(() => {
    performForceLogout(false); 
  }, [performForceLogout]);
  
  const handleDialogInteraction = (openState: boolean) => {
    if (!openState && isInactiveDialogOpen) {
        // Dialog ditutup oleh pengguna (ESC atau klik overlay)
        handleStayLoggedIn();
    }
    // Jika openState true, dialog dibuka oleh timer, tidak perlu aksi khusus di sini
    // setIsInactiveDialogOpen(openState) akan diatur oleh timer atau tombol
  };

  return (
    <>
      {children}
      <AdminStopwatch resetKey={stopwatchResetKey} />
      <AlertDialog 
        open={isInactiveDialogOpen} 
        onOpenChange={handleDialogInteraction}
      >
        <AlertDialogContent 
          // Handler onEscapeKeyDown dan onPointerDownOutside tidak lagi eksplisit diperlukan
          // karena onOpenChange akan menangkap perubahan state dialog
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas. Apakah Anda ingin tetap login? Sesi akan berakhir otomatis setelah {Math.floor(FORCE_LOGOUT_TIMEOUT / (60*1000))} menit {FORCE_LOGOUT_TIMEOUT % (60*1000) / 1000} detik total inaktivitas.
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
