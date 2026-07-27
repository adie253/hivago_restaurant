import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { AuthRole } from '../types';

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export function useChangePassword(role: AuthRole) {
  const { showToast } = useToast();
  // Strip '/api' prefix because api client's baseURL already includes it
  const path = role === 'owner' ? 'owners/me/password' : 'restaurants/me/password';
  
  return useMutation<any, ApiError, ChangePasswordPayload>({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await api.patch(path, payload);
      return response.data;
    },
    onSuccess: () => {
      showToast('Password updated.', 'success');
    },
    onError: (err: ApiError) => {
      showToast(err.message || 'Failed to update password.', 'error');
    },
  });
}
