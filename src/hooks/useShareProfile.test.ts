import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareProfile } from '@/hooks/useShareProfile';

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useShareProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://sipmunchyap.lovable.app/restaurant/test-spot' },
      writable: true,
    });
  });

  it('buildShareUrl appends UTM parameters', () => {
    const { result } = renderHook(() =>
      useShareProfile({ merchantName: 'Test Spot' })
    );

    const url = result.current.buildShareUrl();
    const parsed = new URL(url);

    expect(parsed.searchParams.get('utm_source')).toBe('share');
    expect(parsed.searchParams.get('utm_medium')).toBe('profile');
    expect(parsed.pathname).toBe('/restaurant/test-spot');
  });

  it('buildShareUrl uses custom UTM params when provided', () => {
    const { result } = renderHook(() =>
      useShareProfile({
        merchantName: 'Test Spot',
        utmSource: 'widget',
        utmMedium: 'embed',
      })
    );

    const url = result.current.buildShareUrl();
    const parsed = new URL(url);

    expect(parsed.searchParams.get('utm_source')).toBe('widget');
    expect(parsed.searchParams.get('utm_medium')).toBe('embed');
  });

  it('handleShare falls back to clipboard when navigator.share is unavailable', async () => {
    // Ensure no native share
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true });

    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
    });

    const { result } = renderHook(() =>
      useShareProfile({ merchantName: 'Test Spot' })
    );

    await act(async () => {
      await result.current.handleShare();
    });

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedUrl = writeTextMock.mock.calls[0][0];
    expect(copiedUrl).toContain('utm_source=share');
    expect(copiedUrl).toContain('utm_medium=profile');

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Link copied!' })
    );
  });

  it('handleShare uses navigator.share when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareMock, writable: true });

    const { result } = renderHook(() =>
      useShareProfile({ merchantName: 'Test Spot' })
    );

    await act(async () => {
      await result.current.handleShare();
    });

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Test Spot'),
        url: expect.stringContaining('utm_source=share'),
      })
    );
    // No toast when native share succeeds
    expect(mockToast).not.toHaveBeenCalled();
  });
});
