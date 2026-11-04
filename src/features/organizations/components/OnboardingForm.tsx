"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

import { FieldError, describedBy } from "@/components/forms/FieldError";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getDefaultSchedule } from "@/features/schedules/constants/defaultSchedule";
import { ScheduleEditor } from "@/features/schedules/components/ScheduleEditor";
import { slugify } from "@/lib/slugify";
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  createOrganizationSchema,
} from "@/lib/validations/organization.schema";

import { createOrganization } from "../actions/createOrganization";

import type { CreateOrganizationInput } from "@/lib/validations/organization.schema";
import type { FieldPath } from "react-hook-form";

interface OnboardingFormProps {
  /** IANA zones to choose from, sorted. */
  timezones: string[];
  /** The site's host, shown before the slug, e.g. "timetrack.musme.co". */
  siteHost: string;
}

const FALLBACK_TIMEZONE = "UTC";

// The browser's zone never changes while the page is open.
const subscribeToNothing = () => () => {};
const readBrowserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || null;
const readNoTimezone = () => null;

/** Create an org: name, URL, timezone and working hours, in one step. */
export function OnboardingForm({ timezones, siteHost }: OnboardingFormProps) {
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      slug: "",
      timezone: FALLBACK_TIMEZONE,
      schedule: getDefaultSchedule(),
    },
  });
  const { register, control, formState, setValue, getFieldState, setError } =
    form;
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Detected after hydration, so the server and browser render the same HTML.
  const browserTimezone = useSyncExternalStore(
    subscribeToNothing,
    readBrowserTimezone,
    readNoTimezone,
  );
  const timezone = useWatch({ control, name: "timezone" });
  const timezoneOptions =
    browserTimezone && !timezones.includes(browserTimezone)
      ? [browserTimezone, ...timezones]
      : timezones;

  useEffect(() => {
    if (browserTimezone && !getFieldState("timezone").isDirty) {
      setValue("timezone", browserTimezone);
    }
  }, [browserTimezone, getFieldState, setValue]);

  const nameField = register("name", {
    onChange: (event: { target: { value: string } }) => {
      if (!slugEdited) {
        setValue("slug", slugify(event.target.value), {
          shouldValidate: getFieldState("slug").isTouched,
        });
      }
    },
  });
  const slugField = register("slug", {
    onChange: () => setSlugEdited(true),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    // Redirects to the new dashboard on success; returns only on failure.
    const result = await createOrganization(values);

    const fieldErrors = result.errors?.filter((error) => error.field) ?? [];
    for (const [index, error] of fieldErrors.entries()) {
      setError(
        error.field as FieldPath<CreateOrganizationInput>,
        { message: error.message },
        { shouldFocus: index === 0 },
      );
    }
    if (fieldErrors.length === 0) setSubmitError(result.message);
  });

  const { errors, isSubmitting } = formState;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <section
          aria-labelledby="organization-heading"
          className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs sm:p-6"
        >
          <h2 id="organization-heading" className="text-lg font-semibold">
            Your organization
          </h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="org-name" className="text-sm font-medium">
              Organization name
            </label>
            <Input
              id="org-name"
              autoComplete="organization"
              maxLength={ORGANIZATION_NAME_MAX_LENGTH}
              placeholder="Acme Inc"
              className="h-10"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy(errors.name && "org-name-error")}
              {...nameField}
            />
            <FieldError id="org-name-error" message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="org-slug" className="text-sm font-medium">
              Web address
            </label>
            <div className="flex h-10 min-w-0 items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:bg-input/30">
              <span
                aria-hidden="true"
                className="shrink-0 pl-2.5 text-sm text-muted-foreground"
              >
                <span className="max-sm:hidden">{siteHost}</span>/o/
              </span>
              <input
                id="org-slug"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={SLUG_MAX_LENGTH}
                placeholder="acme"
                className="h-full min-w-0 flex-1 bg-transparent pr-2.5 text-base outline-none md:text-sm"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={describedBy(
                  "org-slug-hint",
                  errors.slug && "org-slug-error",
                )}
                {...slugField}
              />
            </div>
            <p id="org-slug-hint" className="text-sm text-muted-foreground">
              Lowercase letters, numbers and hyphens. Your team&apos;s links use
              it.
            </p>
            <FieldError id="org-slug-error" message={errors.slug?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="org-timezone" className="text-sm font-medium">
              Timezone
            </label>
            <NativeSelect
              id="org-timezone"
              className="w-full sm:max-w-sm [&_select]:h-10"
              aria-invalid={Boolean(errors.timezone)}
              aria-describedby={describedBy(
                "org-timezone-hint",
                errors.timezone && "org-timezone-error",
              )}
              {...register("timezone")}
            >
              {timezoneOptions.map((zone) => (
                <NativeSelectOption key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p id="org-timezone-hint" className="text-sm text-muted-foreground">
              {timezone === browserTimezone
                ? "Detected from your browser. "
                : ""}
              Every date, schedule and report uses this timezone.
            </p>
            <FieldError
              id="org-timezone-error"
              message={errors.timezone?.message}
            />
          </div>
        </section>

        <section
          aria-labelledby="hours-heading"
          aria-describedby="hours-description"
          className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="hours-heading" className="text-lg font-semibold">
              Working hours
            </h2>
            <p id="hours-description" className="text-sm text-muted-foreground">
              When your team is expected to work. Owners and admins can change
              them later.
            </p>
          </div>
          <ScheduleEditor />
        </section>

        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonVariants({
              size: "lg",
              className: "max-sm:w-full",
            })}
          >
            {isSubmitting ? (
              <LoaderCircle
                aria-hidden="true"
                className="opacity-60 motion-safe:animate-spin motion-safe:opacity-100"
              />
            ) : null}
            <span aria-live="polite">
              {isSubmitting
                ? "Creating your organization…"
                : "Create organization"}
            </span>
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
