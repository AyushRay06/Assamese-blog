"use client";

import * as React from "react";
import { Riffle } from "@lucasmarkes/hairline/react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ContactSection() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deliver message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message delivered successfully.");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Minimal Greeting & Riffle Figure (Card catalog / correspondence tray) */}
          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Correspondence
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Get in Touch
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Reach out regarding research collaborations, speaking invitations, or academic correspondence.
              </p>
            </div>

            {/* Riffle Figure: Free-standing, pure figure without any box, tag, or caption */}
            <div className="w-full max-w-[280px] sm:max-w-[320px]">
              <div className="relative aspect-[5/4] w-full select-none cursor-pointer">
                <Riffle
                  intensity={0.7}
                  play={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Aesthetic, Minimal Contact Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === "success" && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-sm">Message Delivered</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Your inquiry has been received and logged to the portal. Inquiries can also be viewed inside the Admin Portal.
                    </p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-semibold text-sm">Submission Error</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-1 focus:ring-foreground/20 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="Your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-1 focus:ring-foreground/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="Inquiry topic"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-1 focus:ring-foreground/20 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="Your message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-lg border border-border/80 bg-background/80 px-3.5 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:ring-1 focus:ring-foreground/20 focus:outline-none transition-colors resize-y"
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 text-xs font-mono uppercase tracking-wider transition-all hover:bg-foreground/90 disabled:opacity-50 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
export default ContactSection;
