
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DeleteCertificateButton from '@/components/delete-certificate-button'; 
import SectionContainer from '@/components/section-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlusCircle, UserCog, Home, LogOut, ShieldCheck, Projector } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { logoutAction } from "../../../profile/actions";
import type { CertificateDataForAdmin as CertificateData } from "../actions";
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';


interface ManageCertificatesClientContentProps {
  initialCertificates: CertificateData[];
  serverError: string | null;
}

export default function ManageCertificatesClientContent({ initialCertificates, serverError }: ManageCertificatesClientContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CertificateData[]>(initialCertificates);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setCertificates(initialCertificates);
  }, [initialCertificates]);

  useEffect(() => {
    if (serverError) {
      toast({
        variant: "destructive",
        title: "Gagal Memuat Sertifikat",
        description: serverError,
      });
    }
  }, [serverError, toast]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await logoutAction();
    if (result.success) {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil logout.",
      });
      router.refresh();
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

  const certificatesToDisplay = certificates || [];

  return (
    <SectionContainer id="manage-certificates-admin" className="bg-background min-h-screen pt-24 md:pt-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <h1 className="section-title mb-4 sm:mb-0">Kelola Sertifikat</h1>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <Button asChild size="lg">
              <Link href="/admin/add-certificate">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Tambah Sertifikat Baru
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

      {serverError && certificatesToDisplay.length === 0 ? (
         <div className="text-center py-10">
          <p className="text-xl text-destructive">Gagal memuat sertifikat.</p>
          <p className="text-muted-foreground mt-2">{serverError}</p>
           <Button onClick={() => router.refresh()} className="mt-4">Coba Lagi</Button>
        </div>
      ) : !serverError && certificatesToDisplay.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Belum ada sertifikat yang ditambahkan.</p>
          <p className="text-muted-foreground mt-2">Mulai dengan menambahkan sertifikat baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificatesToDisplay.map((cert) => (
            <div key={cert._id}>
              <Card className="flex flex-col overflow-hidden shadow-lg transition-shadow hover:shadow-md h-full">
                <CardHeader className="p-0">
                  <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                      src={cert.imageUrl}
                      alt={`Gambar sertifikat ${cert.title}`}
                      data-ai-hint={cert.imageHint}
                      fill
                      className="object-contain" 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <CardTitle className="text-lg lg:text-xl mb-1 text-primary line-clamp-2">{cert.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-1">
                    Diterbitkan oleh: <span className="font-medium text-foreground">{cert.issuingOrganization}</span>
                  </CardDescription>
                  <CardDescription className="text-xs text-muted-foreground mb-3">
                    Tanggal Terbit: {format(new Date(cert.issueDate), "dd MMMM yyyy", { locale: LocaleID })}
                  </CardDescription>
                  
                  <div className="mt-auto"> {/* Push buttons to bottom */}
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="w-full block mb-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Lihat Kredensial
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-3 border-t bg-muted/30 flex justify-end space-x-2">
                  <DeleteCertificateButton certificateId={cert._id} certificateTitle={cert.title} />
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}

    