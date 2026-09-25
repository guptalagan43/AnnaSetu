import { Skeleton } from "@/components/ui/Skeleton";
import { Logo } from "@/components/ui/Logo";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-brand-white flex flex-col items-center justify-center p-6" role="status" aria-busy="true">
      <div className="max-w-md w-full bg-brand-cream border-2 border-brand-black shadow-brutal p-8 text-center space-y-4 flex flex-col items-center">
        <Logo size="lg" className="animate-pulse" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
        <div className="pt-2 flex justify-center gap-2">
          <div className="w-2.5 h-2.5 bg-brand-red animate-ping" />
          <div className="w-2.5 h-2.5 bg-brand-black" />
          <div className="w-2.5 h-2.5 bg-brand-black" />
        </div>
      </div>
    </div>
  );
}
