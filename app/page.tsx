"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import SupabaseManagerDialog from "@/components/supabase-manager";
import { Copy, CircleCheckBig } from "lucide-react";
import { ModeToggle } from "@/components/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogoSupabase } from "@/components/logo-supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const projectRef = searchParams.get("ref");

  useEffect(() => {
    if (projectRef) {
      setOpen(true);
    }
  }, [projectRef]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const projectId = formData.get("projectId") as string;
    const params = new URLSearchParams();
    params.set("ref", projectId);
    router.push(`/?${params.toString()}`);
  };

  const handleDialogClose = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Clear query params when dialog closes
      router.push("/");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex flex-col items-center justify-center max-w-xl border-l border-r h-full px-16">
        <LogoSupabase />
        <h1 className="mb-2 font-semibold mt-8">
          Embeddable Supabase Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Browse tables, run queries, configure auth, view logs and more
        </p>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
          <Input
            name="projectId"
            placeholder="Project ID"
            className="w-full max-w-md"
            required
          />
          <Button type="submit">Go</Button>
        </form>
      </div>
      {projectRef && (
        <SupabaseManagerDialog
          projectRef={projectRef}
          open={open}
          onOpenChange={handleDialogClose}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
