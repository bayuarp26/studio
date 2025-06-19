
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

const DIALOG_DISPLAY_TIMEOUT = 2 * 60 * 1000; // 2 menit untuk menampilkan dialog
const FORCE_LOGOUT_TIMEOUT = 5 * 60 * 1000;   // 5 menit total inaktivitas untuk force logout

interface AdminActivityManagerProps {
  children: React.ReactNode;
}

export default function AdminActivityManager({ children }: AdminActivityManagerProps) {
  const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
  const dialogDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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

    if (isInactiveDialogOpen) {
        setIsInactiveDialogOpen(false);
    }

    dialogDisplayTimerRef.current = setTimeout(() => {
      // Perbaikan selector: Lebih spesifik untuk Radix components yang menggunakan data-state="open"
      const isAnotherModalOpen = !!document.querySelector(
        '[data-radix-alert-dialog-content][data-state="open"], [data-radix-dialog-content][data-state="open"]'
      );
      if (!isAnotherModalOpen) {
        setIsInactiveDialogOpen(true);
      } else {
        resetTimers(); // Snooze if another modal is open
      }
    }, DIALOG_DISPLAY_TIMEOUT);

    forceLogoutTimerRef.current = setTimeout(() => {
      performForceLogout(true); // true for auto-logout
    }, FORCE_LOGOUT_TIMEOUT);
  }, [isInactiveDialogOpen, performForceLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimers(); 

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (dialogDisplayTimerRef.current) clearTimeout(dialogDisplayTimerRef.current);
      if (forceLogoutTimerRef.current) clearTimeout(forceLogoutTimerRef.current);
    };
  }, [resetTimers]);

  const handleManualLogout = () => {
    performForceLogout(false); // false for manual logout
  };

  const handleStayLoggedIn = () => {
    setIsInactiveDialogOpen(false);
    resetTimers(); 
  };

  return (
    <>
      {children}
      <AlertDialog open={isInactiveDialogOpen} onOpenChange={(open) => {
        if (!open && isInactiveDialogOpen) { 
            handleStayLoggedIn();
        }
        setIsInactiveDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas selama beberapa waktu. Apakah Anda ingin tetap login? Sesi akan berakhir otomatis setelah 5 menit total inaktivitas.
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
