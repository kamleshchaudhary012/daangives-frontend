import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AvatarImage from '../../components/common/AvatarImage';
import Header from '../../components/common/Header';
import HomePage from '../../pages/public/HomePage';
import NgoDirectoryPage from '../../pages/public/NgoDirectoryPage';
import NgoLayout from '../../layouts/NgoLayout';
import CompanyLayout from '../../layouts/CompanyLayout';
import AdminLayout from '../../layouts/AdminLayout';
import * as api from '../../services/api';

describe('DaanGives — Public NGO Logo Rendering and Public Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. AvatarImage renders valid logo URL with object-fit contain', () => {
    const validUrl = 'http://localhost:8000/media/ngo_logos/test-ngo/logo.jpg';
    render(
      <AvatarImage
        src={validUrl}
        name="Trust seva"
        size="lg"
        shape="rounded"
        objectFit="contain"
      />
    );

    const img = screen.getByRole('img', { name: /Trust seva/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', validUrl);
    expect(img.className).toContain('object-contain');
    expect(img.className).toContain('bg-white');
  });

  it('2. AvatarImage handles NGO with no logo with clean initials fallback', () => {
    render(
      <AvatarImage
        src={null}
        name="Trust seva"
        size="lg"
        shape="rounded"
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('TS');
  });

  it('3. AvatarImage handles inaccessible or missing image file via onError fallback', () => {
    render(
      <AvatarImage
        src="http://localhost:8000/media/ngo_logos/missing.jpg"
        name="Trust seva"
        size="lg"
        shape="rounded"
      />
    );

    const img = screen.getByRole('img', { name: /Trust seva/i });
    expect(img).toBeInTheDocument();

    // Trigger image load failure
    fireEvent.error(img);

    // Should transition cleanly to fallback initials without broken icon
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('TS');
  });

  it('4. getMediaUrl helper correctly resolves relative, absolute, data, and blob URLs', () => {
    expect(api.getMediaUrl('http://localhost:8000/media/ngo.jpg')).toBe('http://localhost:8000/media/ngo.jpg');
    expect(api.getMediaUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
    expect(api.getMediaUrl('blob:http://localhost:5173/uuid')).toBe('blob:http://localhost:5173/uuid');
    expect(api.getMediaUrl('data:image/png;base64,1234')).toBe('data:image/png;base64,1234');
    
    // Relative media path should be prepended with host
    const resolvedRelative = api.getMediaUrl('/media/ngo_logos/123/logo.jpg');
    expect(resolvedRelative).toContain('/media/ngo_logos/123/logo.jpg');
    expect(resolvedRelative.startsWith('http://localhost:8000')).toBe(true);

    // Empty / null should return null
    expect(api.getMediaUrl(null)).toBeNull();
    expect(api.getMediaUrl('')).toBeNull();
    expect(api.getMediaUrl('   ')).toBeNull();
  });

  it('5. Public Navigation displays refined items: Home, Browse Projects, Village Directory, For Companies', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse Projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Village Directory/i })).toBeInTheDocument();
    
    // Confirms "For Companies" is present and points to /csr
    const forCompaniesLinks = screen.getAllByRole('link', { name: /For Companies/i });
    expect(forCompaniesLinks.length).toBeGreaterThanOrEqual(1);
    expect(forCompaniesLinks[0]).toHaveAttribute('href', '/csr');

    // Unauthenticated navigation includes Log In & Register
    expect(screen.getByRole('link', { name: /Log In/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
  });

  it('6. HomePage renders verified NGO cards with AvatarImage and restrained trust claims', async () => {
    vi.spyOn(api, 'getPublicNgos').mockResolvedValueOnce({
      results: [
        {
          id: 'e5bccfb2-60e0-4d42-8c70-b830924d1267',
          display_name: 'Trust seva',
          legal_name: 'KAmlesh Trust seva',
          slug: 'trust-seva',
          city: 'Surat',
          district: 'ahemdabad',
          state: 'Gujarat',
          darpan_id: 'gj/08/2004',
          logo: 'http://localhost:8000/media/ngo_logos/e5bccfb2-60e0-4d42-8c70-b830924d1267/3adb6816-a3c8-4346-973d-3569f8bad7d3.jpg',
          description: 'Community welfare programs.',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Trust seva')).toBeInTheDocument();
    });

    // Check restrained claims (no misleading 100% Direct or Instant 80G claims)
    expect(screen.getByText(/Administrative Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Collaboration/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparent Partner Engagement/i)).toBeInTheDocument();
    expect(screen.queryByText(/100% Direct/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instant 80G Receipts/i)).not.toBeInTheDocument();

    // Check logo image rendered
    const logoImg = screen.getByRole('img', { name: /Trust seva/i });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute(
      'src',
      'http://localhost:8000/media/ngo_logos/e5bccfb2-60e0-4d42-8c70-b830924d1267/3adb6816-a3c8-4346-973d-3569f8bad7d3.jpg'
    );
  });

  it('7. Authenticated NGO workspace layout isolates from public marketing navigation', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'NGO', email: 'ngo@example.com' }));
    localStorage.setItem('accessToken', 'mock-token');

    render(
      <MemoryRouter initialEntries={['/ngo/dashboard']}>
        <NgoLayout>
          <div>NGO Workspace Content</div>
        </NgoLayout>
      </MemoryRouter>
    );

    // Workspace sidebar is present
    expect(screen.getByText('NGO Workspace Content')).toBeInTheDocument();
    expect(screen.getByText(/Village \/ Sanstha Portal/i)).toBeInTheDocument();

    // Marketing navbar links (e.g. Browse Projects, For Companies) are NOT in the workspace layout
    expect(screen.queryByRole('link', { name: /^Home$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /For Companies/i })).not.toBeInTheDocument();
  });

  it('8. Authenticated Company workspace layout isolates from public marketing navigation', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'COMPANY', email: 'csr@company.com' }));
    localStorage.setItem('accessToken', 'mock-token');

    render(
      <MemoryRouter initialEntries={['/company/dashboard']}>
        <CompanyLayout>
          <div>Company Workspace Content</div>
        </CompanyLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Company Workspace Content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Home$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /For Companies/i })).not.toBeInTheDocument();
  });

  it('9. Authenticated Admin suite isolates from public marketing navigation', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', email: 'admin@daangives.org' }));
    localStorage.setItem('accessToken', 'mock-token');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminLayout>
          <div>Admin Suite Content</div>
        </AdminLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Suite Content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Home$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /For Companies/i })).not.toBeInTheDocument();
  });
});
