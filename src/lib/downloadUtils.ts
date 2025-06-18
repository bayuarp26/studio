
"use client";

export function downloadDataUri(dataUri: string, filename: string): void {
  if (!dataUri || !dataUri.startsWith('data:')) {
    console.error('Invalid Data URI provided for download.');
    // Menampilkan pesan error ke pengguna bisa lebih baik daripada alert
    // Misalnya menggunakan sistem toast jika sudah ada
    alert('Format Data URI tidak valid untuk diunduh.');
    return;
  }

  try {
    const [header, base64Data] = dataUri.split(',');
    if (!header || !base64Data) {
        throw new Error('Data URI format is incorrect.');
    }
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        throw new Error('Could not extract MIME type from Data URI.');
    }
    const mimeType = mimeTypeMatch[1];

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Error downloading Data URI:', error);
    alert('Gagal mengunduh file. Silakan coba lagi atau periksa konsol untuk detail.');
  }
}
