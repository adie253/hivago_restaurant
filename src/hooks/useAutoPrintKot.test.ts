import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAutoPrintKot } from './useAutoPrintKot';
import { useKotPrint } from './usePrintDoc';
import { signalRService } from '../api/signalrService';

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

// Mock signalrService
vi.mock('../api/signalrService', () => {
  return {
    signalRService: {
      onNewOrder: vi.fn(),
    },
  };
});

describe('useAutoPrintKot Hook', () => {
  let mockPrint: any;
  let mockOnNewOrder: any;
  let mockUnsubscribe: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrint = vi.mocked(useKotPrint)().print;
    mockUnsubscribe = vi.fn();
    mockOnNewOrder = vi.mocked(signalRService.onNewOrder).mockReturnValue(mockUnsubscribe);
  });

  it('subscribes to onNewOrder when enabled', () => {
    renderHook(() => useAutoPrintKot(true));

    expect(signalRService.onNewOrder).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useAutoPrintKot(false));

    expect(signalRService.onNewOrder).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAutoPrintKot(true));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('calls print and dedupes repeated order IDs', () => {
    let orderCallback: any = null;
    vi.mocked(signalRService.onNewOrder).mockImplementation((cb) => {
      orderCallback = cb;
      return mockUnsubscribe;
    });

    renderHook(() => useAutoPrintKot(true));

    expect(orderCallback).toBeDefined();

    // Trigger first order
    orderCallback({ orderId: 'order-1' });
    expect(mockPrint).toHaveBeenCalledWith('order-1');
    expect(mockPrint).toHaveBeenCalledTimes(1);

    // Trigger duplicate order
    orderCallback({ orderId: 'order-1' });
    expect(mockPrint).toHaveBeenCalledTimes(1); // Still 1, deduped

    // Trigger new order
    orderCallback({ orderId: 'order-2' });
    expect(mockPrint).toHaveBeenLastCalledWith('order-2');
    expect(mockPrint).toHaveBeenCalledTimes(2);
  });
});
