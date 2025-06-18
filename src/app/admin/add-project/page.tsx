
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addProjectAction } from "./actions";
import SectionContainer from "@/components/section-container"; // Menggunakan SectionContainer untuk styling konsisten

const projectFormSchema = z.object({
  title: z.string().min(2, {
    message: "Judul proyek minimal harus 2 karakter.",
  }),
  imageUrl: z.string().url({ message: "Harap masukkan URL gambar yang valid." }),
  imageHint: z.string().min(2, {
    message: "Petunjuk gambar minimal harus 2 karakter.",
  }),
  description: z.string().min(10, {
    message: "Deskripsi minimal harus 10 karakter.",
  }),
  details: z.string().min(1, {
    message: "Detail proyek tidak boleh kosong. Pisahkan setiap detail dengan baris baru.",
  }),
  tags: z.string().min(1, {
    message: "Tag tidak boleh kosong. Pisahkan setiap tag dengan baris baru.",
  }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function AddProjectPage() {
  const { toast } = useToast();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      imageUrl: "https://placehold.co/700x500.png",
      imageHint: "",
      description: "",
      details: "",
      tags: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: ProjectFormValues) {
    try {
      const result = await addProjectAction(data);
      if (result.success) {
        toast({
          title: "Proyek Berhasil Ditambahkan",
          description: `Proyek "${data.title}" telah disimpan ke database.`,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menambahkan Proyek",
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
    <SectionContainer id="add-project-admin" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="max-w-2xl mx-auto">
        <h1 className="section-title mb-12 text-center">Tambah Proyek Baru</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Proyek</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Aplikasi Portofolio Pribadi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/700x500.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    Gunakan URL gambar yang valid.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Petunjuk Gambar (AI Hint)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: modern website" {...field} />
                  </FormControl>
                  <FormDescription>
                    1-2 kata kunci untuk deskripsi gambar (untuk data-ai-hint).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Singkat Proyek</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan proyek Anda secara singkat..."
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detail Proyek</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan setiap detail penting dalam baris baru..."
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Pisahkan setiap poin detail dengan menekan Enter (baris baru).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag / Teknologi yang Digunakan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: React (baris baru) Next.js (baris baru) MongoDB"
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Pisahkan setiap tag atau teknologi dengan menekan Enter (baris baru).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Menyimpan..." : "Tambah Proyek"}
            </Button>
          </form>
        </Form>
      </div>
    </SectionContainer>
  );
}

