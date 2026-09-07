import { describe, it, expect, vi } from 'vitest';
import client from './client';
import { updateNotifications } from './dashboardApi';

vi.mock('./client', () => ({
  default: {
    patch: vi.fn(),
  },
}));

describe('dashboardApi - updateNotifications', () => {
  it('sends PATCH request to /restaurants/me/notifications with provided preferences', async () => {
    (client.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { message: 'Notification preferences updated successfully' },
    });

    const payload = {
      emailAlerts: true,
      browserNotifications: true,
      orderSound: true,
    };

    const response = await updateNotifications(payload);

    expect(client.patch).toHaveBeenCalledWith('/restaurants/me/notifications', payload);
    expect(response).toBe('Notification preferences updated successfully');
  });
});
