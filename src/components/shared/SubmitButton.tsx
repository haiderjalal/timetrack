"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";

import type { ButtonVariantProps } from "@/components/ui/button-variants";
import type { ReactNode } from "react";

interface SubmitButtonProps extends ButtonVariantProps {
  children: ReactNode;
  /** Shown while the form is submitting, e.g. "Signing out…". */
  pendingLabel: string;
  /** Leading icon, swapped for a spinner while pending. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

/** A form submit button that disables itself and shows progress while pending. */
export function SubmitButton({
  children,
  pendingLabel,
  icon,
  fullWidth = false,
  variant,
  size,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonVariants({
        variant,
        size,
        className: fullWidth ? "w-full" : undefined,
      })}
    >
      {pending ? (
        <LoaderCircle
          className="opacity-60 motion-safe:animate-spin motion-safe:opacity-100"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </button>
  );
}
