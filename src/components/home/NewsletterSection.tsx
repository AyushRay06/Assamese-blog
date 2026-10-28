"use client";

import * as React from "react";
import { Mail, CheckCircle2, ArrowRight, Loader2, BellRing, Users } from "lucide-react";
import { toast } from "sonner";

interface NewsletterSectionProps {
  initialSubscriberCount?: number;
}

export function NewsletterSection({ initialSubscriberCount = 0 }: NewsletterSectionProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [subscriberCount, setSubscriberCount] = React.useState<number>(initialSubscriberCount);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  // Sync count on mount and periodically
  React.useEffect(() => {
    let isMounted = true;
    async function loadSubscriberCount() {
      try {
        const res = await fetch("/api/subscribe");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === "number") {
            setSubscriberCount(data.count);
          }
        }
      } catch {
        // Fallback silently
      }
    }

    loadSubscriberCount();
    const interval = setInterval(loadSubscriberCount, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe. Please try again.");
      }

      setIsSubscribed(true);
      if (typeof data.count === "number") {
        setSubscriberCount(data.count);
      }
      setEmail("");
      setName("");
      toast.success(data.message || "Thank you for subscribing!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="subscribe" className="relative py-16 sm:py-20">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-b from-card/90 to-muted/30 p-8 sm:p-12 lg:p-14 shadow-xs">
          {/* Subtle architectural background grid accents */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl text-center space-y-6">
            {/* Top pill badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/70 bg-background/80 text-[11px] font-mono uppercase tracking-widest text-muted-foreground shadow-xs">
                <BellRing className="h-3 w-3 text-primary shrink-0" />
                <span>Publication Alerts &bull; প্ৰকাশনৰ জাননী</span>
              </div>

              {/* Live Subscriber Count Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 shadow-xs"
                title="Current active subscribers receiving new essay alerts"
              >
                <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{subscriberCount.toLocaleString()}</span>
                <span>{subscriberCount === 1 ? "Subscriber" : "Subscribers"}</span>
              </div>
            </div>

            {/* Heading and subtext */}
            <div className="space-y-3">
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Subscribe to Academic Publications
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Get email notifications whenever a new research essay, mathematical reflection, or Assamese cultural narrative is published by Prof. Surajit Borkotokey.
              </p>
            </div>

            {/* Subscription Form */}
            {isSubscribed ? (
              <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                  You are subscribed!
                </h3>
                <p className="text-xs text-muted-foreground">
                  You will receive email notifications directly to your inbox whenever a new blog is published.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubscribed(false)}
                  className="mt-2 text-xs font-mono text-primary underline hover:text-primary/80 cursor-pointer"
                >
                  Subscribe another email address
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative w-full">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full rounded-xl border border-border/80 bg-background/90 px-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-xs font-mono uppercase tracking-wider font-semibold transition-all hover:bg-foreground/90 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] font-mono text-muted-foreground/70">
                  Zero spam &bull; Unsubscribe at any time with 1 click
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
