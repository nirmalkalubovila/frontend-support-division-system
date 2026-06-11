"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/atoms/copyButton";
import { Separator } from "@/components/ui/separator";
import { generateElectionLink } from "@/lib/api/server/sharing/generate-election-link";
import { sendElectionLinkEmail } from "@/lib/api/server/sharing/send-election-link-email";
import { Link2, Mail, RefreshCw, Send, Check } from "lucide-react";

interface ShareManagerProps {
  electionId: string;
  electionLink: string;
  slug: string;
}

export function ShareManager({ electionId, electionLink, slug }: ShareManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState(electionLink);
  const [emails, setEmails] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerateLink = () => {
    startTransition(async () => {
      const result = await generateElectionLink(electionId);
      setLink(result.link);
    });
  };

  const handleSendEmails = () => {
    const emailList = emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      setError("Enter at least one email");
      return;
    }

    startTransition(async () => {
      try {
        await sendElectionLinkEmail(electionId, emailList);
        setEmailSent(true);
        setEmails("");
        setError(null);
        setTimeout(() => setEmailSent(false), 5000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Election link */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Election Link</h3>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={link}
            readOnly
            className="flex-1 bg-[var(--background)] text-[var(--text-secondary)] select-all font-mono text-xs"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <CopyButton value={link} />
        </div>

        <Button variant="outline" size="sm" onClick={handleRegenerateLink} disabled={isPending}>
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      <Separator />

      {/* Email invitations */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Email Invitations</h3>
        </div>


        <div className="space-y-2">
          <Label htmlFor="invite-emails">Email Addresses</Label>
          <Textarea
            id="invite-emails"
            placeholder="Enter email addresses, one per line or comma-separated..."
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--destructive)]">{error}</p>
        )}
        {emailSent && (
          <p className="text-sm text-[var(--secondary)] flex items-center gap-1">
            <Check className="h-4 w-4" /> Invitations sent!
          </p>
        )}

        <Button onClick={handleSendEmails} disabled={isPending}>
          <Send className="h-4 w-4" />
          {isPending ? "Sending..." : "Send Invitations"}
        </Button>
      </div>
    </div>
  );
}
