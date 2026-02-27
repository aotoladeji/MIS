import { useState } from 'react';

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    placeholder: '',
    fields: [],
    onConfirm: () => {}
  });

  const showDialog = (config) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: config.title || 'Confirm',
        message: config.message || '',
        type: config.type || 'confirm',
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        placeholder: config.placeholder || '',
        fields: config.fields || [],
        onConfirm: (value) => {
          resolve(value);
          closeDialog();
        }
      });
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    dialogState,
    showDialog,
    closeDialog
  };
}
