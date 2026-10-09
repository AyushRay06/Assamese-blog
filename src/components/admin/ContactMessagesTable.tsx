"use client";

import * as React from "react";
import { Mail, Clock, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: Date | string;
}

interface ContactMessagesTableProps {
  messages: ContactMessageItem[];
}

export function ContactMessagesTable({ messages }: ContactMessagesTableProps) {
  const [selectedMessage, setSelectedMessage] = React.useState<ContactMessageItem | null>(null);

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>Incoming Contact Queries</span>
          </CardTitle>
          <CardDescription>
            Messages submitted by visitors via the public website contact form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 stroke-[1.5] mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No contact messages received yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              When people reach out via the contact form, their queries will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>Incoming Contact Queries ({messages.length})</span>
            </CardTitle>
            <CardDescription>
              Direct queries, research invitations, and correspondence received through the website.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          {messages.map((msg) => {
            const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2 hover:bg-muted/20 px-2 rounded-sm transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {msg.name}
                    </span>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
                    >
                      <span>&lt;{msg.email}&gt;</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{date}</span>
                    </span>
                    <Badge variant={msg.status === "UNREAD" ? "default" : "secondary"} className="text-[10px] uppercase font-mono h-5">
                      {msg.status}
                    </Badge>
                  </div>
                </div>

                {msg.subject && (
                  <p className="text-xs font-medium text-foreground/90 font-mono">
                    Subject: {msg.subject}
                  </p>
                )}

                <div className="bg-muted/40 p-3 rounded-none text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border/40">
                  {msg.message}
                </div>

                <div className="flex items-center justify-end gap-3 pt-1 text-xs">
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Website Inquiry")}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                  >
                    <span>Reply via Email</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
export default ContactMessagesTable;
