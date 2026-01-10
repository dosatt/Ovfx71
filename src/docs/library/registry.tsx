import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/accordion';
import { Switch } from '../../components/ui/switch';
import { Mail, Loader2, Plus } from 'lucide-react';
import { TextElementExamples } from './examples/TextElementExamples';
import { CalendarExamples } from './examples/CalendarExamples';
import { FileElementExamples } from './examples/FileElementExamples';

export interface ComponentExample {
    title: string;
    description?: string;
    render: () => React.ReactNode;
}

export interface ComponentEntry {
    id: string;
    name: string;
    examples: ComponentExample[];
}

export const registry: ComponentEntry[] = [
    {
        id: 'button',
        name: 'Button',
        examples: [
            {
                title: 'Variants',
                render: () => (
                    <div className="flex flex-wrap gap-4">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                    </div>
                ),
            },
            {
                title: 'Sizes',
                render: () => (
                    <div className="flex flex-wrap items-center gap-4">
                        <Button size="lg">Large</Button>
                        <Button size="default">Default</Button>
                        <Button size="sm">Small</Button>
                        <Button size="icon"><Plus className="size-4" /></Button>
                    </div>
                ),
            },
            {
                title: 'States',
                render: () => (
                    <div className="flex flex-wrap gap-4">
                        <Button disabled>Disabled</Button>
                        <Button><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</Button>
                        <Button><Mail className="mr-2 h-4 w-4" /> With Icon</Button>
                    </div>
                ),
            },
        ],
    },
    {
        id: 'input',
        name: 'Input',
        examples: [
            {
                title: 'Default',
                render: () => <Input placeholder="Email" type="email" />,
            },
            {
                title: 'Disabled',
                render: () => <Input disabled placeholder="Disabled" />,
            },
            {
                title: 'File',
                render: () => <Input type="file" />,
            },
        ],
    },
    {
        id: 'badge',
        name: 'Badge',
        examples: [
            {
                title: 'Variants',
                render: () => (
                    <div className="flex gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </div>
                )
            }
        ]
    },
    {
        id: 'card',
        name: 'Card',
        examples: [
            {
                title: 'Simple Card',
                render: () => (
                    <Card className="w-[350px]">
                        <CardHeader>
                            <CardTitle>Card Title</CardTitle>
                            <CardDescription>Card Description goes here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Main content area of the card.</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline">Cancel</Button>
                            <Button>Submit</Button>
                        </CardFooter>
                    </Card>
                )
            }
        ]
    },
    {
        id: 'tabs',
        name: 'Tabs',
        examples: [
            {
                title: 'Default Tabs',
                render: () => (
                    <Tabs defaultValue="account" className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">Account</TabsTrigger>
                            <TabsTrigger value="password">Password</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account</CardTitle>
                                    <CardDescription>
                                        Make changes to your account here. Click save when you're done.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Input placeholder="Name" defaultValue="Pedro Duarte" />
                                </CardContent>
                                <CardFooter>
                                    <Button>Save changes</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                        <TabsContent value="password">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Password</CardTitle>
                                    <CardDescription>
                                        Change your password here. After saving, you'll be logged out.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Input type="password" placeholder="New password" />
                                </CardContent>
                                <CardFooter>
                                    <Button>Save password</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )
            }
        ]
    },
    {
        id: 'accordion',
        name: 'Accordion',
        examples: [
            {
                title: 'Default',
                render: () => (
                    <Accordion type="single" collapsible className="w-full max-w-md">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Is it accessible?</AccordionTrigger>
                            <AccordionContent>
                                Yes. It adheres to the WAI-ARIA design patterns.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is it styled?</AccordionTrigger>
                            <AccordionContent>
                                Yes. It comes with default styles that matches the other components&apos; aesthetic.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            }
        ]
    },
    {
        id: 'switch',
        name: 'Switch',
        examples: [
            {
                title: 'Default',
                render: () => (
                    <div className="flex items-center space-x-2">
                        <Switch id="airplane-mode" />
                        <label htmlFor="airplane-mode">Airplane Mode</label>
                    </div>
                )
            }
        ]
    },
    {
        id: 'text-element',
        name: 'Text Element',
        examples: [
            {
                title: 'All Variants',
                description: 'Rich text block editor with support for headings, lists, code, and more',
                render: () => <TextElementExamples />
            }
        ]
    },
    {
        id: 'calendar-element',
        name: 'Calendar Element',
        examples: [
            {
                title: 'All Variants',
                description: 'Event component with inline and card views, recurrences, and attachments',
                render: () => <CalendarExamples />
            }
        ]
    },
    {
        id: 'file-element',
        name: 'File Element',
        examples: [
            {
                title: 'All Variants',
                description: 'File and folder management with multiple layouts (preview, compact, collection)',
                render: () => <FileElementExamples />
            }
        ]
    }
];
