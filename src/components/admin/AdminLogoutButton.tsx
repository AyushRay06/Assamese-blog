"use client";

import * as React from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore error and redirect anyway
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isLoading}
      onClick={handleLogout}
      className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
      title="Sign out of Admin Portal"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Sign Out</span>
    </Button>
  );
}
