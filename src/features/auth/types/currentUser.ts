/** The signed-in person, as the UI needs them. Never the raw session. */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
