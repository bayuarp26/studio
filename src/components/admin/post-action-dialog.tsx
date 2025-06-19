
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { LogOut, Edit3, CheckCircle } from 'lucide-react';

interface PostActionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmLogout: () => void;
  onContinueEditing: () => void;
  dialogTitle?: string;
  dialogDescription?: string;
}

export default function PostActionDialog({
  isOpen,
  onOpenChange,
  onConfirmLogout,
  onContinueEditing,
  dialogTitle = "Tindakan Berhasil",
  dialogDescription = "Perubahan telah disimpan. Apa yang ingin Anda lakukan selanjutnya?"
}: PostActionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            {dialogTitle}
            </AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onContinueEditing}>
            <Edit3 className="mr-2 h-4 w-4" />
            Lanjutkan Mengedit
          </Button>
          <Button variant="destructive" onClick={onConfirmLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
