
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateAdminCredentialsAction } from "../actions";
import { useRouter } from "next/navigation";

const adminCredentialsFormSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini tidak boleh kosong."),
  newUsername: z.string().min(3, "Username baru minimal 3 karakter.").optional().or(z.literal('')),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter.").optional().or(z.literal('')),
  confirmNewPassword: z.string().optional().or(z.literal('')),
}).refine(data => data.newUsername || data.newPassword, {
    message: "Setidaknya username baru atau password baru harus diisi.",
    path: ["newUsername"], 
}).refine(data => {
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        return false;
    }
    return true;
}, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmNewPassword"],
});


type AdminCredentialsFormValues = z.infer<typeof adminCredentialsFormSchema>;

export default function UpdateAdminCredentialsForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AdminCredentialsFormValues>({
    resolver: zodResolver(adminCredentialsFormSchema),
    defaultValues: {
      currentPassword: "",
      newUsername: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: AdminCredentialsFormValues) {
    if (!data.newUsername && !data.newPassword) {
        form.setError("newUsername", { type: "manual", message: "Isi username baru atau password baru."})
        return;
    }
    if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        form.setError("confirmNewPassword", { type: "manual", message: "Konfirmasi password baru tidak cocok."})
        return;
    }

    try {
      const result = await updateAdminCredentialsAction({
        currentPassword: data.currentPassword,
        newUsername: data.newUsername || undefined, 
        newPassword: data.newPassword || undefined, 
      });

      if (result.success) {
        toast({
          title: "Kredensial Diperbarui",
          description: "Kredensial admin berhasil diperbarui. Anda akan dilogout, silakan login kembali.",
        });
        form.reset();
        router.refresh(); // Refresh halaman admin. Middleware akan menangani redirect ke /login.
        // setTimeout(() => {
        //   router.push("/login"); 
        // }, 1500); // Dihapus untuk menghilangkan delay
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Memperbarui Kredensial",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="newUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username Baru (Opsional)</FormLabel>
              <FormControl>
                <Input placeholder="Biarkan kosong jika tidak ingin diubah" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password Saat Ini</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Masukkan password saat ini" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password Baru (Opsional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Minimal 6 karakter, biarkan kosong jika tidak diubah" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi Password Baru</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Ulangi password baru" {...field} disabled={!form.watch("newPassword")} />
              </FormControl>
              <FormDescription>
                Harus diisi jika Anda mengganti password.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Kredensial Baru"}
        </Button>
      </form>
    </Form>
  );
}
