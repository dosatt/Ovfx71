import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import {
  Search,
  FilePlus,
  Layout,
  Settings,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Command as CommandIcon,
  MousePointer,
  Square,
  Circle,
  Type,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  spacesState: any;
  viewportsState: any;
  settings: any;
  onUpdateSettings: (updates: any) => void;
}

export function CommandPalette({
  spacesState,
  viewportsState,
  settings,
  onUpdateSettings,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="pcb-grid-fine">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => spacesState.addSpace('page', 'New Page'))}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>Create New Page</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => spacesState.addSpace('canvas', 'New Canvas'))}>
            <Layout className="mr-2 h-4 w-4" />
            <span>Create New Canvas</span>
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Canvas Tools">
           <CommandItem onSelect={() => runCommand(() => {
              // This logic depends on where we are, but we can emit events or just change state
              window.dispatchEvent(new CustomEvent('ovfx-set-tool', { detail: 'select' }));
           })}>
            <MousePointer className="mr-2 h-4 w-4" />
            <span>Select Tool</span>
            <CommandShortcut>V</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
              window.dispatchEvent(new CustomEvent('ovfx-set-tool', { detail: 'rectangle' }));
           })}>
            <Square className="mr-2 h-4 w-4" />
            <span>Rectangle Tool</span>
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
              window.dispatchEvent(new CustomEvent('ovfx-set-tool', { detail: 'circle' }));
           })}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Circle Tool</span>
            <CommandShortcut>O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
              window.dispatchEvent(new CustomEvent('ovfx-set-tool', { detail: 'arrow' }));
           })}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Arrow (PCB Trace) Tool</span>
            <CommandShortcut>A</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => onUpdateSettings({ theme: 'light' }))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onUpdateSettings({ theme: 'dark' }))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onUpdateSettings({ backgroundType: settings.backgroundType === 'gradient' ? 'solid' : 'gradient' }))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>Toggle Background Style</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Spaces">
          {spacesState.spaces.slice(0, 5).map((space: any) => (
            <CommandItem 
              key={space.id} 
              onSelect={() => runCommand(() => {
                if (viewportsState.focusedViewportId) {
                  const viewport = viewportsState.findViewport(viewportsState.focusedViewportId);
                  if (viewport && viewport.activeTabId) {
                    viewportsState.updateTab(viewport.id, viewport.activeTabId, { spaceId: space.id });
                  }
                }
              })}
            >
              <div className="mr-2">{space.icon || (space.type === 'page' ? '📄' : '🎨')}</div>
              <span>Open: {space.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
