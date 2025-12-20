import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Button from '@mui/joy@5.0.0-beta.48/Button';
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
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ minWidth: 400 }}>
        <Typography level="h4" sx={{ mb: 2 }}>
          Create New Space
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {spaceTypes.map(({ type, title, icon: Icon, description }) => (
            <Button
              key={type}
              variant="outlined"
              onClick={() => onCreate(type)}
              sx={{
                justifyContent: 'flex-start',
                p: 2,
                height: 'auto'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Icon size={24} />
                <Box sx={{ textAlign: 'left', flex: 1 }}>
                  <Typography level="title-md">{title}</Typography>
                  <Typography level="body-sm">{description}</Typography>
                </Box>
              </Box>
            </Button>
          ))}
        </Box>
      </ModalDialog>
    </Modal>
  );
}