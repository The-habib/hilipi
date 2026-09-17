"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 shadow-lg border-destructive/20">
        <CardContent className="pt-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We encountered an unexpected error while loading catalog data. Please try again or return to the store homepage.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Home className="h-4 w-4" /> Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
