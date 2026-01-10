import { useState } from 'react';
import { FileElement } from '../../../components/spaces/FileElement';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const mockUpdate = (updates: any) => console.log('Update Files:', updates);
const mockDelete = () => console.log('Delete file element');

const sampleFiles = [
    {
        id: '1',
        name: 'Documents',
        size: 0,
        type: 'directory',
        isFolder: true,
        children: [
            {
                id: '2',
                name: 'Project Spec.pdf',
                size: 1024000,
                type: 'application/pdf',
                isFolder: false,
                parentId: '1'
            },
            {
                id: '3',
                name: 'Design.png',
                size: 512000,
                type: 'image/png',
                isFolder: false,
                parentId: '1'
            }
        ]
    },
    {
        id: '4',
        name: 'Script.js',
        size: 8192,
        type: 'text/javascript',
        isFolder: false
    }
];

export const FileElementExamples = () => {
    const [files, setFiles] = useState(sampleFiles);

    const handleUpdate = (updates: any) => {
        if (updates.files) {
            setFiles(updates.files);
        }
        mockUpdate(updates);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col gap-8">
                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Preview Mode (Single File)</h4>
                    <div className="p-4 border rounded-xl bg-background">
                        <FileElement
                            layout="preview"
                            fileName="Document.pdf"
                            fileSize={1024000}
                            fileType="application/pdf"
                            onUpdate={mockUpdate}
                            onDelete={mockDelete}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Compact Mode (Single File)</h4>
                    <div className="p-4 border rounded-xl bg-background">
                        <FileElement
                            layout="compact"
                            fileName="Presentation.pptx"
                            fileSize={2048000}
                            fileType="application/vnd.ms-powerpoint"
                            onUpdate={mockUpdate}
                            onDelete={mockDelete}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Collection - Grid Layout</h4>
                    <div className="p-4 border rounded-xl bg-background">
                        <FileElement
                            layout="collection"
                            collectionLayout="grid"
                            fileName="My Files"
                            files={files}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="text-sm font-medium text-default-500 mb-4">Collection - List Layout</h4>
                    <div className="p-4 border rounded-xl bg-background">
                        <FileElement
                            layout="collection"
                            collectionLayout="list"
                            fileName="My Files"
                            files={files}
                            onUpdate={handleUpdate}
                            onDelete={mockDelete}
                        />
                    </div>
                </section>
            </div>
        </DndProvider>
    );
};
