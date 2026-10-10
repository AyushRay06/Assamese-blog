"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Clock,
  MessageSquare,
  ExternalLink,
  Trash2,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteContactMessageAction,
  deleteAllContactMessagesAction,
  toggleContactMessageStatusAction,
} from "@/actions/contacts";
import { toast } from "sonner";
import { cn } from "cn";

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
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [messageToDelete, setMessageToDelete] = React.useState<ContactMessageItem | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = React.useState(false);

  const handleDeleteSingle = async () => {
    if (!messageToDelete) return;

    const id = messageToDelete.id;
    startTransition(async () => {
      try {
        const res = await deleteContactMessageAction(id);
        if (!res.success) {
          toast.error(res.error || "Failed to delete contact query");
          return;
        }
        toast.success("Contact query deleted successfully");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete contact query");
      } finally {
        setMessageToDelete(null);
      }
    });
  };

  const handleDeleteAll = async () => {
    startTransition(async () => {
      try {
        const res = await deleteAllContactMessagesAction();
        if (!res.success) {
          toast.error(res.error || "Failed to delete all contact queries");
          return;
        }
        toast.success(`Deleted ${res.count} contact queries`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete contact queries");
      } finally {
        setIsDeleteAllOpen(false);
      }
    });
  };

  const handleToggleStatus = async (id: string) => {
    startTransition(async () => {
      try {
        const res = await toggleContactMessageStatusAction(id);
        if (!res.success) {
          toast.error(res.error || "Failed to update status");
          return;
        }
        toast.success(
          res.status === "READ" ? "Marked query as read" : "Marked query as unread"
        );
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/20 p-12 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 stroke-[1.5] mb-2 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No contact inquiries yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            When visitors send questions or research invitations through the contact form, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/30 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Reader Inquiries ({messages.length})</span>
              </h2>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-[10px] font-mono rounded-full px-2 py-0.5 bg-primary">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Correspondence submitted by visitors via the public website.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setIsDeleteAllOpen(true)}
            className="h-8 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 rounded-full gap-1.5 self-start sm:self-auto px-3.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </Button>
        </div>

        <div className="divide-y divide-border/30">
          {messages.map((msg) => {
            const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isUnread = msg.status === "UNREAD";

            return (
              <div
                key={msg.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col gap-3 transition-colors rounded-xl px-2 hover:bg-muted/15"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <Badge
                      variant={isUnread ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] uppercase font-mono rounded-full px-2 py-0.5",
                        isUnread ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {msg.status}
                    </Badge>
                  </div>
                </div>

                {msg.subject && (
                  <p className="text-xs font-semibold text-foreground/90">
                    Subject: {msg.subject}
                  </p>
                )}

                <div className="bg-muted/30 p-4 rounded-xl text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleStatus(msg.id)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-3 rounded-full hover:bg-muted/50"
                    title={isUnread ? "Mark as Read" : "Mark as Unread"}
                  >
                    {isUnread ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Mark Read</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3" />
                        <span>Mark Unread</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Website Inquiry")}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs px-3 py-1 rounded-full hover:bg-primary/5 transition-colors font-medium"
                  >
                    <span>Reply</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setMessageToDelete(msg)}
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 px-3 rounded-full"
                    title="Delete this query"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Single Message Dialog */}
      <AlertDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border/40 p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Delete Contact Query?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this message from{" "}
              <strong className="text-foreground">{messageToDelete?.name}</strong> (
              {messageToDelete?.email})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel
              disabled={isPending}
              className="text-xs rounded-full px-4"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDeleteSingle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-full px-4"
            >
              Delete Query
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Messages Dialog */}
      <AlertDialog
        open={isDeleteAllOpen}
        onOpenChange={setIsDeleteAllOpen}
      >
        <AlertDialogContent className="rounded-2xl border-border/40 p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              Delete All Contact Queries?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all{" "}
              <strong className="text-foreground">{messages.length}</strong> inquiries from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel
              disabled={isPending}
              className="text-xs rounded-full px-4"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-full px-4"
            >
              Clear All Queries
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
