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
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // Dialog state for deleting a single message
  const [messageToDelete, setMessageToDelete] = React.useState<ContactMessageItem | null>(null);

  // Dialog state for deleting all messages
  const [isDeleteAllOpen, setIsDeleteAllOpen] = React.useState(false);

  // Handler for single message deletion
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

  // Handler for deleting all messages
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

  // Handler for toggling status (Read <-> Unread)
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

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Incoming Contact Queries ({messages.length})</span>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[10px] font-mono h-5 bg-primary">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Direct queries, research invitations, and correspondence received through the website.
              </CardDescription>
            </div>

            {/* Bulk actions */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setIsDeleteAllOpen(true)}
              className="h-8 text-xs font-mono text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Queries</span>
            </Button>
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

              const isUnread = msg.status === "UNREAD";

              return (
                <div
                  key={msg.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2 hover:bg-muted/20 px-2 rounded-sm transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
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
                        className="text-[10px] uppercase font-mono h-5"
                      >
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

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 text-xs">
                    {/* Mark Read/Unread */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(msg.id)}
                      className="h-7 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1 px-2"
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

                    {/* Reply via email */}
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Website Inquiry")}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] px-2 py-1 rounded-sm hover:bg-primary/5 transition-colors"
                    >
                      <span>Reply via Email</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    {/* Delete Option */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setMessageToDelete(msg)}
                      className="h-7 text-[11px] font-mono text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                      title="Delete this query"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Delete Single Query */}
      <AlertDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Contact Query?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-1 text-sm">
              <p>
                Are you sure you want to permanently delete the inquiry from{" "}
                <strong className="text-foreground">{messageToDelete?.name}</strong>{" "}
                ({messageToDelete?.email})?
              </p>
              <p className="text-xs text-muted-foreground">
                This record will be permanently deleted from the database. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Query</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog: Delete All Queries */}
      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Clear All Contact Queries?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-1 text-sm">
              <p>
                Are you sure you want to delete all{" "}
                <strong className="text-foreground">{messages.length}</strong> incoming contact
                queries?
              </p>
              <p className="text-xs text-muted-foreground">
                All visitor contact messages will be permanently removed from your database. This action
                cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Clearing all...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete All Queries</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ContactMessagesTable;
