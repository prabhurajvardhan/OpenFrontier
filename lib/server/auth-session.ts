type AuthUser = { id: string; email?: string | null };
type UserLookup = () => Promise<{ data: { user: AuthUser | null }; error: unknown | null }>;

type SessionResult =
  | { status: 200; body: { authenticated: false } }
  | { status: 200; body: { authenticated: true; user: { id: string; email: string | null } } }
  | { status: 503; body: { error: "auth_unavailable" } };

export async function resolveVerifiedSession(readUser: UserLookup): Promise<SessionResult> {
  try {
    const { data, error } = await readUser();
    if (error || !data.user) return { status: 200, body: { authenticated: false } };
    return {
      status: 200,
      body: { authenticated: true, user: { id: data.user.id, email: data.user.email ?? null } },
    };
  } catch {
    return { status: 503, body: { error: "auth_unavailable" } };
  }
}
