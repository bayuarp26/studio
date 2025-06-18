
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { addSkillAction, deleteSkillAction } from "../actions";
import { Badge } from "@/components/ui/badge";
import type { SkillData } from "@/app/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const skillFormSchema = z.object({
  name: z.string().min(2, {
    message: "Nama keahlian minimal harus 2 karakter.",
  }),
});

type SkillFormValues = z.infer<typeof skillFormSchema>;

interface ManageSkillsSectionProps {
  initialSkills: SkillData[];
}

export default function ManageSkillsSection({ initialSkills }: ManageSkillsSectionProps) {
  const { toast } = useToast();
  const [skills, setSkills] = useState<SkillData[]>(initialSkills);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // skillId being deleted
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<{id: string, name: string} | null>(null);

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  async function onAddSkill(data: SkillFormValues) {
    try {
      const result = await addSkillAction(data.name);
      if (result.success && result.newSkill) {
        toast({
          title: "Keahlian Ditambahkan",
          description: `Keahlian "${result.newSkill.name}" telah berhasil ditambahkan.`,
        });
        setSkills(prevSkills => [...prevSkills, result.newSkill!].sort((a, b) => a.name.localeCompare(b.name)));
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menambahkan Keahlian",
          description: result.error || "Terjadi kesalahan yang tidak diketahui.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Sistem",
        description: "Gagal menghubungi server. Silakan coba lagi.",
      });
    }
  }

  const handleDeleteClick = (skill: SkillData) => {
    setSkillToDelete({id: skill._id, name: skill.name});
    setIsAlertOpen(true);
  };

  const confirmDeleteSkill = async () => {
    if (!skillToDelete) return;
    setIsDeleting(skillToDelete.id);
    try {
      const result = await deleteSkillAction(skillToDelete.id);
      if (result.success) {
        toast({
          title: "Keahlian Dihapus",
          description: `Keahlian "${skillToDelete.name}" telah berhasil dihapus.`,
        });
        setSkills(prevSkills => prevSkills.filter(s => s._id !== skillToDelete.id));
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menghapus Keahlian",
          description: result.error || "Terjadi kesalahan yang tidak diketahui.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Sistem",
        description: "Gagal menghubungi server. Silakan coba lagi.",
      });
    } finally {
      setIsDeleting(null);
      setIsAlertOpen(false);
      setSkillToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onAddSkill)} className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Nama Keahlian Baru</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: SEO Specialist" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah
          </Button>
        </form>
      </Form>

      <div className="space-y-3">
        <h4 className="font-medium text-muted-foreground">Daftar Keahlian Saat Ini:</h4>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada keahlian yang ditambahkan.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill._id} variant="secondary" className="flex items-center gap-2 pr-1 text-base">
                {skill.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={() => handleDeleteClick(skill)}
                  disabled={isDeleting === skill._id}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">Hapus {skill.name}</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus keahlian <strong className="mx-1">{skillToDelete?.name}</strong> secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSkill} disabled={!!isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? "Menghapus..." : "Ya, Hapus Keahlian"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
