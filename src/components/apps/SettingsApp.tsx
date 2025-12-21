import { useState } from 'react';
import {
  Button,
  Switch,
  Input,
  Slider,
  Tabs,
  Tab,
  Card,
  CardBody,
  RadioGroup,
  Radio,
  Divider,
} from '@heroui/react';
import { 
  Monitor, 
  Palette, 
  Layout, 
  Terminal,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';
import { DebugTreeView } from '../DebugTreeView';
import type { Settings as SettingsType } from '../../hooks/useSettings';

interface SettingsAppProps {
  settings: SettingsType;
  onUpdateSettings: (updates: Partial<SettingsType>) => void;
  onResetSettings: () => void;
  spacesState?: any;
  viewportsState?: any;
}

const PRESET_GRADIENTS = [
  { name: 'Ocean', start: '#667eea', end: '#764ba2', angle: 135 },
  { name: 'Sunset', start: '#ff6b6b', end: '#feca57', angle: 135 },
  { name: 'Forest', start: '#11998e', end: '#38ef7d', angle: 135 },
  { name: 'Lavender', start: '#a8caba', end: '#5d4e6d', angle: 135 },
];

const PRESET_COLORS = [
  '#ffffff', '#f5f7fa', '#e8ecf1', 
  '#667eea', '#ff6b6b', '#11998e'
];

export function SettingsApp({
  settings,
  onUpdateSettings,
  onResetSettings,
  spacesState,
  viewportsState
}: SettingsAppProps) {
  const [debugMode, setDebugMode] = useState<'json' | 'tree'>('json');

  if (!settings) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Impostazioni</h1>
            <p className="text-default-500">
              Personalizza l'aspetto e il comportamento dell'applicazione
            </p>
          </div>

          <Tabs 
            aria-label="Opzioni Impostazioni" 
            color="primary" 
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab
              key="appearance"
              title={
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Aspetto</span>
                </div>
              }
            >
              <div className="flex flex-col gap-6 py-4">
                <section>
                  <h3 className="text-small font-semibold mb-3 text-default-500 uppercase tracking-wider">Tema Applicazione</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      isPressable 
                      onPress={() => onUpdateSettings({ theme: 'light' })}
                      className={`
                        border-2 transition-all hover:scale-[1.02]
                        ${settings.theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent bg-default-50'}
                      `}
                      shadow="sm"
                    >
                      <CardBody className="flex flex-col items-center justify-center gap-3 p-6">
                        <Sun className={`w-8 h-8 ${settings.theme === 'light' ? 'text-primary' : 'text-default-500'}`} />
                        <span className={`font-medium ${settings.theme === 'light' ? 'text-primary' : 'text-default-600'}`}>Chiaro</span>
                      </CardBody>
                    </Card>

                    <Card 
                      isPressable 
                      onPress={() => onUpdateSettings({ theme: 'dark' })}
                      className={`
                        border-2 transition-all hover:scale-[1.02]
                        ${settings.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent bg-default-50'}
                      `}
                      shadow="sm"
                    >
                      <CardBody className="flex flex-col items-center justify-center gap-3 p-6">
                        <Moon className={`w-8 h-8 ${settings.theme === 'dark' ? 'text-primary' : 'text-default-500'}`} />
                        <span className={`font-medium ${settings.theme === 'dark' ? 'text-primary' : 'text-default-600'}`}>Scuro</span>
                      </CardBody>
                    </Card>
                  </div>
                </section>

                <section>
                  <h3 className="text-small font-semibold mb-3 text-default-500 uppercase tracking-wider">Sidebar</h3>
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-small font-medium">Trasparenza</span>
                          <span className="text-tiny text-default-500">Rende lo sfondo semi-trasparente</span>
                        </div>
                        <Switch 
                          isSelected={settings.transparency} 
                          onValueChange={(val) => onUpdateSettings({ transparency: val })}
                        />
                      </div>
                      <Divider />
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-small font-medium">Sfocatura (Blur)</span>
                          <span className="text-tiny text-default-500">Applica un effetto vetro smerigliato</span>
                        </div>
                        <Switch 
                          isSelected={settings.blur} 
                          onValueChange={(val) => onUpdateSettings({ blur: val })}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </section>

                <section>
                  <h3 className="text-small font-semibold mb-3 text-default-500 uppercase tracking-wider">Viewport</h3>
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-small font-medium">Trasparenza</span>
                          <span className="text-tiny text-default-500">Rende i pannelli semi-trasparenti</span>
                        </div>
                        <Switch 
                          isSelected={settings.viewportTransparency} 
                          onValueChange={(val) => onUpdateSettings({ viewportTransparency: val })}
                        />
                      </div>
                      <Divider />
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-small font-medium">Sfocatura (Blur)</span>
                          <span className="text-tiny text-default-500">Applica un effetto vetro ai pannelli</span>
                        </div>
                        <Switch 
                          isSelected={settings.viewportBlur} 
                          onValueChange={(val) => onUpdateSettings({ viewportBlur: val })}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </section>
              </div>
            </Tab>

            <Tab
              key="ui"
              title={
                <div className="flex items-center space-x-2">
                  <Layout className="w-4 h-4" />
                  <span>Interfaccia</span>
                </div>
              }
            >
              <div className="flex flex-col gap-6 py-4">
                <section>
                  <h3 className="text-small font-semibold mb-3 text-default-500 uppercase tracking-wider">Pulsanti</h3>
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-small font-medium">Arrotondamento Bordi</span>
                        <div className="flex gap-2">
                          {['4px', '8px', '12px', '999px'].map((radius) => (
                            <Button
                              key={radius}
                              size="sm"
                              variant={settings.buttonBorderRadius === radius ? "solid" : "bordered"}
                              color={settings.buttonBorderRadius === radius ? "primary" : "default"}
                              onPress={() => onUpdateSettings({ buttonBorderRadius: radius })}
                              className="capitalize"
                            >
                              {radius === '999px' ? 'Pillola' : radius}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-small font-medium">Padding Orizzontale</span>
                          <span className="text-tiny text-default-500">{settings.buttonPaddingLeft}rem</span>
                        </div>
                        <Slider 
                          size="sm"
                          step={0.1}
                          maxValue={3}
                          minValue={0}
                          value={settings.buttonPaddingLeft}
                          onChange={(val) => onUpdateSettings({ 
                            buttonPaddingLeft: val as number,
                            buttonPaddingRight: val as number 
                          })}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </section>

                <section>
                  <h3 className="text-small font-semibold mb-3 text-default-500 uppercase tracking-wider">Anteprime</h3>
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-small font-medium">Arrotondamento Anteprima Space</span>
                        <div className="flex gap-2">
                          {['4px', '8px', '12px', '16px'].map((radius) => (
                            <Button
                              key={radius}
                              size="sm"
                              variant={settings.previewBorderRadius === radius ? "solid" : "bordered"}
                              color={settings.previewBorderRadius === radius ? "primary" : "default"}
                              onPress={() => onUpdateSettings({ previewBorderRadius: radius })}
                            >
                              {radius}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </section>
              </div>
            </Tab>

            <Tab
              key="background"
              title={
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Sfondo</span>
                </div>
              }
            >
              <div className="flex flex-col gap-6 py-4">
                <RadioGroup
                  orientation="horizontal"
                  value={settings.backgroundType}
                  onValueChange={(val) => onUpdateSettings({ backgroundType: val as 'solid' | 'gradient' })}
                  label="Tipo di Sfondo"
                >
                  <Radio value="solid">Tinta Unita</Radio>
                  <Radio value="gradient">Gradiente</Radio>
                </RadioGroup>

                {settings.backgroundType === 'solid' ? (
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-4">
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`
                              w-full aspect-square rounded-full border-2 transition-transform hover:scale-110
                              ${settings.backgroundColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-divider'}
                            `}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateSettings({ backgroundColor: color })}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                      <Divider />
                      <div className="flex gap-4 items-center">
                        <div 
                          className="w-10 h-10 rounded-full border border-divider shadow-sm"
                          style={{ backgroundColor: settings.backgroundColor }}
                        />
                        <Input 
                          type="text" 
                          label="Codice Colore" 
                          value={settings.backgroundColor} 
                          onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                          size="sm"
                          className="flex-1"
                        />
                        <input 
                          type="color" 
                          value={settings.backgroundColor}
                          onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                          className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                        />
                      </div>
                    </CardBody>
                  </Card>
                ) : (
                  <Card shadow="sm" className="bg-default-50">
                    <CardBody className="gap-6">
                      <div className="grid grid-cols-2 gap-3">
                        {PRESET_GRADIENTS.map((grad) => (
                          <button
                            key={grad.name}
                            className={`
                              h-12 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center
                              ${settings.gradientStart === grad.start ? 'border-primary' : 'border-transparent'}
                            `}
                            style={{ 
                              background: `linear-gradient(to right, ${grad.start}, ${grad.end})` 
                            }}
                            onClick={() => onUpdateSettings({
                              gradientStart: grad.start,
                              gradientEnd: grad.end,
                              gradientAngle: grad.angle
                            })}
                          >
                            <span className="text-white font-medium shadow-sm drop-shadow-md">{grad.name}</span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-tiny font-bold uppercase text-default-500">Inizio</span>
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded border border-divider" 
                              style={{ backgroundColor: settings.gradientStart }}
                            />
                            <Input 
                              size="sm" 
                              value={settings.gradientStart} 
                              onChange={(e) => onUpdateSettings({ gradientStart: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-tiny font-bold uppercase text-default-500">Fine</span>
                          <div className="flex gap-2">
                            <div 
                              className="w-8 h-8 rounded border border-divider" 
                              style={{ backgroundColor: settings.gradientEnd }}
                            />
                            <Input 
                              size="sm" 
                              value={settings.gradientEnd} 
                              onChange={(e) => onUpdateSettings({ gradientEnd: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="text-small font-medium">Angolo</span>
                          <span className="text-tiny text-default-500">{settings.gradientAngle}°</span>
                        </div>
                        <Slider 
                          size="sm"
                          step={15}
                          maxValue={360}
                          minValue={0}
                          value={settings.gradientAngle}
                          onChange={(val) => onUpdateSettings({ gradientAngle: val as number })}
                        />
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab
              key="debug"
              title={
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>Debug</span>
                </div>
              }
            >
              <div className="flex flex-col gap-4 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 bg-default-100 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={debugMode === 'json' ? "solid" : "light"}
                      color={debugMode === 'json' ? "primary" : "default"}
                      onPress={() => setDebugMode('json')}
                    >
                      JSON
                    </Button>
                    <Button
                      size="sm"
                      variant={debugMode === 'tree' ? "solid" : "light"}
                      color={debugMode === 'tree' ? "primary" : "default"}
                      onPress={() => setDebugMode('tree')}
                    >
                      Tree
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="flat" 
                    startContent={<RotateCcw className="w-4 h-4" />}
                    onPress={onResetSettings}
                  >
                    Reset Totale
                  </Button>
                </div>

                <Card className="bg-[#1e1e1e] border-none">
                  <CardBody className="p-0">
                    <div className="h-[400px] overflow-auto p-4 font-mono text-xs text-default-300">
                      {debugMode === 'json' ? (
                        <pre>{JSON.stringify({ 
                          settings,
                          spacesCount: spacesState?.spaces?.length,
                          viewportRoot: viewportsState?.rootViewport?.id
                        }, null, 2)}</pre>
                      ) : (
                        <div className="text-default-foreground">
                          <DebugTreeView spaces={spacesState?.spaces || []} viewports={viewportsState?.rootViewport} />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}