"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserPlus } from "lucide-react";

import { FieldError, describedBy } from "@/components/forms/FieldError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { canInviteAs, ROLE_LABELS } from "@/features/organizations/utils/roles";
import {
  INVITABLE_ROLES,
  MAX_INVITES_PER_REQUEST,
  inviteFormSchema,
  parseInviteEmails,
} from "@/lib/validations/invitation.schema";

import { INVITATION_VALID_DAYS } from "../constants/invitations";
import { inviteMembers } from "../actions/inviteMembers";
import { describeInviteSummary } from "../utils/describeInviteSummary";

import type { OrganizationRole } from "@/features/organizations/types/organization";
import type { InviteFormValues } from "@/lib/validations/invitation.schema";

interface InviteMembersDialogProps {
  orgSlug: string;
  actorRole: OrganizationRole;
}

/** Invite people by email. Owners pick admin or member; admins can only invite members. */
export function InviteMembersDialog({
  orgSlug,
  actorRole,
}: InviteMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const roles = INVITABLE_ROLES.filter((role) => canInviteAs(actorRole, role));

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    mode: "onTouched",
    defaultValues: { emailsText: "", role: "member" },
  });
  const { register, handleSubmit, reset, setError, formState } = form;
  const { errors, isSubmitting } = formState;

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset({ emailsText: "", role: "member" });
      setSummary(null);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSummary(null);
    const { emails } = parseInviteEmails(values.emailsText);
    const result = await inviteMembers(orgSlug, { emails, role: values.role });

    if (!result.success) {
      setError("root", { message: result.message });
      return;
    }

    setSummary(describeInviteSummary(result.data));
    reset({ emailsText: "", role: values.role });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden="true" />
          Invite people
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            Each person gets an email with a link. The link works once and
            expires in {INVITATION_VALID_DAYS} days.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-emails" className="text-sm font-medium">
              Email addresses
            </label>
            <Textarea
              id="invite-emails"
              rows={4}
              placeholder="name@company.com, another@company.com"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.emailsText)}
              aria-describedby={describedBy(
                "invite-emails-hint",
                errors.emailsText && "invite-emails-error",
              )}
              {...register("emailsText")}
            />
            <p
              id="invite-emails-hint"
              className="text-sm text-muted-foreground"
            >
              Separate with commas, spaces or new lines. Up to{" "}
              {MAX_INVITES_PER_REQUEST} at a time.
            </p>
            <FieldError
              id="invite-emails-error"
              message={errors.emailsText?.message}
            />
          </div>

          {roles.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Role
              </label>
              <NativeSelect
                id="invite-role"
                className="w-full sm:max-w-xs [&_select]:h-10"
                {...register("role")}
              >
                {roles.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <p className="text-sm">
              <span className="text-muted-foreground">Role: </span>
              {ROLE_LABELS.member}
            </p>
          )}

          <p role="status" className="min-h-5 text-sm text-muted-foreground">
            {summary}
          </p>
          {errors.root ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          ) : null}

          <DialogFooter>
            {summary ? (
              <DialogClose asChild>
                <Button variant="outline">Done</Button>
              </DialogClose>
            ) : (
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle
                      className="motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isSubmitting ? "Sending…" : "Send invitations"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
