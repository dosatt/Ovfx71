import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@heroui/react';
import { FileText, LayoutDashboard, Database, Pencil } from 'lucide-react';
import { SpaceType } from '../types';

interface NewSpaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (type: SpaceType) => void;
}

const spaceTypes = [
  { type: 'page' as SpaceType, title: 'Page', icon: FileText, description: 'Document with blocks' },
  { type: 'canvas' as SpaceType, title: 'Canvas', icon: Pencil, description: 'Drawing board' },
  { type: 'database' as SpaceType, title: 'Database', icon: Database, description: 'Structured data' },
  { type: 'dashboard' as SpaceType, title: 'Dashboard', icon: LayoutDashboard, description: 'Modular view' }
];

export function NewSpaceModal({ open, onClose, onCreate }: NewSpaceModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Create New Space
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="flex flex-col gap-2">
            {spaceTypes.map(({ type, title, icon: Icon, description }) => (
              <Button
                key={type}
                variant="bordered"
                onPress={() => onCreate(type)}
                className="h-auto py-3 px-4 flex justify-start items-center gap-4"
              >
                <Icon size={24} className="text-default-500" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-medium">{title}</span>
                  <span className="text-small text-default-400 font-normal">{description}</span>
                </div>
              </Button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
