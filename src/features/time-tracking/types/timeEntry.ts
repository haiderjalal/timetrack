import type { Enums } from "@/types/database.types";

export type EntrySource = Enums<"entry_source">;

/** One clock-in → clock-out session (`time_entries` row). */
export interface TimeEntry {
  id: string;
  /** Org-local date of the clock-in, `YYYY-MM-DD`. */
  workDate: string;
  /** ISO instants set by the database, never by the device. */
  clockInAt: string;
  /** Null while the session is running. */
  clockOutAt: string | null;
  clockInSource: EntrySource;
  /** Closed by the forgotten-clock-out rule (business-rules.md §6). */
  autoClosed: boolean;
  note: string | null;
}
