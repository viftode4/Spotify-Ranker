import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
} 