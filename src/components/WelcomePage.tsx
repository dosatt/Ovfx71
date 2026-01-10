import { useEffect, useState } from 'react';
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
  Clock,
  Search,
  Command
} from 'lucide-react';

interface RecentSpace {
  id: string;
  title: string;
  type: string;
}

interface WelcomePageProps {
  onCreateSpace: (type: 'page' | 'canvas' | 'database' | 'dashboard') => void;
  onOpenApp: (appType: 'browser' | 'mail' | 'chat' | 'calendar' | 'draw' | 'settings') => void;
  onOpenSpace: (spaceId: string) => void;
  recentSpaces: RecentSpace[];
}

export function WelcomePage({ onCreateSpace, onOpenApp, onOpenSpace, recentSpaces }: WelcomePageProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('welcome-search-input');
        if (searchInput) {
          searchInput.focus();
          setSearchFocused(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const spaces = [
    { type: 'page' as const, icon: FileText, label: 'Page', description: 'Document with text editor' },
    { type: 'canvas' as const, icon: Layout, label: 'Canvas', description: 'Infinite canvas for visual ideas' },
    { type: 'database' as const, icon: Database, label: 'Database', description: 'Tables and structured data' },
    { type: 'dashboard' as const, icon: BarChart3, label: 'Dashboard', description: 'Modular control panel' }
  ];

  const apps = [
    { type: 'browser' as const, icon: Globe, label: 'Browser', description: 'Browse the web' },
    { type: 'mail' as const, icon: Mail, label: 'Mail', description: 'Manage your emails' },
    { type: 'chat' as const, icon: MessageSquare, label: 'Chat', description: 'Instant messaging' },
    { type: 'calendar' as const, icon: Calendar, label: 'Calendar', description: 'Organize events' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-6 select-none relative">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold mb-1">
            Welcome to OVFX
          </h3>
          <p className="text-default-500 mb-6">
            Create a new space or open an application
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-md mx-auto relative group">
            <div className={`
              flex items-center gap-3 px-4 h-12 rounded-xl border-2 transition-all duration-200
              ${searchFocused ? 'border-primary bg-background shadow-lg shadow-primary/10' : 'border-divider bg-default-50 hover:border-default-400'}
            `}>
              <Search size={18} className={searchFocused ? 'text-primary' : 'text-default-400'} />
              <input
                id="welcome-search-input"
                type="text"
                placeholder="Search for commands or spaces..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-default-200/50 text-[10px] font-medium text-default-500">
                <Command size={10} /> K
              </div>
            </div>
          </div>
        </div>

        {/* Spaces */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold mb-4 px-2">
            New Space
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
            Applications
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
              Recent
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