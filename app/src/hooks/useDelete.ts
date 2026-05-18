/**
 * useDelete.ts
 * React hook that wraps deleteService for use in components.
 *
 * Usage:
 *   const { canDelete, handleDelete, isDeleting } = useDelete();
 *   await handleDelete('products', product.id, product.name, () => dispatch({ type: 'DELETE_PRODUCT', payload: product.id }));
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSecurity } from '@/components/security/SecurityProvider';
import { deleteRecord, canUserDelete } from '@/services/deleteService';

export function useDelete() {
  const { user } = useSecurity();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = canUserDelete(user);

  const handleDelete = useCallback(
    async (
      tableName: string,
      recordId: string,
      recordLabel: string,
      /** Called AFTER successful delete to update local React state via dispatch */
      onSuccess: () => void
    ) => {
      if (!user) {
        toast.error('Not authenticated.');
        return false;
      }

      if (!canDelete) {
        toast.error(
          `Access Denied: Only Administrators and QA Managers can delete records.`,
          { duration: 5000 }
        );
        return false;
      }

      setIsDeleting(true);
      try {
        const result = await deleteRecord(user, tableName as any, recordId, recordLabel);

        if (!result.success) {
          toast.error(result.error || 'Delete failed.');
          return false;
        }

        // Update local React state
        onSuccess();

        if (result.cloudDeleted) {
          toast.success(`"${recordLabel}" permanently deleted and removed from cloud.`);
        } else {
          toast.success(`"${recordLabel}" deleted locally. Cloud removal will sync shortly.`);
        }

        return true;
      } catch (err: any) {
        toast.error(`Delete error: ${err.message}`);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [user, canDelete]
  );

  return { canDelete, handleDelete, isDeleting };
}
