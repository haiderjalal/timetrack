-- Indexes for the lookups the app runs on every visit (docs/database.md §4.4).
-- list_my_invitations() finds a person's open invitations by email. Without this
-- index, each signed-in visit to the account or onboarding page scans every invitation.
create index invitations_open_by_email
  on public.invitations (email)
  where accepted_at is null and revoked_at is null;
