import React, { useMemo } from 'react';
import { Space, Tab } from '../types';
import {
    FileText, Layout, Database, BarChart3, Globe, Mail,
    MessageSquare, Calendar, Clock, DiamondPlus, Eye
} from 'lucide-react';
import { format, isValid, startOfMonth, startOfWeek, endOfWeek, isSameDay, addDays } from 'date-fns';

interface TabPreviewProps {
    tab: Tab;
    tabSpace: Space | null;
    spacesState: any;
}

export function TabPreview({ tab, tabSpace, spacesState }: TabPreviewProps) {
    const isApp = !!tab.appType;

    const renderPagePreview = (space: Space) => {
        const blocks = space.content?.blocks || [];
        return (
            <div className="w-full h-full bg-white p-2 flex flex-col gap-1 overflow-hidden select-none">
                {space.metadata?.cover && (
                    <div className="w-full h-8 flex-shrink-0 rounded-sm mb-1 overflow-hidden">
                        <img src={space.metadata.cover} className="w-full h-full object-cover opacity-60" alt="" />
                    </div>
                )}
                <div className="flex items-center gap-1 mb-1">
                    {space.icon && <span className="text-[8px]">{space.icon}</span>}
                    <div className="text-[6px] font-bold truncate flex-1">{space.title}</div>
                </div>
                <div className="flex flex-col gap-0.5">
                    {blocks.slice(0, 12).map((block: any, i: number) => {
                        const content = block.content || '';
                        if (block.type === 'heading1') return <div key={i} className="text-[5px] font-bold truncate mt-1 border-b border-default-100 pb-0.5">{content}</div>;
                        if (block.type === 'heading2') return <div key={i} className="text-[4px] font-bold truncate mt-0.5">{content}</div>;
                        if (block.type === 'checkbox') return (
                            <div key={i} className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 border border-default-300 rounded-[2px] shrink-0 ${block.checked ? 'bg-primary/30' : ''}`} />
                                <div className="text-[3px] truncate flex-1 opacity-70">{content}</div>
                            </div>
                        );
                        if (block.type === 'bulletList') return (
                            <div key={i} className="flex items-center gap-1 ml-1">
                                <div className="w-0.5 h-0.5 bg-default-400 rounded-full shrink-0" />
                                <div className="text-[3px] truncate flex-1 opacity-70">{content}</div>
                            </div>
                        );
                        if (block.type === 'image') return <div key={i} className="w-full h-6 bg-default-100 rounded-sm my-0.5" />;
                        if (block.type === 'divider') return <div key={i} className="w-full h-px bg-default-100 my-0.5" />;
                        return <div key={i} className="text-[3px] leading-tight truncate opacity-60 h-2">{content}</div>;
                    })}
                </div>
                {blocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 opacity-5">
                        <FileText size={32} />
                    </div>
                )}
            </div>
        );
    };

    const renderCanvasPreview = (space: Space) => {
        const elements = space.content?.elements || [];

        // Simple bounding box for centering
        let minX = 0, minY = 0, maxX = 800, maxY = 600;
        if (elements.length > 0) {
            minX = Math.min(...elements.map((e: any) => e.x));
            minY = Math.min(...elements.map((e: any) => e.y));
            maxX = Math.max(...elements.map((e: any) => (e.x + (e.width || 0))));
            maxY = Math.max(...elements.map((e: any) => (e.y + (e.height || 0))));
        }

        const width = maxX - minX || 800;
        const height = maxY - minY || 600;
        const padding = Math.max(width, height) * 0.1;

        return (
            <div className="w-full h-full bg-default-50/30 relative overflow-hidden">
                <svg
                    viewBox={`${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`}
                    className="w-full h-full p-1 opacity-80"
                >
                    {elements.map((el: any) => {
                        const commonProps = {
                            key: el.id,
                            fill: el.fill || el.color || 'none',
                            stroke: el.stroke || el.color || '#000',
                            strokeWidth: (el.strokeWidth || 2) * 2,
                            opacity: 0.6
                        };

                        if (el.type === 'rectangle') return <rect x={el.x} y={el.y} width={el.width} height={el.height} {...commonProps} rx={2} />;
                        if (el.type === 'circle') return <circle cx={el.x + el.width / 2} cy={el.y + el.height / 2} r={el.width / 2} {...commonProps} />;
                        if (el.type === 'line' || el.type === 'arrow') return <line x1={el.x} y1={el.y} x2={el.x + (el.width || 0)} y2={el.y + (el.height || 0)} {...commonProps} />;
                        if (el.type === 'path') {
                            const points = el.points?.split(' ').map((p: string) => p.split(',').map(Number)) || [];
                            if (points.length < 2) return null;
                            const d = `M ${points[0][0]} ${points[0][1]} ${points.slice(1).map((p: any) => `L ${p[0]} ${p[1]}`).join(' ')}`;
                            return <path d={d} {...commonProps} fill="none" />;
                        }
                        if (el.type === 'text') return <text key={el.id} x={el.x} y={el.y + 20} fontSize={20} fill={el.color}>{el.text || el.textContent}</text>;
                        return null;
                    })}
                </svg>
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:10px_10px] opacity-20 pointer-events-none" />
            </div>
        );
    };

    const renderDatabasePreview = (space: Space) => {
        return (
            <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none">
                <div className="h-4 bg-default-100 border-b border-default-200 flex items-center px-2 gap-2">
                    <div className="w-8 h-1 bg-default-400 rounded-full" />
                    <div className="w-8 h-1 bg-default-300 rounded-full" />
                    <div className="w-8 h-1 bg-default-300 rounded-full" />
                </div>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-3 border-b border-default-50 flex items-center px-2 gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-default-200 shrink-0" />
                        <div className="w-12 h-1 bg-default-100 rounded-full" />
                        <div className="w-16 h-1 bg-default-50 rounded-full" />
                        <div className="w-8 h-1 bg-default-100 rounded-full ml-auto" />
                    </div>
                ))}
            </div>
        );
    };

    const renderDashboardPreview = (space: Space) => {
        return (
            <div className="w-full h-full bg-default-100/30 p-2 grid grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden">
                <div className="bg-white rounded border border-default-100 shadow-sm p-1.5 flex flex-col gap-1">
                    <div className="w-1/2 h-1 bg-default-200 rounded" />
                    <div className="flex-1 bg-primary/5 rounded-sm flex items-end p-1 gap-0.5">
                        {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => <div key={i} className="flex-1 bg-primary/40 rounded-t-[1px]" style={{ height: `${h * 100}%` }} />)}
                    </div>
                </div>
                <div className="bg-white rounded border border-default-100 shadow-sm p-1.5 flex flex-col gap-1">
                    <div className="w-2/3 h-1 bg-default-200 rounded" />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-4 border-success/20 border-t-success" />
                    </div>
                </div>
                <div className="bg-white rounded border border-default-100 shadow-sm p-1.5">
                    <div className="w-full h-full bg-warning/5 rounded-sm p-1 flex flex-col gap-1">
                        {[...Array(3)].map((_, i) => <div key={i} className="w-full h-1 bg-warning/20 rounded-full" />)}
                    </div>
                </div>
                <div className="bg-white rounded border border-default-100 shadow-sm p-1.5 flex flex-col gap-1">
                    <div className="w-1/4 h-1 bg-default-200 rounded" />
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><div className="w-full h-0.5 bg-default-100" /></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /><div className="w-full h-0.5 bg-default-100" /></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /><div className="w-full h-0.5 bg-default-100" /></div>
                    </div>
                </div>
            </div>
        );
    };

    const allEvents = useMemo(() => {
        if (tab.appType !== 'calendar') return [];
        const events: any[] = [];
        spacesState.spaces.forEach((space: any) => {
            if (space.content?.blocks) {
                space.content.blocks.forEach((block: any) => {
                    if (block.type === 'calendar') {
                        const start = new Date(block.metadata?.startDate || Date.now());
                        if (isValid(start)) {
                            events.push({ ...block, start });
                        }
                    }
                });
            }
        });
        return events;
    }, [tab.appType, spacesState.spaces]);

    const renderCalendarAppPreview = () => {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const days = Array.from({ length: 35 }, (_, i) => addDays(calendarStart, i));

        return (
            <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none">
                <div className="h-3 bg-default-100 border-b border-default-200 flex items-center justify-between px-2">
                    <div className="text-[5px] font-bold text-default-600 uppercase tracking-tighter">{format(today, 'MMMM yyyy')}</div>
                    <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/10 flex items-center justify-center"><Calendar size={4} className="text-primary" /></div>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-default-100 p-px">
                    {days.map((day, i) => {
                        const isToday = isSameDay(day, today);
                        const dayEvents = allEvents.filter(e => isSameDay(e.start, day));

                        return (
                            <div key={i} className={`bg-white relative flex flex-col p-0.5 gap-0.5 ${isToday ? 'bg-primary/5' : ''}`}>
                                <div className={`text-[3px] self-end ${isToday ? 'bg-primary text-white rounded-px px-0.5' : 'text-default-400'}`}>
                                    {format(day, 'd')}
                                </div>
                                {dayEvents.slice(0, 2).map((e, idx) => (
                                    <div key={idx} className="w-full h-1 bg-primary/20 rounded-[1px]" />
                                ))}
                                {dayEvents.length > 2 && <div className="w-1/2 h-0.5 bg-default-200 rounded-full" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAppPreview = (type: string) => {
        switch (type) {
            case 'calendar': return renderCalendarAppPreview();
            case 'mail':
                return (
                    <div className="w-full h-full bg-white flex overflow-hidden select-none">
                        <div className="w-6 bg-default-50 border-r border-default-100 p-1 flex flex-col gap-1.5">
                            <div className="w-full h-2 bg-primary/10 rounded-sm mb-1" />
                            {[...Array(4)].map((_, i) => <div key={i} className="w-full h-0.5 bg-default-200 rounded-full" />)}
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="h-3 bg-default-50 border-b border-default-100 px-2 flex items-center">
                                <div className="w-12 h-1 bg-default-300 rounded-full" />
                            </div>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-3.5 border-b border-default-50 p-1 flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < 2 ? 'bg-primary/50' : 'bg-default-200'}`} />
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <div className="w-1/2 h-1 bg-default-400 rounded-full" />
                                        <div className="w-full h-0.5 bg-default-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'browser':
                return (
                    <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none">
                        <div className="h-4 bg-default-100 border-b border-default-200 flex items-center px-1.5 gap-1.5">
                            <div className="flex gap-0.5">
                                <div className="w-1 h-1 rounded-full bg-red-400/60" />
                                <div className="w-1 h-1 rounded-full bg-yellow-400/60" />
                                <div className="w-1 h-1 rounded-full bg-green-400/60" />
                            </div>
                            <div className="flex-1 h-2.5 bg-white rounded-full border border-default-200 flex items-center px-1">
                                <Globe size={4} className="text-default-400" />
                                <div className="w-1/2 h-0.5 bg-default-100 rounded-full ml-1" />
                            </div>
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-2 opacity-60">
                            <div className="w-3/4 h-2 bg-default-200 rounded-full" />
                            <div className="w-full h-1 bg-default-100 rounded-full" />
                            <div className="w-full h-1 bg-default-100 rounded-full" />
                            <div className="w-2/3 h-1 bg-default-100 rounded-full" />
                            <div className="grid grid-cols-3 gap-1 mt-1">
                                {[...Array(3)].map((_, i) => <div key={i} className="aspect-video bg-default-50 rounded border border-default-100" />)}
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="w-full h-full bg-white flex overflow-hidden select-none">
                        <div className="w-10 bg-default-50 border-r border-default-100 p-1.5 flex flex-col gap-2">
                            <div className="w-full h-1.5 bg-default-400 rounded-full mb-1" />
                            {[...Array(5)].map((_, i) => <div key={i} className="w-full h-1 bg-default-200 rounded-full" />)}
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-3">
                            <div className="w-1/3 h-2 bg-default-300 rounded-full" />
                            <div className="grid grid-cols-2 gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-6 rounded border border-default-100 bg-white shadow-sm flex items-center px-1 gap-1">
                                        <div className="w-2 h-2 rounded bg-default-100" />
                                        <div className="w-1/2 h-0.5 bg-default-50" />
                                    </div>
                                ))}
                            </div>
                            <div className="w-full h-12 bg-default-50 rounded-lg border border-default-100 border-dashed" />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="w-full h-full bg-default-50 flex items-center justify-center opacity-20">
                        <Globe size={32} />
                    </div>
                );
        }
    };

    const renderDefaultPreview = () => (
        <div className="w-full h-full bg-default-100/50 flex flex-col items-center justify-center relative">
            <div className="w-3/4 h-3/4 rounded-lg bg-white shadow-sm border border-default-200 flex flex-col p-3 gap-2 opacity-40">
                <div className="w-1/2 h-2 bg-default-200 rounded-full mb-1" />
                <div className="w-full h-1 bg-default-100 rounded-full" />
                <div className="w-full h-1 bg-default-100 rounded-full" />
                <div className="w-2/3 h-1 bg-default-100 rounded-full" />
                <div className="mt-auto flex justify-between items-center">
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded bg-primary/20" />
                        <div className="w-3 h-3 rounded bg-success/20" />
                    </div>
                    <div className="w-6 h-3 rounded bg-default-50" />
                </div>
            </div>
            <DiamondPlus size={32} className="text-primary/20 absolute" />
        </div>
    );

    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-black/5 bg-background relative">
            {tab.previewUrl ? (
                <img
                    src={tab.previewUrl}
                    className="w-full h-full object-cover"
                    alt="Tab preview"
                />
            ) : (
                <>
                    {isApp && renderAppPreview(tab.appType as string)}
                    {!isApp && tabSpace?.type === 'page' && renderPagePreview(tabSpace)}
                    {!isApp && tabSpace?.type === 'canvas' && renderCanvasPreview(tabSpace)}
                    {!isApp && tabSpace?.type === 'database' && renderDatabasePreview(tabSpace)}
                    {!isApp && tabSpace?.type === 'dashboard' && renderDashboardPreview(tabSpace)}
                    {!isApp && !tabSpace && renderDefaultPreview()}
                </>
            )}
        </div>
    );
}
