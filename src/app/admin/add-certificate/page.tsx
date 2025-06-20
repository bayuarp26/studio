
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
import { Textarea } from "@/components/ui/textarea"; // Digunakan untuk credentialUrl
import { useToast } from "@/hooks/use-toast";
import { addCertificateAction } from "./actions";
import SectionContainer from "@/components/section-container";
import Link from 'next/link';
import { ListOrdered, UploadCloud, XCircle, UserCog, Home, PlusCircle, LogOut, ShieldCheck, Projector } from 'lucide-react';
import Image from "next/image";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "../../profile/actions";
import PostActionDialog from "@/components/admin/post-action-dialog";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const certificateFormSchema = z.object({
  title: z.string().min(2, {
    message: "Judul sertifikat minimal harus 2 karakter.",
  }),
  issuingOrganization: z.string().min(2, {
    message: "Nama penerbit minimal harus 2 karakter.",
  }),
  issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Tanggal terbit harus valid.",
  }),
  credentialUrl: z.string().url({ message: "URL kredensial harus valid atau biarkan kosong." }).optional().or(z.literal('')),
  imageUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Harap unggah gambar sertifikat yang valid (format Data URI).",
  }),
  imageHint: z.string().min(2, {
    message: "Petunjuk gambar minimal harus 2 karakter.",
  }),
});

export type CertificateFormValues = z.infer<typeof certificateFormSchema>;

export default function AddCertificatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPostActionDialogOpen, setIsPostActionDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      title: "",
      issuingOrganization: "",
      issueDate: "",
      credentialUrl: "",
      imageUrl: "",
      imageHint: "",
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await logoutAction();
    if (result.success) {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout.",
      });
      router.refresh(); // Refresh to reflect logout state
      router.push("/login");
    } else {
       toast({
        variant: "destructive",
        title: "Logout Gagal",
        description: "Terjadi kesalahan saat logout.",
      });
    }
    setIsLoggingOut(false);
  };

  async function onSubmit(data: CertificateFormValues) {
    try {
      const result = await addCertificateAction(data);
      if (result.success) {
        toast({
          title: "Sertifikat Berhasil Ditambahkan",
          description: `Sertifikat "${data.title}" telah disimpan.`,
        });
        form.reset();
        setImagePreview(null);
        setIsPostActionDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menambahkan Sertifikat",
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
    <>
      <SectionContainer id="add-certificate-admin" className="bg-background min-h-screen pt-24 md:pt-32">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
              <h1 className="section-title mb-4 sm:mb-0">Tambah Sertifikat Baru</h1>
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                  <Button asChild variant="outline">
                    <Link href="/admin/manage-certificates">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Semua Sertifikat
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/admin/add-project">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tambah Proyek
                    </Link>
                  </Button>
                   <Button asChild variant="outline">
                    <Link href="/admin/projects">
                      <Projector className="mr-2 h-4 w-4" />
                      Semua Proyek
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                      <Link href="/admin/profile">
                          <UserCog className="mr-2 h-4 w-4" />
                          Pengaturan Profil
                      </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Halaman Utama
                    </Link>
                  </Button>
                  <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
              </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Sertifikat</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Google Digital Garage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diterbitkan Oleh</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Google" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Terbit</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="credentialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Kredensial (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.credential.net/..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Link ke halaman verifikasi sertifikat jika ada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel>Gambar Sertifikat</FormLabel>
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
                                alt="Preview Gambar Sertifikat"
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
                                  const fileInput = document.getElementById('certificate-file-upload') as HTMLInputElement | null;
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
                                  htmlFor="certificate-file-upload"
                                  className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                                >
                                  <span>Unggah file</span>
                                  <input 
                                    id="certificate-file-upload" 
                                    name="certificate-file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, onChange)}
                                    {...restField}
                                  />
                                </label>
                                <p className="pl-1">atau tarik dan lepas</p>
                              </div>
                              <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP hingga ${MAX_FILE_SIZE / (1024*1024)}MB</p>
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
                      <Input placeholder="Contoh: official certificate" {...field} />
                    </FormControl>
                    <FormDescription>
                      1-2 kata kunci untuk deskripsi gambar (untuk data-ai-hint).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Menyimpan..." : "Tambah Sertifikat"}
              </Button>
            </form>
          </Form>
        </div>
      </SectionContainer>
      <PostActionDialog
        isOpen={isPostActionDialogOpen}
        onOpenChange={setIsPostActionDialogOpen}
        onConfirmLogout={handleLogout}
        onContinueEditing={() => setIsPostActionDialogOpen(false)}
        dialogTitle="Sertifikat Ditambahkan"
        dialogDescription="Sertifikat baru telah berhasil disimpan. Apa yang ingin Anda lakukan selanjutnya?"
      />
    </>
  );
}
