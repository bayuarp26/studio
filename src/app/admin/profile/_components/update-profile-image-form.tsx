
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
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useCallback, useState } from "react";
import { UploadCloud, XCircle } from "lucide-react";
import { updateProfileImageAction } from "../actions";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileImageFormSchema = z.object({
  heroImageUrl: z.string().refine(val => val.startsWith('data:image/'), {
    message: "Harap unggah gambar yang valid (format Data URI).",
  }),
});

type ProfileImageFormValues = z.infer<typeof profileImageFormSchema>;

interface UpdateProfileImageFormProps {
  currentImageUrl: string; // To display the initial image if needed, though direct update is complex
}

export default function UpdateProfileImageForm({ currentImageUrl }: UpdateProfileImageFormProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<ProfileImageFormValues>({
    resolver: zodResolver(profileImageFormSchema),
    defaultValues: {
      heroImageUrl: "",
    },
    mode: "onChange",
  });

  const handleFileChange = useCallback((file: File | null, onChange: (value: string) => void) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError("heroImageUrl", { type: "manual", message: `Ukuran file maksimal ${MAX_FILE_SIZE / (1024*1024)}MB.` });
        setImagePreview(null);
        onChange("");
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("heroImageUrl", { type: "manual", message: "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP." });
        setImagePreview(null);
        onChange("");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(dataUri);
        onChange(dataUri);
        form.clearErrors("heroImageUrl");
      };
      reader.onerror = () => {
        form.setError("heroImageUrl", { type: "manual", message: "Gagal membaca file gambar." });
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

  async function onSubmit(data: ProfileImageFormValues) {
    try {
      const result = await updateProfileImageAction(data.heroImageUrl);
      if (result.success) {
        toast({
          title: "Foto Profil Diperbarui",
          description: "Foto profil di halaman utama telah berhasil diperbarui.",
        });
        form.reset();
        setImagePreview(null);
        // Optionally, trigger a hard refresh or re-fetch for page.tsx if needed,
        // though revalidatePath should handle most cases for subsequent visits.
        // window.location.reload(); // Uncomment if immediate visual update on this admin page is critical
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Memperbarui Foto",
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
          name="heroImageUrl"
          render={({ field: { onChange, value, ...restField } }) => (
            <FormItem>
              <FormLabel>Unggah Foto Profil Baru</FormLabel>
              <FormControl>
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                    form.formState.errors.heroImageUrl ? 'border-destructive' : 'border-border'
                  } border-dashed rounded-md ${isDragging ? 'bg-accent/50' : ''}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, onChange)}
                >
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative group w-full max-w-xs mx-auto">
                        <Image
                          src={imagePreview}
                          alt="Preview Foto Profil Baru"
                          width={200}
                          height={200}
                          className="mx-auto rounded-full object-cover h-40 w-40"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 opacity-70 group-hover:opacity-100 transition-opacity rounded-full h-7 w-7"
                          onClick={() => {
                            setImagePreview(null);
                            onChange("");
                            const fileInput = document.getElementById('profile-file-upload') as HTMLInputElement | null;
                            if (fileInput) fileInput.value = "";
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                          <label
                            htmlFor="profile-file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                          >
                            <span>Unggah file</span>
                            <input 
                              id="profile-file-upload" 
                              name="profile-file-upload" 
                              type="file" 
                              className="sr-only" 
                              accept={ACCEPTED_IMAGE_TYPES.join(",")}
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null, onChange)}
                              {...restField}
                            />
                          </label>
                          <p className="pl-1">atau tarik dan lepas</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP hingga {MAX_FILE_SIZE / (1024*1024)}MB</p>
                      </>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !imagePreview}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Foto Profil"}
        </Button>
      </form>
    </Form>
  );
}
