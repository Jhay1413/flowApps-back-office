import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/api/admin.api', () => ({
  getUsers: vi.fn().mockResolvedValue({ data: { data: [], total: 0, totalPages: 1 } }),
}));

import { UsersPage } from './UsersPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('UsersPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<UsersPage />, { wrapper });
    expect(container).toBeTruthy();
  });

  it('renders the Users heading', () => {
    render(<UsersPage />, { wrapper });
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
