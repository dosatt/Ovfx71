import { CalendarElement, CalendarElementData } from '../../components/spaces/CalendarElement';
import { Card } from '@heroui/react';

const mockUpdate = (data: any) => console.log('Update Calendar:', data);
const mockSpacesState = {
    getSpace: () => ({ title: 'Mock Space' })
};

const defaultData: CalendarElementData = {
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 3600000).toISOString(),
    notes: 'Meeting with team',
    recurrence: 'none',
    completed: false
};

const completedData: CalendarElementData = {
    ...defaultData,
    notes: 'Completed Task',
    completed: true
};

const recurringData: CalendarElementData = {
    ...defaultData,
    notes: 'Weekly Sync',
    recurrence: 'weekly'
};

const attachmentData: CalendarElementData = {
    ...defaultData,
    notes: 'Project Review',
    attachments: [
        { id: '1', type: 'application/pdf', title: 'Specs.pdf' },
        { id: '2', type: 'image/png', title: 'Design.png' }
    ]
};

const inlineData: CalendarElementData = {
    ...defaultData,
    displayMode: 'inline'
};

export const CalendarExamples = () => (
    <div className="flex flex-col gap-8">
        <section>
            <h4 className="text-sm font-medium text-default-500 mb-4">Card View (Default)</h4>
            <div className="grid gap-4 md:grid-cols-2">
                <CalendarElement data={defaultData} onUpdate={mockUpdate} spacesState={mockSpacesState} />
                <CalendarElement data={completedData} onUpdate={mockUpdate} spacesState={mockSpacesState} />
            </div>
        </section>

        <section>
            <h4 className="text-sm font-medium text-default-500 mb-4">With recurrences & Attachments</h4>
            <div className="grid gap-4 md:grid-cols-2">
                <CalendarElement data={recurringData} onUpdate={mockUpdate} spacesState={mockSpacesState} />
                <CalendarElement data={attachmentData} onUpdate={mockUpdate} spacesState={mockSpacesState} />
            </div>
        </section>

        <section>
            <h4 className="text-sm font-medium text-default-500 mb-4">Inline View</h4>
            <div className="flex flex-wrap gap-4 items-center p-4 border rounded-xl bg-default-50">
                <span>Text before</span>
                <CalendarElement data={inlineData} onUpdate={mockUpdate} spacesState={mockSpacesState} />
                <span>Text after</span>
            </div>
        </section>
    </div>
);
