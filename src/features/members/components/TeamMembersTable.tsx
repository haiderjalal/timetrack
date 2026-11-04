"use client";

import { useState, useTransition } from "react";

import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  ROLE_LABELS,
  canChangeRole,
  canDeactivate,
} from "@/features/organizations/utils/roles";
import { INVITABLE_ROLES } from "@/lib/validations/invitation.schema";
import { formatDateInZone } from "@/lib/time/formatDateInZone";

import { changeMemberRole } from "../actions/changeMemberRole";
import { deactivateMember } from "../actions/deactivateMember";

import type { OrganizationRole } from "@/features/organizations/types/organization";
import type { TeamMember } from "../types/member";

interface TeamMembersTableProps {
  orgSlug: string;
  actorUserId: string;
  actorRole: OrganizationRole;
  members: TeamMember[];
  timeZone: string;
}

interface Feedback {
  tone: "status" | "alert";
  text: string;
}

const STATUS_LABELS = { active: "Active", deactivated: "Deactivated" } as const;

/**
 * Everyone on the team. Controls appear only where the rules allow them, and the
 * server checks again on every change.
 */
export function TeamMembersTable({
  orgSlug,
  actorUserId,
  actorRole,
  members,
  timeZone,
}: TeamMembersTableProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [toDeactivate, setToDeactivate] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeRole(member: TeamMember, value: string): void {
    const role = INVITABLE_ROLES.find((candidate) => candidate === value);
    if (!role) return;

    startTransition(async () => {
      const result = await changeMemberRole(orgSlug, member.userId, role);
      setFeedback(
        result.success
          ? {
              tone: "status",
              text: `${member.name} is now ${ROLE_LABELS[role].toLowerCase()}.`,
            }
          : { tone: "alert", text: result.message },
      );
    });
  }

  function confirmDeactivate(member: TeamMember): void {
    startTransition(async () => {
      const result = await deactivateMember(orgSlug, member.userId);
      setToDeactivate(null);
      setFeedback(
        result.success
          ? { tone: "status", text: `${member.name} has been deactivated.` }
          : { tone: "alert", text: result.message },
      );
    });
  }

  return (
    <section
      aria-labelledby="team-members-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <h2 id="team-members-title" className="text-base font-semibold">
        People
      </h2>

      <p
        role={feedback?.tone ?? "status"}
        className="min-h-5 text-sm text-muted-foreground empty:hidden"
      >
        {feedback?.tone === "alert" ? (
          <span className="text-destructive">{feedback.text}</span>
        ) : (
          feedback?.text
        )}
      </p>

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">
            Everyone on the team, with role and status
          </caption>
          <thead className="text-xs font-medium text-muted-foreground">
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4 font-medium">
                Person
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Role
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Status
              </th>
              <th
                scope="col"
                className="hidden py-2 pr-4 font-medium md:table-cell"
              >
                Joined
              </th>
              <th scope="col" className="py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => {
              const isSelf = member.userId === actorUserId;
              const isActive = member.status === "active";
              const roleEditable =
                isActive && !isSelf && canChangeRole(actorRole, member.role);
              const deactivatable =
                isActive && !isSelf && canDeactivate(actorRole, member.role);

              return (
                <tr key={member.userId}>
                  <td className="py-3 pr-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        name={member.name}
                        avatarUrl={member.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {member.name}
                          {isSelf ? (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {roleEditable ? (
                      <NativeSelect
                        key={`${member.userId}-${member.role}`}
                        aria-label={`Role for ${member.name}`}
                        defaultValue={member.role}
                        disabled={isPending}
                        onChange={(event) =>
                          changeRole(member, event.target.value)
                        }
                      >
                        {INVITABLE_ROLES.map((role) => (
                          <NativeSelectOption key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    ) : (
                      ROLE_LABELS[member.role]
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={isActive ? "" : "text-muted-foreground"}>
                      {STATUS_LABELS[member.status]}
                    </span>
                  </td>
                  <td className="hidden py-3 pr-4 text-muted-foreground tabular md:table-cell">
                    {formatDateInZone(member.joinedAt, timeZone)}
                  </td>
                  <td className="py-3 text-right">
                    {deactivatable ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        aria-label={`Deactivate ${member.name}`}
                        onClick={() => setToDeactivate(member)}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={toDeactivate !== null}
        onOpenChange={(open) => !open && setToDeactivate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {toDeactivate?.name}?</DialogTitle>
            <DialogDescription>
              They lose access right away. Their attendance history stays in
              reports, and they can rejoin with a new invitation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => toDeactivate && confirmDeactivate(toDeactivate)}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
