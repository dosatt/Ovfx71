import { useRef, useEffect, useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import Modal from '@mui/joy@5.0.0-beta.48/Modal';
import ModalDialog from '@mui/joy@5.0.0-beta.48/ModalDialog';
import ModalClose from '@mui/joy@5.0.0-beta.48/ModalClose';
import Stack from '@mui/joy@5.0.0-beta.48/Stack';
import { Edit2, Link2 } from 'lucide-react';

interface LinkContextMenuProps {
  linkId: string;
  linkText: string;
  position: { x: number; y: number };
  spacesState: any;
  onRename: (newTitle: string) => void;
  onRelink: (newSpaceId: string) => void;
  onClose: () => void;
  onShowRelinkMenu?: () => void;
}

export function LinkContextMenu({
  linkId,
  linkText,
  position,
  spacesState,
  onRename,
  onRelink,
  onClose,
  onShowRelinkMenu
}: LinkContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showRelinkMenu, setShowRelinkMenu] = useState(false);
  const [renameValue, setRenameValue] = useState(linkText);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Usa capture phase per intercettare l'evento prima che arrivi al contentEditable
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  const handleRename = () => {
    if (renameValue && renameValue !== linkText) {
      onRename(renameValue);
    }
    setShowRenameDialog(false);
    onClose();
  };

  return (
    <>
      <Box
        ref={menuRef}
        sx={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          bgcolor: 'background.popup',
          boxShadow: 'lg',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'divider',
          zIndex: 10000,
          minWidth: 180,
          overflow: 'hidden',
        }}
        onMouseDown={(e) => {
          // Previeni che il click sul menu chiuda il menu stesso
          e.stopPropagation();
        }}
      >
        <Box
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setRenameValue(linkText);
            setShowRenameDialog(true);
            // Non chiudere il menu qui - il dialog chiuderà il menu quando necessario
          }}
          sx={{
            p: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:hover': {
              bgcolor: 'background.level1'
            },
            transition: 'background-color 0.15s'
          }}
        >
          <Edit2 size={16} />
          <Typography level="body-sm">Rename link</Typography>
        </Box>

        <Box
          onClick={(e) => {
            e.stopPropagation();
            if (onShowRelinkMenu) {
              onShowRelinkMenu();
            } else {
              setShowRelinkMenu(true);
            }
            onClose();
          }}
          sx={{
            p: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:hover': {
              bgcolor: 'background.level1'
            },
            transition: 'background-color 0.15s'
          }}
        >
          <Link2 size={16} />
          <Typography level="body-sm">Relink to space</Typography>
        </Box>
      </Box>

      {/* Rename Dialog */}
      <Modal
        open={showRenameDialog}
        onClose={() => {
          setShowRenameDialog(false);
          onClose();
        }}
        sx={{
          zIndex: 10001, // Sopra il menu contestuale che è a 10000
        }}
      >
        <ModalDialog
          sx={{
            maxWidth: 400,
            borderRadius: '12px',
            p: 3,
          }}
        >
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            Rename link
          </Typography>
          <Stack spacing={2}>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setShowRenameDialog(false);
                  onClose();
                }
              }}
            />
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Button
                variant="plain"
                color="neutral"
                onClick={() => {
                  setShowRenameDialog(false);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={!renameValue || renameValue === linkText}
              >
                Rename
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Relink menu is handled by parent component */}
      {showRelinkMenu && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9997,
          }}
          onClick={() => setShowRelinkMenu(false)}
        />
      )}
    </>
  );
}