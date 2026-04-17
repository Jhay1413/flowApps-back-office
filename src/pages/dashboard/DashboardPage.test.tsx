import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/admin.api', () => ({
  getStats: vi.fn().mockResolvedValue({
    data: {
      data: {
        totalOrganizations: 12,
        totalUsers: 48,
        activeSubscriptions: 8,
        trialingSubscriptions: 4,
        mrr: 15000,
        arr: 180000,
        newOrgsThisMonth: 3,
        newUsersThisMonth: 10,
      },
    },
  }),
  getRevenue: vi.fn().mockResolvedValue({ data: { data: { monthly: [], tierBreakdown: [] } } }),
}));

import { DashboardPage } from './DashboardPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardPage />, { wrapper });
    expect(container).toBeTruthy();
  });

  it('renders the Dashboard heading', () => {
    render(<DashboardPage />, { wrapper });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders stat card titles', () => {
    render(<DashboardPage />, { wrapper });
    expect(screen.getByText(/organizations/i)).toBeInTheDocument();
    expect(screen.getByText(/users/i)).toBeInTheDocument();
  });
});
