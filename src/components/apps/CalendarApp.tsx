import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
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
      days.push(<Box key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = 
        d === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();

      days.push(
        <Box
          key={d}
          sx={{
            p: 1,
            textAlign: 'center',
            borderRadius: '8px',
            bgcolor: isToday ? 'primary.softBg' : 'transparent',
            fontWeight: isToday ? 'bold' : 'normal',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'background.level1'
            }
          }}
        >
          {d}
        </Box>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'auto' }}>
        {/* Colonna orari */}
        <Box sx={{ width: 60, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ height: 40 }} /> {/* Header spacing */}
          {hours.map(hour => (
            <Box key={hour} sx={{ height: 60, px: 1, py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography level="body-xs">{`${hour}:00`}</Typography>
            </Box>
          ))}
        </Box>
        
        {/* Giorni della settimana */}
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Box key={i} sx={{ flex: 1, borderRight: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ 
                height: 40, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: isToday ? 'primary.softBg' : 'transparent'
              }}>
                <Typography level="body-xs">{daysOfWeekShort[i]}</Typography>
                <Typography level="body-sm" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                  {date.getDate()}
                </Typography>
              </Box>
              {hours.map(hour => (
                <Box 
                  key={hour} 
                  sx={{ 
                    height: 60, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'background.level1'
                    }
                  }} 
                />
              ))}
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'auto' }}>
        {/* Colonna orari */}
        <Box sx={{ width: 80, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }}>
          {hours.map(hour => (
            <Box key={hour} sx={{ height: 80, px: 1, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography level="body-sm">{`${hour}:00`}</Typography>
            </Box>
          ))}
        </Box>
        
        {/* Griglia eventi */}
        <Box sx={{ flex: 1 }}>
          {hours.map(hour => (
            <Box 
              key={hour} 
              sx={{ 
                height: 80, 
                borderTop: '1px solid', 
                borderColor: 'divider',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'background.level1'
                }
              }}
            >
              {/* Linea mezz'ora */}
              <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                bgcolor: 'divider',
                opacity: 0.3
              }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderYearView = () => {
    const monthsInYear = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 2,
        p: 2,
        overflow: 'auto',
        height: '100%'
      }}>
        {monthsInYear.map(m => {
          const firstDayOfMonth = new Date(year, m, 1).getDay();
          const daysInCurrentMonth = new Date(year, m + 1, 0).getDate();
          const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
          
          return (
            <Box key={m} sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px',
              p: 1
            }}>
              <Typography level="title-sm" sx={{ mb: 1, textAlign: 'center' }}>
                {months[m]}
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 0.5
              }}>
                {daysOfWeekShort.map((d, idx) => (
                  <Typography key={idx} level="body-xs" sx={{ textAlign: 'center', fontSize: '0.65rem' }}>
                    {d}
                  </Typography>
                ))}
                {Array.from({ length: startDay }, (_, i) => (
                  <Box key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => {
                  const d = i + 1;
                  const isToday = 
                    d === new Date().getDate() &&
                    m === new Date().getMonth() &&
                    year === new Date().getFullYear();
                  
                  return (
                    <Box
                      key={d}
                      sx={{
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        p: 0.25,
                        borderRadius: '4px',
                        bgcolor: isToday ? 'primary.softBg' : 'transparent',
                        fontWeight: isToday ? 'bold' : 'normal',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'background.level1'
                        }
                      }}
                    >
                      {d}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        {/* Header giorni */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.surface', zIndex: 1 }}>
          <Box sx={{ width: 80, flexShrink: 0 }} /> {/* Spazio per orari */}
          {days.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <Box key={i} sx={{ 
                flex: 1, 
                minWidth: 100,
                p: 1,
                textAlign: 'center',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: isToday ? 'primary.softBg' : 'transparent'
              }}>
                <Typography level="body-xs">{daysOfWeekShort[date.getDay() === 0 ? 6 : date.getDay() - 1]}</Typography>
                <Typography level="body-sm" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                  {date.getDate()}/{date.getMonth() + 1}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {/* Griglia timeline */}
        <Box sx={{ display: 'flex', flex: 1 }}>
          {/* Colonna orari */}
          <Box sx={{ width: 80, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider' }}>
            {hours.map(hour => (
              <Box key={hour} sx={{ height: 60, px: 1, py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography level="body-xs">{`${hour}:00`}</Typography>
              </Box>
            ))}
          </Box>
          
          {/* Giorni */}
          <Box sx={{ display: 'flex', flex: 1 }}>
            {days.map((date, i) => (
              <Box key={i} sx={{ flex: 1, minWidth: 100, borderRight: '1px solid', borderColor: 'divider' }}>
                {hours.map(hour => (
                  <Box 
                    key={hour} 
                    sx={{ 
                      height: 60, 
                      borderTop: '1px solid', 
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'background.level1'
                      }
                    }} 
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="sm" onClick={prevPeriod}>
            <ChevronLeft size={16} />
          </IconButton>
          <Typography level="h4" sx={{ minWidth: 200, textAlign: 'center' }}>
            {getViewTitle()}
          </Typography>
          <IconButton size="sm" onClick={nextPeriod}>
            <ChevronRight size={16} />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button 
              size="sm" 
              variant={view === 'month' ? 'solid' : 'outlined'}
              onClick={() => setView('month')}
            >
              Mese
            </Button>
            <Button 
              size="sm" 
              variant={view === 'week' ? 'solid' : 'outlined'}
              onClick={() => setView('week')}
            >
              Settimana
            </Button>
            <Button 
              size="sm" 
              variant={view === 'day' ? 'solid' : 'outlined'}
              onClick={() => setView('day')}
            >
              Giorno
            </Button>
            <Button 
              size="sm" 
              variant={view === 'year' ? 'solid' : 'outlined'}
              onClick={() => setView('year')}
            >
              Anno
            </Button>
            <Button 
              size="sm" 
              variant={view === 'timeline' ? 'solid' : 'outlined'}
              onClick={() => setView('timeline')}
            >
              Timeline
            </Button>
          </Box>
          <Button startDecorator={<Plus size={16} />} size="sm">
            Nuovo Evento
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {view === 'month' && (
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Days of week */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1,
              mb: 1
            }}>
              {daysOfWeek.map(d => (
                <Typography key={d} level="body-sm" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {d}
                </Typography>
              ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1,
              flex: 1
            }}>
              {renderMonthView()}
            </Box>
          </Box>
        )}
        
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'year' && renderYearView()}
        {view === 'timeline' && renderTimelineView()}
      </Box>
    </Box>
  );
}