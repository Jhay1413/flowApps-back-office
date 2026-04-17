import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/api/admin.api', () => ({
  getOrganizations: vi.fn().mockResolvedValue({ data: { data: [], total: 0, totalPages: 1 } }),
}));

import { OrganizationsPage } from './OrganizationsPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('OrganizationsPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<OrganizationsPage />, { wrapper });
    expect(container).toBeTruthy();
  });

  it('renders the page heading', () => {
    render(<OrganizationsPage />, { wrapper });
    expect(screen.getByText(/organizations/i)).toBeInTheDocument();
  });
});
