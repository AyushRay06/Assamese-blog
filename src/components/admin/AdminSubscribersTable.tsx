"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Mail,
  Copy,
  Check,
  Download,
  Search,
  Trash2,
  Calendar,
  UserCheck,
  UserX,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  deleteSubscriberAction,
  toggleSubscriberStatusAction,
} from "@/actions/subscribers";
import { toast } from "sonner";
import { cn } from "cn";
import { AdminSubscriberItem } from "@/lib/subscribers";

interface AdminSubscribersTableProps {
  initialSubscribers: AdminSubscriberItem[];
}

export function AdminSubscribersTable({
  initialSubscribers,
}: AdminSubscribersTableProps) {
  const router = useRouter();
  const [subscribers, setSubscribers] = React.useState<AdminSubscriberItem[]>(
    initialSubscribers
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "UNSUBSCRIBED"
  >("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedAll, setCopiedAll] = React.useState(false);
  const [subscriberToDelete, setSubscriberToDelete] =
    React.useState<AdminSubscriberItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [loadingToggleId, setLoadingToggleId] = React.useState<string | null>(null);

  // Sync state if initialSubscribers prop changes
  React.useEffect(() => {
    setSubscribers(initialSubscribers);
  }, [initialSubscribers]);

  // Client-side filtering
  const filteredSubscribers = React.useMemo(() => {
    return subscribers.filter((sub) => {
      // Filter by status
      if (statusFilter === "ACTIVE" && !sub.isActive) return false;
      if (statusFilter === "UNSUBSCRIBED" && sub.isActive) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesEmail = sub.email.toLowerCase().includes(query);
        const matchesName = sub.name?.toLowerCase().includes(query) ?? false;
        if (!matchesEmail && !matchesName) return false;
      }

      return true;
    });
  }, [subscribers, statusFilter, searchQuery]);

  const activeCount = React.useMemo(
    () => subscribers.filter((s) => s.isActive).length,
    [subscribers]
  );
  const unsubscribedCount = subscribers.length - activeCount;

  // Copy single email to clipboard
  const handleCopyEmail = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  };

  // Copy all filtered emails
  const handleCopyAllEmails = async () => {
    const emailsToCopy = filteredSubscribers
      .filter((s) => s.isActive)
      .map((s) => s.email);

    if (emailsToCopy.length === 0) {
      toast.info("No active subscriber emails to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(emailsToCopy.join(", "));
      setCopiedAll(true);
      toast.success(
        `Copied ${emailsToCopy.length} subscriber email${
          emailsToCopy.length === 1 ? "" : "s"
        } to clipboard`
      );
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      toast.error("Failed to copy emails");
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.info("No subscriber records to export");
      return;
    }

    const headers = ["Email", "Name", "Status", "Subscribed Date", "Unsubscribed Date"];
    const rows = subscribers.map((sub) => [
      `"${sub.email.replace(/"/g, '""')}"`,
      `"${(sub.name || "").replace(/"/g, '""')}"`,
      sub.isActive ? "Active" : "Unsubscribed",
      `"${new Date(sub.subscribedAt).toISOString()}"`,
      sub.unsubscribedAt ? `"${new Date(sub.unsubscribedAt).toISOString()}"` : '""',
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `subscribers_archive_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscriber archive exported successfully");
  };

  // Toggle active / unsubscribed status
  const handleToggleStatus = async (sub: AdminSubscriberItem) => {
    setLoadingToggleId(sub.id);
    try {
      const res = await toggleSubscriberStatusAction(sub.id);
      if (!res.success) {
        toast.error(res.error || "Failed to update subscriber status");
        return;
      }

      setSubscribers((prev) =>
        prev.map((item) =>
          item.id === sub.id
            ? {
                ...item,
                isActive: res.isActive,
                unsubscribedAt: res.isActive ? null : new Date(),
              }
            : item
        )
      );

      toast.success(
        res.isActive
          ? `Reactivated ${sub.email}`
          : `Unsubscribed ${sub.email}`
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle status"
      );
    } finally {
      setLoadingToggleId(null);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!subscriberToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteSubscriberAction(subscriberToDelete.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete subscriber");
        return;
      }

      setSubscribers((prev) =>
        prev.filter((item) => item.id !== subscriberToDelete.id)
      );
      toast.success(`Removed ${subscriberToDelete.email} from subscribers`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete subscriber"
      );
    } finally {
      setIsDeleting(false);
      setSubscriberToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Instant Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email address or name..."
            className="pl-9 pr-8 text-xs h-9 bg-muted/20 border-border/40 rounded-full focus:bg-background transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-muted/40 border border-border/40">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                statusFilter === "ALL"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({subscribers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("UNSUBSCRIBED")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                statusFilter === "UNSUBSCRIBED"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unsubscribed ({unsubscribedCount})
            </button>
          </div>

          <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

          {/* Action: Copy Active Emails */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyAllEmails}
            className="rounded-full text-xs h-8 gap-1.5 cursor-pointer shadow-2xs"
            title="Copy active subscriber emails comma-separated"
          >
            {copiedAll ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>{copiedAll ? "Copied All" : "Copy Emails"}</span>
          </Button>

          {/* Action: Export CSV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-full text-xs h-8 gap-1.5 cursor-pointer shadow-2xs"
            title="Download subscribers as CSV archive"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Subscribers Table */}
      <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs overflow-hidden shadow-xs">
        {filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
              <Users className="w-5 h-5 opacity-60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {searchQuery
                  ? "No matching subscribers found"
                  : "No email subscribers registered yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching with a different keyword or email address."
                  : "When readers subscribe through the newsletter section on the homepage, their email addresses will appear here."}
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  <th className="py-3 px-4 font-medium">Subscriber Email</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Subscribed Date</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredSubscribers.map((sub) => {
                  const isCopied = copiedId === sub.id;
                  const isToggling = loadingToggleId === sub.id;
                  const dateObj = new Date(sub.subscribedAt);
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={sub.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      {/* Email with copy button */}
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Mail className="w-3 h-3" />
                          </div>
                          <span className="truncate max-w-[220px] sm:max-w-xs select-all">
                            {sub.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(sub.email, sub.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer rounded-sm hover:bg-muted"
                            title="Copy email to clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {sub.name ? (
                          <span className="text-foreground font-medium">
                            {sub.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">
                            Not specified
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {sub.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                            Unsubscribed
                          </span>
                        )}
                      </td>

                      {/* Subscribed Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        <div
                          className="flex items-center gap-1.5"
                          title={`${formattedDate} at ${formattedTime}`}
                        >
                          <Calendar className="w-3 h-3 opacity-60" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Unsubscribe status */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleToggleStatus(sub)}
                            disabled={isToggling}
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                            title={
                              sub.isActive
                                ? "Mark as unsubscribed"
                                : "Reactivate subscription"
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : sub.isActive ? (
                              <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setSubscriberToDelete(sub)}
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Remove subscriber record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(subscriberToDelete)}
        onOpenChange={(open) => {
          if (!open) setSubscriberToDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Remove Subscriber?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove{" "}
              <strong className="text-foreground font-mono">
                {subscriberToDelete?.email}
              </strong>{" "}
              from the subscriber list? This subscriber will no longer receive
              automatic publication emails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isDeleting}
              className="text-xs rounded-full h-8"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-xs rounded-full h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Removing..." : "Remove Subscriber"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
