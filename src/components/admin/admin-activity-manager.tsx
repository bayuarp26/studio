
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

const DIALOG_DISPLAY_TIMEOUT = 2 * 60 * 1000; // 2 menit
const FORCE_LOGOUT_TIMEOUT = 3 * 60 * 1000;   // 3 menit

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


  const resetTimers = useCallback(() => {
    if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
    if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    
    setStopwatchResetKey(Date.now());

    dialogDisplayTimerRef.current = setTimeout(() => {
      // Jika dialog inaktivitas belum terbuka, coba buka.
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
    performForceLogout(false); 
  }, [performForceLogout]);
  

  return (
    <>
      {children}
      <AdminStopwatch resetKey={stopwatchResetKey} />
      <AlertDialog 
        open={isInactiveDialogOpen} 
        onOpenChange={(openState) => {
            if (!openState && isInactiveDialogOpen) {
                // Jika dialog akan ditutup oleh pengguna (ESC atau klik overlay)
                handleStayLoggedIn();
            }
            // Tidak mengatur setIsInactiveDialogOpen(openState) di sini secara langsung
            // karena kita ingin kontrol yang lebih ketat: dialog hanya dibuka oleh timer
            // dan ditutup oleh aksi pengguna atau logout otomatis.
            // Namun, jika onOpenChange *harus* mengontrol state secara penuh:
            // setIsInactiveDialogOpen(openState); 
            // Jika openState adalah false, dan isInactiveDialogOpen adalah true,
            // itu berarti pengguna menutupnya, jadi kita panggil handleStayLoggedIn.
        }}
      >
        <AlertDialogContent 
          onEscapeKeyDown={handleStayLoggedIn} 
          onPointerDownOutside={(e) => {
            // Radix Dialog menutup dialog pada pointer down di luar.
            // Jika pointer down terjadi di luar, kita anggap sebagai "stay logged in".
            // Periksa target untuk memastikan itu bukan bagian dari trigger lain yang mungkin ada.
            if (e.target === e.currentTarget) { // Hanya jika klik langsung pada overlay
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
