import { useState } from 'react';
import { Input, Button } from '@heroui/react';
import { ArrowLeft, ArrowRight, RotateCw, Home } from 'lucide-react';

export function BrowserApp() {
  const [url, setUrl] = useState('https://example.com');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* URL Bar */}
      <div className="p-2 flex gap-1 border-b border-divider items-center">
        <Button isIconOnly size="sm" variant="light">
          <ArrowLeft size={16} />
        </Button>
        <Button isIconOnly size="sm" variant="light">
          <ArrowRight size={16} />
        </Button>
        <Button isIconOnly size="sm" variant="light">
          <RotateCw size={16} />
        </Button>
        <Button isIconOnly size="sm" variant="light">
          <Home size={16} />
        </Button>
        <Input
          value={url}
          onValueChange={setUrl}
          className="flex-1"
          size="sm"
          classNames={{
            inputWrapper: "bg-default-100",
          }}
        />
      </div>

      {/* Browser Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-center text-default-400">
          <p>Browser simulation</p>
          <p className="text-small">Navigate to: {url}</p>
        </div>
      </div>
    </div>
  );
}
