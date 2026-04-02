import { create } from 'zustand'

const sessionKey = 'agent_dashboard_session'
const usersKey = 'agent_dashboard_users'

export type Role = 'admin' | 'user'

export type UserRecord = {
  username: string
  password: string
  role: Role
  createdAt: number
}

export type SessionUser = {
  username: string
  role: Role
}

export type AuthState = {
  isAuthed: boolean
  user: SessionUser | null
  users: UserRecord[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (user: { username: string; password: string; role: Role }) => { ok: true } | { ok: false; error: string }
  updateUser: (username: string, patch: Partial<Pick<UserRecord, 'password' | 'role'>>) => { ok: true } | { ok: false; error: string }
  removeUser: (username: string) => { ok: true } | { ok: false; error: string }
}

function loadUsers(): UserRecord[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(usersKey)
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data
      .map((v) => v as Partial<UserRecord>)
      .filter((u) => typeof u.username === 'string' && typeof u.password === 'string' && (u.role === 'admin' || u.role === 'user'))
      .map((u) => ({
        username: u.username!,
        password: u.password!,
        role: u.role as Role,
        createdAt: typeof u.createdAt === 'number' ? u.createdAt : Date.now(),
      }))
  } catch {
    return []
  }
}

function persistUsers(users: UserRecord[]) {
  window.localStorage.setItem(usersKey, JSON.stringify(users))
}

function loadSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(sessionKey)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<SessionUser>
    if (typeof data.username !== 'string') return null
    if (data.role !== 'admin' && data.role !== 'user') return null
    return { username: data.username, role: data.role }
  } catch {
    return null
  }
}

function persistSession(user: SessionUser | null) {
  if (!user) {
    window.localStorage.removeItem(sessionKey)
    return
  }
  window.localStorage.setItem(sessionKey, JSON.stringify(user))
}

function ensureBootstrapUsers(users: UserRecord[]): UserRecord[] {
  if (typeof window === 'undefined') return users
  if (users.length > 0) return users

  const adminUsername = (import.meta.env.VITE_ADMIN_USERNAME as string | undefined) || 'admin'
  const adminPassword =
    (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ||
    (import.meta.env.VITE_DASHBOARD_PASSWORD as string | undefined) ||
    'dmc'

  const next: UserRecord[] = [
    {
      username: adminUsername,
      password: adminPassword,
      role: 'admin',
      createdAt: Date.now(),
    },
  ]
  persistUsers(next)
  return next
}

export const useAuthStore = create<AuthState>((set, get) => {
  const session = loadSession()
  const initialUsers = ensureBootstrapUsers(loadUsers())
  const authed =
    session != null &&
    initialUsers.some((u) => u.username === session.username && u.role === session.role)

  return {
    isAuthed: authed,
    user: authed ? session : null,
    users: initialUsers,
    login: (username, password) => {
      const users = ensureBootstrapUsers(loadUsers())
      const u = users.find((x) => x.username === username)
      const ok = !!u && u.password === password
      if (!ok) return false
      const sessionUser: SessionUser = { username: u.username, role: u.role }
      persistSession(sessionUser)
      set({ isAuthed: true, user: sessionUser, users })
      return true
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        persistSession(null)
      }
      set({ isAuthed: false, user: null })
    },
    addUser: (user) => {
      const username = user.username.trim()
      if (!username) return { ok: false, error: '账号不能为空' }
      if (username.length > 64) return { ok: false, error: '账号过长' }
      if (!user.password) return { ok: false, error: '密码不能为空' }
      if (user.password.length > 128) return { ok: false, error: '密码过长' }

      const users = ensureBootstrapUsers(loadUsers())
      if (users.some((u) => u.username === username)) return { ok: false, error: '账号已存在' }

      const next: UserRecord[] = users.concat({
        username,
        password: user.password,
        role: user.role,
        createdAt: Date.now(),
      })
      persistUsers(next)
      set({ users: next })
      return { ok: true }
    },
    updateUser: (username, patch) => {
      const users = ensureBootstrapUsers(loadUsers())
      const idx = users.findIndex((u) => u.username === username)
      if (idx < 0) return { ok: false, error: '账号不存在' }
      const prev = users[idx]!

      const nextRole = patch.role ?? prev.role
      if (nextRole !== 'admin' && nextRole !== 'user') return { ok: false, error: '角色不合法' }

      if (patch.password != null) {
        if (!patch.password) return { ok: false, error: '密码不能为空' }
        if (patch.password.length > 128) return { ok: false, error: '密码过长' }
      }

      const nextUsers = users.slice()
      nextUsers[idx] = { ...prev, ...patch, role: nextRole }

      const adminCount = nextUsers.filter((u) => u.role === 'admin').length
      if (adminCount <= 0) return { ok: false, error: '至少需要 1 个管理员' }

      persistUsers(nextUsers)

      const session = loadSession()
      if (session && session.username === username && session.role !== nextRole) {
        const nextSession = { username: session.username, role: nextRole }
        persistSession(nextSession)
        set({ users: nextUsers, user: nextSession })
        return { ok: true }
      }

      set({ users: nextUsers })
      return { ok: true }
    },
    removeUser: (username) => {
      const users = ensureBootstrapUsers(loadUsers())
      const u = users.find((x) => x.username === username)
      if (!u) return { ok: false, error: '账号不存在' }

      const session = get().user
      if (session && session.username === username) return { ok: false, error: '不能删除当前登录账号' }

      const nextUsers = users.filter((x) => x.username !== username)
      const adminCount = nextUsers.filter((x) => x.role === 'admin').length
      if (adminCount <= 0) return { ok: false, error: '至少需要 1 个管理员' }

      persistUsers(nextUsers)
      set({ users: nextUsers })
      return { ok: true }
    },
  }
})
