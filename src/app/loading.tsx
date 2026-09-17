import { Zap } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
        <Zap className="h-6 w-6" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">
        Loading EV Catalog...
      </p>
    </div>
  );
}
