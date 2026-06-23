import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
} from '../api/userService';
import { User } from '../types/user';

interface UpdateUserData {
  user: Partial<User>;
}

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: getUsers,
  });
};

export const useUser = () => {
  return useQuery<User, Error>({
    queryKey: ['user'],
    queryFn: () => getUserById(),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateUserData>({
    mutationFn: (data: UpdateUserData) => updateUser(data.user),
    onSuccess: (updatedUser) => {
      // Update the 'user' query cache directly with the response
      queryClient.setQueryData(['user'], updatedUser);
      // Also invalidate to trigger refetch if needed
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      console.error('Error updating user', error);
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => deactivateUser(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      console.error('Error deactivating user', error);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => deleteUser(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      console.error('Error deleting user', error);
    },
  });
};
