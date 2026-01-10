import { useState } from 'react';
import { registry } from './registry';
import { ScrollShadow, Button, Card } from '@heroui/react';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '../components/ui/utils';

export function LibraryAppSection() {
    const [selectedComponentId, setSelectedComponentId] = useState(registry[0].id);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedComponent = registry.find(c => c.id === selectedComponentId) || registry[0];

    const filteredRegistry = registry.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Library Sidebar */}
            <div className="w-64 border-r border-default-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-default-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            L
                        </div>
                        <h2 className="text-lg font-bold">UI Library</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-default-400" />
                        <input
                            type="text"
                            placeholder="Search components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-4 py-1.5 text-sm bg-default-100 rounded-md outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <ScrollShadow className="flex-1 p-2">
                    {filteredRegistry.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedComponentId(item.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors",
                                selectedComponentId === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-default-100 text-default-600"
                            )}
                        >
                            {item.name}
                            <ChevronRight className={cn("size-4 opacity-50", selectedComponentId === item.id && "opacity-100")} />
                        </button>
                    ))}
                </ScrollShadow>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-default-50/50">
                <div className="p-8 border-b border-default-200 bg-background">
                    <h1 className="text-3xl font-bold mb-2">{selectedComponent.name}</h1>
                    <p className="text-default-500">Component examples and variations.</p>
                </div>

                <ScrollShadow className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto space-y-12 pb-20">
                        {selectedComponent.examples.map((example, idx) => (
                            <section key={idx}>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-default-400 mb-4">
                                    {example.title}
                                </h3>
                                <Card className="p-6 bg-background border border-default-200 shadow-sm overflow-visible">
                                    <div className="flex flex-col gap-4">
                                        {example.render()}
                                    </div>
                                </Card>
                            </section>
                        ))}
                    </div>
                </ScrollShadow>
            </div>
        </div>
    );
}
