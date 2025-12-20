import { useState } from 'react';
import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfWeekShort = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

type CalendarView = 'month' | 'week' | 'day' | 'year' | 'timeline';

export function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    } else if (view === 'year') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else if (view === 'timeline') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 14);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    } else if (view === 'year') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else if (view === 'timeline') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 14);
      setCurrentDate(newDate);
    }
  };

  const getViewTitle = () => {
    if (view === 'month') {
      return `${months[month]} ${year}`;
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()} ${months[weekStart.getMonth()]} - ${weekEnd.getDate()} ${months[weekEnd.getMonth()]} ${year}`;
    } else if (view === 'day') {
      return `${currentDate.getDate()} ${months[month]} ${year}`;
    } else if (view === 'year') {
      return `${year}`;
    } else if (view === 'timeline') {
      return `Timeline - ${months[month]} ${year}`;
    }
  };

  const renderMonthView = () => {
    const days = [];
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = 
        d === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();

      days.push(
        <div
          key={d}
          className={`
            p-2 text-center rounded-lg cursor-pointer hover:bg-default-100 transition-colors
            ${isToday ? 'bg-primary/10 font-bold text-primary' : ''}
          `}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex h-full overflow-auto">
        {/* Colonna orari */}
        <div className="w-[60px] shrink-0 border-r border-divider">
          <div className="h-[40px]" /> {/* Header spacing */}
          {hours.map(hour => (
            <div key={hour} className="h-[60px] px-2 py-1 border-t border-divider">
              <span className="text-xs text-default-500">{`${hour}:00`}</span>
            </div>
          ))}
        </div>
        
        {/* Giorni della settimana */}
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={i} className="flex-1 border-r border-divider min-w-[100px]">
              <div className={`
                h-[40px] flex flex-col items-center justify-center border-b border-divider
                ${isToday ? 'bg-primary/10 text-primary' : ''}
              `}>
                <span className="text-xs text-default-500">{daysOfWeekShort[i]}</span>
                <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                  {date.getDate()}
                </span>
              </div>
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-[60px] border-t border-divider cursor-pointer hover:bg-default-100 transition-colors"
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex h-full overflow-auto">
        {/* Colonna orari */}
        <div className="w-[80px] shrink-0 border-r border-divider">
          {hours.map(hour => (
            <div key={hour} className="h-[80px] px-2 py-2 border-t border-divider">
              <span className="text-sm text-default-500">{`${hour}:00`}</span>
            </div>
          ))}
        </div>
        
        {/* Griglia eventi */}
        <div className="flex-1">
          {hours.map(hour => (
            <div 
              key={hour} 
              className="h-[80px] border-t border-divider relative cursor-pointer hover:bg-default-100 transition-colors"
            >
              {/* Linea mezz'ora */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-divider opacity-30" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const monthsInYear = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="grid grid-cols-4 gap-4 p-4 overflow-auto h-full">
        {monthsInYear.map(m => {
          const firstDayOfMonth = new Date(year, m, 1).getDay();
          const daysInCurrentMonth = new Date(year, m + 1, 0).getDate();
          const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
          
          return (
            <div key={m} className="border border-divider rounded-lg p-2 bg-white">
              <p className="text-sm font-semibold mb-2 text-center text-default-700">
                {months[m]}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {daysOfWeekShort.map((d, idx) => (
                  <span key={idx} className="text-center text-[0.65rem] text-default-400">
                    {d}
                  </span>
                ))}
                {Array.from({ length: startDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                  const d = i + 1;
                  const isToday = 
                    d === new Date().getDate() &&
                    m === new Date().getMonth() &&
                    year === new Date().getFullYear();
                  
                  return (
                    <div
                      key={d}
                      className={`
                        text-center text-[0.7rem] p-0.5 rounded cursor-pointer hover:bg-default-100
                        ${isToday ? 'bg-primary/10 font-bold text-primary' : ''}
                      `}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimelineView = () => {
    // Timeline mostra 2 settimane
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 7);
    
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    });
    
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    
    return (
      <div className="flex flex-col h-full overflow-auto">
        {/* Header giorni */}
        <div className="flex border-b-2 border-divider sticky top-0 bg-background z-10">
          <div className="w-[80px] shrink-0 bg-background" /> {/* Spazio per orari */}
          {days.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`
                flex-1 min-w-[100px] p-2 text-center border-r border-divider
                ${isToday ? 'bg-primary/10 text-primary' : ''}
              `}>
                <span className="text-xs text-default-500 block">{daysOfWeekShort[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
                <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                  {date.getDate()}/{date.getMonth() + 1}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Griglia timeline */}
        <div className="flex flex-1">
          {/* Colonna orari */}
          <div className="w-[80px] shrink-0 border-r border-divider bg-background">
            {hours.map(hour => (
              <div key={hour} className="h-[60px] px-2 py-1 border-t border-divider">
                <span className="text-xs text-default-500">{`${hour}:00`}</span>
              </div>
            ))}
          </div>
          
          {/* Giorni */}
          <div className="flex flex-1">
            {days.map((date, i) => (
              <div key={i} className="flex-1 min-w-[100px] border-r border-divider">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className="h-[60px] border-t border-divider cursor-pointer hover:bg-default-100 transition-colors"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-2 border-b border-divider shrink-0">
        <div className="flex items-center gap-1">
          <Button isIconOnly size="sm" variant="light" onPress={prevPeriod}>
            <ChevronLeft size={16} />
          </Button>
          <h4 className="min-w-[200px] text-center text-lg font-bold text-default-900">
            {getViewTitle()}
          </h4>
          <Button isIconOnly size="sm" variant="light" onPress={nextPeriod}>
            <ChevronRight size={16} />
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 bg-default-100 p-1 rounded-lg">
            {(['month', 'week', 'day', 'year', 'timeline'] as const).map((v) => (
              <Button 
                key={v}
                size="sm" 
                variant={view === v ? 'solid' : 'light'}
                color={view === v ? 'primary' : 'default'}
                onPress={() => setView(v)}
                className="capitalize"
              >
                {v === 'month' ? 'Mese' : v === 'week' ? 'Settimana' : v === 'day' ? 'Giorno' : v === 'year' ? 'Anno' : 'Timeline'}
              </Button>
            ))}
          </div>
          <Button startContent={<Plus size={16} />} size="sm" color="primary">
            Nuovo Evento
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <div className="p-4 h-full flex flex-col">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center font-bold text-sm text-default-600">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2 flex-1">
              {renderMonthView()}
            </div>
          </div>
        )}
        
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'year' && renderYearView()}
        {view === 'timeline' && renderTimelineView()}
      </div>
    </div>
  );
}
