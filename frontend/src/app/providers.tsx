'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

function AuthInitializer() {
  useEffect(() => {
    // Initialize auth on app load
    useAuthStore.getState().initialize()
  }, [])
  
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  )
}
