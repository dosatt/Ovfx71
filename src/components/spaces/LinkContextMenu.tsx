import { useRef, useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input
} from '@heroui/react';
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
      <div
        ref={menuRef}
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 10000
        }}
        className="fixed bg-white shadow-lg rounded-lg border border-divider min-w-[180px] overflow-hidden"
        onMouseDown={(e) => {
          // Previeni che il click sul menu chiuda il menu stesso
          e.stopPropagation();
        }}
      >
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setRenameValue(linkText);
            setShowRenameDialog(true);
            // Non chiudere il menu qui - il dialog chiuderà il menu quando necessario
          }}
          className="p-3 cursor-pointer flex items-center gap-3 hover:bg-default-100 transition-colors"
        >
          <Edit2 size={16} />
          <span className="text-small">Rename link</span>
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onShowRelinkMenu) {
              onShowRelinkMenu();
            } else {
              setShowRelinkMenu(true);
            }
            onClose();
          }}
          className="p-3 cursor-pointer flex items-center gap-3 hover:bg-default-100 transition-colors"
        >
          <Link2 size={16} />
          <span className="text-small">Relink to space</span>
        </div>
      </div>

      {/* Rename Dialog */}
      <Modal
        isOpen={showRenameDialog}
        onClose={() => {
          setShowRenameDialog(false);
          onClose();
        }}
        className="z-[10001]"
      >
        <ModalContent>
          {(onCloseModal) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Rename link</ModalHeader>
              <ModalBody>
                <Input
                  value={renameValue}
                  onValueChange={setRenameValue}
                  placeholder="Enter new name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename();
                    } else if (e.key === 'Escape') {
                      setShowRenameDialog(false);
                      onCloseModal();
                    }
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={() => {
                  setShowRenameDialog(false);
                  onCloseModal();
                }}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleRename} isDisabled={!renameValue || renameValue === linkText}>
                  Rename
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Relink menu is handled by parent component */}
      {showRelinkMenu && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={() => setShowRelinkMenu(false)}
        />
      )}
    </>
  );
}
