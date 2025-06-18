
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
import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { updateCVAction } from "../actions";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_CV_TYPES = ["application/pdf"];

const cvFormSchema = z.object({
  cvFile: z.custom<File>((val) => val instanceof File, "Harap unggah file CV.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Ukuran file maksimal ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine(
      (file) => ACCEPTED_CV_TYPES.includes(file.type),
      "Format file CV tidak valid. Harap unggah file PDF."
    ),
});

type CVFormValues = z.infer<typeof cvFormSchema>;

interface UpdateCVFormProps {
  currentCvUrl: string; 
}

export default function UpdateCVForm({ currentCvUrl }: UpdateCVFormProps) {
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<CVFormValues>({
    resolver: zodResolver(cvFormSchema),
    mode: "onChange",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldChange: (file: File | null) => void) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Client-side validation for immediate feedback
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`Ukuran file maksimal ${MAX_FILE_SIZE / (1024*1024)}MB.`);
        setFileName(null);
        fieldChange(null);
        form.setValue("cvFile", null as any, { shouldValidate: true }); // Trigger validation
        return;
      }
      if (!ACCEPTED_CV_TYPES.includes(file.type)) {
        setFileError("Format file tidak valid. Hanya PDF yang diizinkan.");
        setFileName(null);
        fieldChange(null);
        form.setValue("cvFile", null as any, { shouldValidate: true });
        return;
      }
      setFileName(file.name);
      setFileError(null);
      fieldChange(file);
      form.clearErrors("cvFile");
    } else {
      setFileName(null);
      setFileError(null);
      fieldChange(null);
    }
  };

  async function onSubmit(data: CVFormValues) {
    if (!data.cvFile) {
        toast({ variant: "destructive", title: "Gagal", description: "File CV tidak boleh kosong." });
        return;
    }
    const formData = new FormData();
    formData.append("cvFile", data.cvFile);

    try {
      const result = await updateCVAction(formData);
      if (result.success) {
        toast({
          title: "CV Berhasil Diperbarui",
          description: "File CV Anda telah berhasil disimpan.",
        });
        form.reset();
        setFileName(null);
        setFileError(null);
        // Update current CV link displayed (optional, for immediate feedback)
        // This might require a more complex state management or prop drilling
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Memperbarui CV",
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
          name="cvFile"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Unggah File CV Baru (PDF)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf"
                    className="hidden" // Hide default input
                    id="cv-file-upload"
                    onChange={(e) => handleFileChange(e, onChange)}
                    {...rest}
                  />
                  <label
                    htmlFor="cv-file-upload"
                    className={`mt-1 flex justify-center items-center px-6 py-10 border-2 ${
                      form.formState.errors.cvFile || fileError ? 'border-destructive' : 'border-border'
                    } border-dashed rounded-md cursor-pointer hover:border-primary transition-colors`}
                  >
                    <div className="space-y-1 text-center">
                      {fileName && !fileError ? (
                        <>
                          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                          <p className="text-sm text-muted-foreground">
                            File terpilih: <span className="font-medium text-foreground">{fileName}</span>
                          </p>
                        </>
                      ) : fileError ? (
                         <>
                          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                           <p className="text-sm text-destructive">{fileError}</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Klik untuk memilih file atau tarik dan lepas
                          </p>
                          <p className="text-xs text-muted-foreground">PDF hingga {MAX_FILE_SIZE / (1024*1024)}MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.getValues("cvFile") || !!fileError}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan CV Baru"}
        </Button>
         {currentCvUrl && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            CV saat ini: <a href={currentCvUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{currentCvUrl.split('/').pop()}</a>
          </p>
        )}
      </form>
    </Form>
  );
}
