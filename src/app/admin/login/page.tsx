"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading admin portal...</span>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Hard redirect to ensure browser receives updated cookie headers across all components
      window.location.href = callbackUrl;
    } catch (err) {
      console.error("Login request error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Subtle background ambient styling */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Academic Portal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
            <span>Dibrugarh University &bull; Assam, India</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
            Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Editorial management &amp; publication suite for Prof. Surajit Borkotokey
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 shadow-md backdrop-blur-xs bg-card/90">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Faculty Sign In
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Enter your credentials to access the editorial dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              {/* Error Message Box */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs leading-relaxed animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-medium text-foreground font-mono uppercase tracking-wider"
                >
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="admin-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="pl-10 h-11 text-base sm:text-sm bg-background/60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-medium text-foreground font-mono uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10 pr-10 h-11 text-base sm:text-sm bg-background/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Default Credentials Helper */}
              <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-medium text-foreground">Default:</span>{" "}
                  <code className="bg-background px-1.5 py-0.5 rounded border border-border/60 font-mono text-[11px]">admin</code> /{" "}
                  <code className="bg-background px-1.5 py-0.5 rounded border border-border/60 font-mono text-[11px]">admin</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsername("admin");
                    setPassword("admin");
                    setErrorMessage(null);
                  }}
                  className="text-[11px] font-mono text-primary hover:underline cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 font-medium text-sm transition-all shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to Public Portal</span>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-muted-foreground/80 leading-relaxed font-mono">
          Authorized academic portal access only &bull; Sessions are secured via HTTP-only tokens
        </p>
      </div>
    </div>
  );
}
