
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
import { updateAdminCredentialsAction } from "../actions";
import { useRouter } from "next/navigation";

const adminCredentialsFormSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini tidak boleh kosong."),
  newUsername: z.string().min(1, "Username baru tidak boleh kosong."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
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
    },
    mode: "onChange",
  });

  async function onSubmit(data: AdminCredentialsFormValues) {
    try {
      const result = await updateAdminCredentialsAction(data);
      if (result.success) {
        toast({
          title: "Kredensial Diperbarui",
          description: "Kredensial admin berhasil diperbarui. Silakan login kembali.",
        });
        form.reset();
        // Redirect to login after successful update
        router.push("/login");
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
              <FormLabel>Username Baru</FormLabel>
              <FormControl>
                <Input placeholder="Username admin baru" {...field} />
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
              <FormLabel>Password Baru</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Minimal 6 karakter" {...field} />
              </FormControl>
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
