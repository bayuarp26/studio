'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function UnderConstructionView() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary mb-6">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Sorry, this app is under construction!</h1>
      <p className="text-lg text-muted-foreground mb-6">The main portfolio page is temporarily unavailable now.</p>
      <p className="text-sm text-muted-foreground mb-4">
        Please wait a few minutes.
      </p>
      <Button variant="outline" onClick={handleReload}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Reload Page
      </Button>
    </div>
  );
}
