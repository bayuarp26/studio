
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import SectionContainer from "@/components/section-container";
import Link from 'next/link';
import { ListOrdered, UploadCloud, XCircle } from 'lucide-react';
import Image from "next/image";
import { useCallback, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const projectFormSchema = z.object({
  title: z.string().min(2, {
    message: "Judul proyek minimal harus 2 karakter.",
  }),
  imageUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Harap unggah gambar yang valid (format Data URI).",
  }),
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      imageUrl: "",
      imageHint: "",
      description: "",
      details: "",
      tags: "",
    },
    mode: "onChange",
  });

  const handleFileChange = useCallback((file: File | null, onChange: (value: string) => void) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError("imageUrl", { type: "manual", message: `Ukuran file maksimal ${MAX_FILE_SIZE / (1024*1024)}MB.` });
        setImagePreview(null);
        onChange("");
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("imageUrl", { type: "manual", message: "Format gambar tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP." });
        setImagePreview(null);
        onChange("");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        onChange(dataUri);
        form.clearErrors("imageUrl");
      };
      reader.onerror = () => {
        form.setError("imageUrl", { type: "manual", message: "Gagal membaca file gambar." });
        setImagePreview(null);
        onChange("");
      }
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      onChange("");
    }
  }, [form]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>, onChange: (value: string) => void) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file, onChange);
    }
  };


  async function onSubmit(data: ProjectFormValues) {
    try {
      const result = await addProjectAction(data);
      if (result.success) {
        toast({
          title: "Proyek Berhasil Ditambahkan",
          description: `Proyek "${data.title}" telah disimpan ke database.`,
        });
        form.reset();
        setImagePreview(null);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
            <h1 className="section-title mb-4 sm:mb-0">Tambah Proyek Baru</h1>
            <Button asChild variant="outline">
              <Link href="/admin/projects">
                <ListOrdered className="mr-2 h-4 w-4" />
                Lihat Semua Proyek
              </Link>
            </Button>
        </div>
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
              render={({ field: { onChange, value, ...restField } }) => (
                <FormItem>
                  <FormLabel>Gambar Proyek</FormLabel>
                  <FormControl>
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                        form.formState.errors.imageUrl ? 'border-destructive' : 'border-border'
                      } border-dashed rounded-md ${isDragging ? 'bg-accent/50' : ''}`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, onChange)}
                    >
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div className="relative group w-full max-w-md mx-auto">
                            <Image
                              src={imagePreview}
                              alt="Preview Gambar Proyek"
                              width={400}
                              height={300}
                              className="mx-auto rounded-md object-contain max-h-[300px]"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setImagePreview(null);
                                onChange("");
                                const fileInput = document.getElementById('file-upload') as HTMLInputElement | null;
                                if (fileInput) fileInput.value = "";
                              }}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="flex text-sm text-muted-foreground">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                              >
                                <span>Unggah file</span>
                                <input 
                                  id="file-upload" 
                                  name="file-upload" 
                                  type="file" 
                                  className="sr-only" 
                                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, onChange)}
                                  {...restField}
                                />
                              </label>
                              <p className="pl-1">atau tarik dan lepas</p>
                            </div>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP hingga {MAX_FILE_SIZE / (1024*1024)}MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </FormControl>
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

    