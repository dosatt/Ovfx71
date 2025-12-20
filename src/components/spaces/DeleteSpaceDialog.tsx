import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import DialogTitle from '@mui/joy@5.0.0-beta.48/DialogTitle';
import DialogContent from '@mui/joy@5.0.0-beta.48/DialogContent';
import DialogActions from '@mui/joy@5.0.0-beta.48/DialogActions';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import { AlertTriangle } from 'lucide-react';
import Box from '@mui/joy@5.0.0-beta.48/Box';

interface DeleteSpaceDialogProps {
  open: boolean;
  spaceId: string;
  linkedPagesCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteSpaceDialog({
  open,
  spaceId,
  linkedPagesCount,
  onConfirm,
  onClose
}: DeleteSpaceDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        role="alertdialog"
        sx={{
          maxWidth: 500,
          borderRadius: '12px',
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AlertTriangle size={24} color="#d32f2f" />
            Delete "{spaceId}"?
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography level="body-md" sx={{ mb: 2 }}>
            This space is linked from {linkedPagesCount} {linkedPagesCount === 1 ? 'page' : 'pages'}.
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            If you proceed, these links will become broken. You'll be able to reconnect them by clicking the broken link icon.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="solid"
            color="danger"
            onClick={onConfirm}
          >
            Delete anyway
          </Button>
          <Button
            variant="plain"
            color="neutral"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
}