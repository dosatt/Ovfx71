import { Button } from '@heroui/react';
import { Plus, Inbox, Send, Archive, Trash2 } from 'lucide-react';

const mockEmails = [
  { id: 1, from: 'John Doe', subject: 'Meeting Tomorrow', preview: 'Hi, just wanted to confirm...', time: '10:30 AM' },
  { id: 2, from: 'Jane Smith', subject: 'Project Update', preview: 'The latest update on the project...', time: '9:15 AM' },
  { id: 3, from: 'Team', subject: 'Weekly Review', preview: 'Please review the weekly report...', time: 'Yesterday' }
];

export function MailApp() {
  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-[200px] border-r border-divider p-4 flex flex-col gap-2">
        <Button startContent={<Plus size={16} />} size="sm" color="primary" className="w-full">
          Compose
        </Button>
        <div className="flex flex-col gap-1 mt-4">
          <Button variant="flat" size="sm" startContent={<Inbox size={16} />} className="justify-start">
            Inbox
          </Button>
          <Button variant="light" size="sm" startContent={<Send size={16} />} className="justify-start">
            Sent
          </Button>
          <Button variant="light" size="sm" startContent={<Archive size={16} />} className="justify-start">
            Archive
          </Button>
          <Button variant="light" size="sm" color="danger" startContent={<Trash2 size={16} />} className="justify-start">
            Trash
          </Button>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {mockEmails.map(email => (
          <div
            key={email.id}
            className="p-4 border-b border-divider cursor-pointer hover:bg-default-50 transition-colors"
          >
            <div className="flex justify-between mb-1">
              <span className="text-small font-semibold">{email.from}</span>
              <span className="text-tiny text-default-400">
                {email.time}
              </span>
            </div>
            <p className="text-small font-medium mb-1 text-default-900">{email.subject}</p>
            <p className="text-small text-default-500 truncate">
              {email.preview}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
