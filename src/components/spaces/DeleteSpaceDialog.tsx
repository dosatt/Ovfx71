import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

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
    <Modal isOpen={open} onClose={onClose} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-2 items-center text-danger">
              <AlertTriangle size={24} />
              Delete "{spaceId}"?
            </ModalHeader>
            <ModalBody>
              <p className="text-medium">
                This space is linked from {linkedPagesCount} {linkedPagesCount === 1 ? 'page' : 'pages'}.
              </p>
              <p className="text-small text-default-500">
                If you proceed, these links will become broken. You'll be able to reconnect them by clicking the broken link icon.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={onConfirm}
              >
                Delete anyway
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
