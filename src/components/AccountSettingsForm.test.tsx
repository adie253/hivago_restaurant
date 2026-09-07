import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccountSettingsForm from './AccountSettingsForm';
import { NotificationSettings } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'restaurant' },
  }),
}));

vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({
    requestBrowserPermission: vi.fn(),
  }),
}));

vi.mock('../hooks/useChangePassword', () => ({
  useChangePassword: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('AccountSettingsForm', () => {
  const initialNotifications: NotificationSettings = {
    emailAlerts: true,
    browserNotifications: true,
    orderSound: true,
  };

  it('renders all notification preference toggles', () => {
    render(
      <AccountSettingsForm
        notifications={initialNotifications}
        onSaveNotifications={async () => {}}
      />
    );

    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Email Alerts')).toBeInTheDocument();
    expect(screen.getByText('Order Sound')).toBeInTheDocument();
    expect(screen.getByText('Browser Notifications')).toBeInTheDocument();
  });

  it('calls onSaveNotifications with updated settings when toggles are changed and submitted', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountSettingsForm
        notifications={initialNotifications}
        onSaveNotifications={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save notification preferences/i });
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith({
      emailAlerts: true,
      browserNotifications: true,
      orderSound: true,
    });
  });
});
