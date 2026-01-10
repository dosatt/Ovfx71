import { useState } from 'react';
import { TextElement } from '../../../components/spaces/TextElement';
import { Block } from '../../../types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock handlers
const mockUpdate = (id: string, updates: Partial<Block>) => console.log('Update:', id, updates);
const mockDelete = (id: string) => console.log('Delete:', id);
const mockAddAfter = (blockId: string) => console.log('Add after:', blockId);
const mockMove = (dragIndex: number, hoverIndex: number) => console.log('Move:', dragIndex, '->', hoverIndex);
const mockConvertBlock = (blockId: string, newType: any) => console.log('Convert:', blockId, newType);

const mockConfig = {
    icon: null,
    placeholder: 'Type something...',
    multiline: true
};

const mockSpacesState = {
    getSpace: () => ({ title: 'Mock Space', content: { blocks: [] } }),
    updateSpace: () => { }
};

const mockViewportsState = {
    focusedViewportId: 'mock',
    findViewport: () => ({ id: 'mock', activeTabId: 'tab1' }),
    updateTab: () => { }
};

// Sample blocks
const textBlock: Block = {
    id: 'text-1',
    type: 'text',
    content: 'This is a simple text block. You can edit, drag, and interact with it.'
};

const headingBlock: Block = {
    id: 'heading-1',
    type: 'heading1',
    content: 'This is a Heading 1'
};

const bulletListBlock: Block = {
    id: 'bullet-1',
    type: 'bulletList',
    content: 'Bullet list item'
};

const numberedListBlock: Block = {
    id: 'numbered-1',
    type: 'numberedList',
    content: 'Numbered list item',
    listNumber: 1
};

const checkboxBlock: Block = {
    id: 'checkbox-1',
    type: 'checkbox',
    content: 'Task to complete',
    checked: false
};

const codeBlock: Block = {
    id: 'code-1',
    type: 'code',
    content: 'const hello = "world";'
};

const quoteBlock: Block = {
    id: 'quote-1',
    type: 'quote',
    content: 'This is a quoted text block'
};

export const TextElementExamples = () => {
    const [blocks, setBlocks] = useState<Record<string, Block>>({
        'text-1': textBlock,
        'heading-1': headingBlock,
        'bullet-1': bulletListBlock,
        'numbered-1': numberedListBlock,
        'checkbox-1': checkboxBlock,
        'code-1': codeBlock,
        'quote-1': quoteBlock
    });

    const handleUpdate = (id: string, updates: Partial<Block>) => {
        setBlocks(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col gap-8">
                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Text & Headings</h4>
                    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-background">
                        <TextElement
                            block={blocks['text-1']}
                            index={0}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                        <TextElement
                            block={blocks['heading-1']}
                            index={1}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Lists</h4>
                    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-background">
                        <TextElement
                            block={blocks['bullet-1']}
                            index={2}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                        <TextElement
                            block={blocks['numbered-1']}
                            index={3}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                        <TextElement
                            block={blocks['checkbox-1']}
                            index={4}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Code & Quote</h4>
                    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-background">
                        <TextElement
                            block={blocks['code-1']}
                            index={5}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                        <TextElement
                            block={blocks['quote-1']}
                            index={6}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                            onAddAfter={mockAddAfter}
                            onMove={mockMove}
                            onConvertBlock={mockConvertBlock}
                            config={mockConfig}
                            spacesState={mockSpacesState}
                            viewportsState={mockViewportsState}
                        />
                    </div>
                </section>
            </div>
        </DndProvider>
    );
};
