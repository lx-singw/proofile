import { LoadingSpinner } from "./loading-spinner";

export function FullPageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background animate-in fade-in-0 duration-500"
      aria-label="Loading application..."
    >
      <LoadingSpinner className="size-8 text-primary" />
    </div>
  );
}