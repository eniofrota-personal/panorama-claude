export type SessionUser = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "GESTOR" | "OPERADOR"
}

// Stub — replace with real NextAuth session when auth is wired up
export async function getSession(): Promise<{ user: SessionUser }> {
  return {
    user: {
      id: "stub-user-id",
      name: "Usuário Teste",
      email: "teste@panorama.com",
      role: "OPERADOR",
    },
  }
}
