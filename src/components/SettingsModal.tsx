import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Switch,
  RadioGroup,
  Radio,
  Input,
  Slider,
  Tabs,
  Tab
} from '@heroui/react';
import { DebugTreeView } from './DebugTreeView';
import type { Settings } from '../hooks/useSettings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onResetSettings: () => void;
  spacesState?: any;
  viewportsState?: any;
}

const PRESET_GRADIENTS = [
  { name: 'Ocean Blue', start: '#667eea', end: '#764ba2', angle: 135 },
  { name: 'Sunset', start: '#ff6b6b', end: '#feca57', angle: 135 },
  { name: 'Forest', start: '#11998e', end: '#38ef7d', angle: 135 },
  { name: 'Lavender', start: '#a8caba', end: '#5d4e6d', angle: 135 },
  { name: 'Gray', start: '#f5f7fa', end: '#e8ecf1', angle: 135 },
  { name: 'Purple', start: '#6a11cb', end: '#2575fc', angle: 135 }
];

const PRESET_COLORS = [
  '#ffffff', '#f5f7fa', '#e8ecf1', '#d1d5db',
  '#667eea', '#764ba2', '#ff6b6b', '#feca57',
  '#11998e', '#38ef7d', '#a8caba', '#5d4e6d'
];

export function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  spacesState,
  viewportsState
}: SettingsModalProps) {
  const [debugView, setDebugView] = useState<'json' | 'tree'>('json');

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      scrollBehavior="inside"
      size="2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Impostazioni</ModalHeader>
        <ModalBody>
          <Tabs aria-label="Settings Options">
            <Tab key="appearance" title="Aspetto">
              <div className="flex flex-col gap-6 py-4">
                {/* Sidebar Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-primary font-semibold text-small uppercase tracking-wider">Sidebar</h3>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-small font-medium">Trasparenza</p>
                      <p className="text-tiny text-default-400">Rende la sidebar semi-trasparente</p>
                    </div>
                    <Switch
                      isSelected={settings.transparency}
                      onValueChange={(isSelected) => onUpdateSettings({ transparency: isSelected })}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-small font-medium">Effetto Sfocatura</p>
                      <p className="text-tiny text-default-400">Applica un effetto blur alla sidebar</p>
                    </div>
                    <Switch
                      isSelected={settings.blur}
                      onValueChange={(isSelected) => onUpdateSettings({ blur: isSelected })}
                    />
                  </div>
                </div>

                {/* Viewport Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-primary font-semibold text-small uppercase tracking-wider">Viewport</h3>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-small font-medium">Trasparenza Viewport</p>
                      <p className="text-tiny text-default-400">Rende i viewport semi-trasparenti</p>
                    </div>
                    <Switch
                      isSelected={settings.viewportTransparency}
                      onValueChange={(isSelected) => onUpdateSettings({ viewportTransparency: isSelected })}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-small font-medium">Effetto Sfocatura Viewport</p>
                      <p className="text-tiny text-default-400">Applica un effetto blur ai viewport</p>
                    </div>
                    <Switch
                      isSelected={settings.viewportBlur}
                      onValueChange={(isSelected) => onUpdateSettings({ viewportBlur: isSelected })}
                    />
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="ui" title="UI">
              <div className="flex flex-col gap-6 py-4">
                {/* UI Elements Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-primary font-semibold text-small uppercase tracking-wider">Elementi UI</h3>
                  
                  {/* Button Border Radius */}
                  <div className="flex flex-col gap-2">
                    <p className="text-small font-medium">Arrotondamento Pulsante "Nuovo"</p>
                    <p className="text-tiny text-default-400 mb-2">Controlla quanto sono arrotondati gli angoli del pulsante</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={settings.buttonBorderRadius === '4px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ buttonBorderRadius: '4px' })}
                        className="flex-1"
                      >
                        Quadrato
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.buttonBorderRadius === '8px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ buttonBorderRadius: '8px' })}
                        className="flex-1"
                      >
                        Medio
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.buttonBorderRadius === '999px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ buttonBorderRadius: '999px' })}
                        className="flex-1"
                      >
                        Pillola
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 p-4 bg-default-100 rounded-medium">
                      <p className="text-small">Anteprima:</p>
                      <Button
                        size="sm"
                        color="primary"
                        style={{ borderRadius: settings.buttonBorderRadius }}
                      >
                        Nuovo
                      </Button>
                    </div>
                  </div>

                  {/* Tab Border Radius */}
                  <div className="flex flex-col gap-2">
                    <p className="text-small font-medium">Arrotondamento Tabs Viewport</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={settings.tabBorderRadius === '4px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ tabBorderRadius: '4px' })}
                        className="flex-1"
                      >
                        Quadrato
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.tabBorderRadius === '8px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ tabBorderRadius: '8px' })}
                        className="flex-1"
                      >
                        Medio
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.tabBorderRadius === '999px' ? 'solid' : 'bordered'}
                        onPress={() => onUpdateSettings({ tabBorderRadius: '999px' })}
                        className="flex-1"
                      >
                        Pillola
                      </Button>
                    </div>
                  </div>
                  
                  {/* Preview Border Radius */}
                  <div className="flex flex-col gap-2">
                    <p className="text-small font-medium">Arrotondamento Anteprime Space</p>
                    <div className="flex gap-2">
                      {['4px', '8px', '12px', '16px'].map((radius) => (
                        <Button
                          key={radius}
                          size="sm"
                          variant={settings.previewBorderRadius === radius ? 'solid' : 'bordered'}
                          onPress={() => onUpdateSettings({ previewBorderRadius: radius })}
                          className="flex-1"
                        >
                          {radius === '4px' ? 'Quadrato' : radius === '8px' ? 'Piccolo' : radius === '12px' ? 'Medio' : 'Grande'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Padding Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-primary font-semibold text-small uppercase tracking-wider">Padding Pulsante "Nuovo"</h3>
                  
                  {[
                    { label: 'Superiore', key: 'buttonPaddingTop' as const, max: 3 },
                    { label: 'Inferiore', key: 'buttonPaddingBottom' as const, max: 3 },
                    { label: 'Sinistro', key: 'buttonPaddingLeft' as const, max: 5 },
                    { label: 'Destro', key: 'buttonPaddingRight' as const, max: 5 },
                  ].map((item) => (
                    <div key={item.key} className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <p className="text-small font-medium">Padding {item.label}</p>
                        <p className="text-tiny text-default-400">{settings[item.key].toFixed(2)}</p>
                      </div>
                      <Slider
                        size="sm"
                        step={0.125}
                        maxValue={item.max}
                        minValue={0}
                        value={settings[item.key]}
                        onChange={(value) => onUpdateSettings({ [item.key]: value as number })}
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-2 p-4 bg-default-100 rounded-medium">
                    <p className="text-small">Anteprima Pulsante:</p>
                    <Button
                      size="sm"
                      color="primary"
                      style={{ 
                        borderRadius: settings.buttonBorderRadius,
                        paddingTop: `${settings.buttonPaddingTop * 0.25}rem`,
                        paddingBottom: `${settings.buttonPaddingBottom * 0.25}rem`,
                        paddingLeft: `${settings.buttonPaddingLeft * 0.25}rem`,
                        paddingRight: `${settings.buttonPaddingRight * 0.25}rem`
                      }}
                    >
                      Nuovo
                    </Button>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="background" title="Sfondo">
              <div className="flex flex-col gap-6 py-4">
                <RadioGroup
                  label="Tipo di Sfondo"
                  value={settings.backgroundType}
                  onValueChange={(value) => onUpdateSettings({ backgroundType: value as 'solid' | 'gradient' })}
                >
                  <Radio value="solid">Colore Solido</Radio>
                  <Radio value="gradient">Gradiente</Radio>
                </RadioGroup>

                {settings.backgroundType === 'solid' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-small font-medium">Colore</p>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                        className="w-20"
                        classNames={{ input: "h-10 p-1" }}
                      />
                      <Input
                        value={settings.backgroundColor}
                        onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    
                    <p className="text-tiny text-default-400">Preset:</p>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COLORS.map(color => (
                        <div
                          key={color}
                          onClick={() => onUpdateSettings({ backgroundColor: color })}
                          className={`
                            w-full aspect-square rounded-md border-2 cursor-pointer transition-transform hover:scale-110
                            ${settings.backgroundColor === color ? 'border-primary' : 'border-divider'}
                          `}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {settings.backgroundType === 'gradient' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-small font-medium">Colore Iniziale</p>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.gradientStart}
                          onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                          className="w-20"
                          classNames={{ input: "h-10 p-1" }}
                        />
                        <Input
                          value={settings.gradientStart}
                          onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-small font-medium">Colore Finale</p>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.gradientEnd}
                          onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                          className="w-20"
                          classNames={{ input: "h-10 p-1" }}
                        />
                        <Input
                          value={settings.gradientEnd}
                          onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-small font-medium">Angolo: {settings.gradientAngle}°</p>
                      <Slider
                        size="sm"
                        step={15}
                        maxValue={360}
                        minValue={0}
                        value={settings.gradientAngle}
                        onChange={(value) => onUpdateSettings({ gradientAngle: value as number })}
                      />
                    </div>

                    <p className="text-tiny text-default-400">Preset Gradienti:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_GRADIENTS.map(preset => (
                        <div
                          key={preset.name}
                          onClick={() => onUpdateSettings({
                            gradientStart: preset.start,
                            gradientEnd: preset.end,
                            gradientAngle: preset.angle
                          })}
                          className={`
                            p-3 rounded-md border-2 cursor-pointer flex justify-between items-center
                            ${settings.gradientStart === preset.start && settings.gradientEnd === preset.end ? 'border-primary' : 'border-divider'}
                          `}
                        >
                          <span className="text-small">{preset.name}</span>
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ background: `linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="debug" title="Debug">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={debugView === 'json' ? 'solid' : 'bordered'}
                    onPress={() => setDebugView('json')}
                    className="flex-1"
                  >
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    variant={debugView === 'tree' ? 'solid' : 'bordered'}
                    onPress={() => setDebugView('tree')}
                    className="flex-1"
                  >
                    Tree
                  </Button>
                </div>
                
                <div className="h-[400px] overflow-auto border border-divider rounded-md p-4 bg-default-50">
                  {debugView === 'json' ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify({ spaces: spacesState?.spaces, viewports: viewportsState?.rootViewport }, null, 2)}
                    </pre>
                  ) : (
                    <DebugTreeView spaces={spacesState?.spaces || []} viewports={viewportsState?.rootViewport} />
                  )}
                </div>
                
                <Button color="danger" onPress={onResetSettings}>
                  Reset Impostazioni
                </Button>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
