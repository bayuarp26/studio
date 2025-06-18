
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
import { loginAction } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username tidak boleh kosong." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      const result = await loginAction(data);
      if (result.success) {
        toast({
          title: "Login Berhasil",
          description: "Anda akan diarahkan ke halaman admin.",
        });
        router.push("/admin/profile"); // Redirect ke halaman admin profil setelah login berhasil
        // router.refresh(); // Dihapus, router.push sudah cukup memicu middleware
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: result.error || "Username atau password salah.",
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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <LogIn className="mr-2 h-6 w-6" />
            Login Admin
          </CardTitle>
          <CardDescription>Masukkan kredensial admin Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Memproses..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
