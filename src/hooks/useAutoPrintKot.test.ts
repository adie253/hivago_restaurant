import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAutoPrintKot } from './useAutoPrintKot';
import { useKotPrint } from './usePrintDoc';

// Mock usePrintDoc
vi.mock('./usePrintDoc', () => {
  const mockPrint = vi.fn();
  return {
    useKotPrint: vi.fn(() => ({
      ref: { current: null },
      data: null,
      print: mockPrint,
    })),
  };
});

describe('useAutoPrintKot Hook', () => {
  let mockPrint: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrint = vi.mocked(useKotPrint)().print;
  });

  it('prints when enabled and printOnAccept is called', () => {
    const { result } = renderHook(() => useAutoPrintKot(true));
    
    act(() => {
      result.current.printOnAccept('order-1');
    });

    expect(mockPrint).toHaveBeenCalledWith('order-1');
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });

  it('does not print when disabled', () => {
    const { result } = renderHook(() => useAutoPrintKot(false));
    
    act(() => {
      result.current.printOnAccept('order-1');
    });

    expect(mockPrint).not.toHaveBeenCalled();
  });

  it('deduplicates multiple accept calls for the same order', () => {
    const { result } = renderHook(() => useAutoPrintKot(true));

    act(() => {
      result.current.printOnAccept('order-1');
    });
    act(() => {
      result.current.printOnAccept('order-1');
    });

    expect(mockPrint).toHaveBeenCalledTimes(1);
  });
});
