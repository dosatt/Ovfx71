import {
  Button,
  Card,
  CardBody
} from '@heroui/react';
import { 
  FileText, 
  Layout, 
  Database, 
  BarChart3, 
  Globe, 
  Mail, 
  MessageSquare, 
  Calendar,
  Clock
} from 'lucide-react';

interface WelcomePageProps {
  onCreateSpace: (type: 'page' | 'canvas' | 'database' | 'dashboard') => void;
  onOpenApp: (appType: 'browser' | 'mail' | 'chat' | 'calendar' | 'draw') => void;
  recentSpaces?: Array<{ id: string; title: string; type: string }>;
  onOpenSpace?: (spaceId: string) => void;
}

export function WelcomePage({ onCreateSpace, onOpenApp, recentSpaces = [], onOpenSpace }: WelcomePageProps) {
  const spaces = [
    { type: 'page' as const, icon: FileText, label: 'Page', description: 'Documento con editor di testo' },
    { type: 'canvas' as const, icon: Layout, label: 'Canvas', description: 'Tela infinita per idee visive' },
    { type: 'database' as const, icon: Database, label: 'Database', description: 'Tabelle e dati strutturati' },
    { type: 'dashboard' as const, icon: BarChart3, label: 'Dashboard', description: 'Pannello di controllo' }
  ];

  const apps = [
    { type: 'browser' as const, icon: Globe, label: 'Browser', description: 'Naviga sul web' },
    { type: 'mail' as const, icon: Mail, label: 'Mail', description: 'Gestisci le email' },
    { type: 'chat' as const, icon: MessageSquare, label: 'Chat', description: 'Messaggistica istantanea' },
    { type: 'calendar' as const, icon: Calendar, label: 'Calendar', description: 'Organizza eventi' }
  ];

  return (
    <div className="h-full overflow-auto p-6 no-scrollbar">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold mb-1">
            Benvenuto in OVFX
          </h3>
          <p className="text-default-500">
            Crea un nuovo spazio o apri un'applicazione
          </p>
        </div>

        {/* Spaces */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold mb-4 px-2">
            Nuovo Spazio
          </h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
            {spaces.map(({ type, icon: Icon, label, description }) => (
              <Card
                key={type}
                isPressable
                onPress={() => onCreateSpace(type)}
                className="border border-divider shadow-sm hover:border-primary hover:shadow-md transition-all"
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-start gap-2">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">{label}</p>
                      <p className="text-tiny text-default-400 leading-tight">
                        {description}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Apps */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold mb-4 px-2">
            Applicazioni
          </h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
            {apps.map(({ type, icon: Icon, label, description }) => (
              <Card
                key={type}
                isPressable
                onPress={() => onOpenApp(type)}
                className="border border-divider shadow-sm hover:border-success hover:shadow-md transition-all"
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-start gap-2">
                    <div className="p-2 rounded-md bg-success/10 text-success">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">{label}</p>
                      <p className="text-tiny text-default-400 leading-tight">
                        {description}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        {recentSpaces.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-4 px-2 flex items-center gap-2">
              <Clock size={16} />
              Recenti
            </h4>
            <div className="flex flex-col gap-1">
              {recentSpaces.map((space) => (
                <Button
                  key={space.id}
                  variant="light"
                  size="sm"
                  onPress={() => onOpenSpace?.(space.id)}
                  className="justify-start px-3 py-2 h-auto hover:bg-default-100"
                >
                  <FileText size={16} className="text-default-500" />
                  <span className="ml-2 text-sm text-default-700">
                    {space.title}
                  </span>
                  <span className="ml-auto text-xs text-default-400">
                    {space.type}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
