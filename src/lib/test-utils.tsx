import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}))

// Mock @supabase/auth-helpers-nextjs
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}))

// Mock tRPC client
export const mockTrpc = {
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, error: null }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isLoading: false }),
}

vi.mock('@/lib/trpc', () => ({
  trpc: new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => mockTrpc.useQuery,
    }),
  }),
}))

// Provider 包裝器
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// 重新匯出所有 testing-library 方法
export * from '@testing-library/react'
export { customRender as render }
