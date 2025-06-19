
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logoutAction } from '@/app/admin/profile/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { LogOut, CheckCircle } from 'lucide-react';

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 menit

interface AdminActivityManagerProps {
  children: React.ReactNode;
}

export default function AdminActivityManager({ children }: AdminActivityManagerProps) {
  const [isInactiveDialogOpen, setIsInactiveDialogOpen] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      // Hanya buka dialog jika tidak ada dialog lain yang terbuka (heuristik sederhana)
      if (!document.querySelector('[role="dialog"][aria-modal="true"][open], [data-radix-dialog-content][aria-modal="true"]')) {
         setIsInactiveDialogOpen(true);
      } else {
        // Jika dialog lain terbuka, reset timer lagi untuk menunggu dialog itu ditutup
        resetInactivityTimer();
      }
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer(); // Mulai timer saat komponen dimuat

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  const handleLogout = async () => {
    setIsInactiveDialogOpen(false);
    const result = await logoutAction();
    if (result.success) {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout karena inaktivitas.",
      });
      router.push("/login");
    } else {
      toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout otomatis.",
      });
    }
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); // Stop timer after logout
  };

  const handleStayLoggedIn = () => {
    setIsInactiveDialogOpen(false);
    resetInactivityTimer(); // Reset timer karena pengguna memilih untuk tetap login
  };

  return (
    <>
      {children}
      <AlertDialog open={isInactiveDialogOpen} onOpenChange={setIsInactiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sesi Akan Segera Berakhir?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda tidak melakukan aktivitas selama beberapa waktu. Apakah Anda ingin tetap login?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleStayLoggedIn}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Tetap Login
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
