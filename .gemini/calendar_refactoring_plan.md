# Piano di Implementazione - Refactoring Elemento Calendario

## Panoramica del Progetto

**Obiettivo:** Trasformare l'elemento Calendario in un'entità versatile con supporto per diverse tipologie di evento, proprietà avanzate e metadati personalizzabili.

**Data:** 20 Gennaio 2026

---

## 1. Aggiornamento Schema Dati

### 1.1 Struttura Attuale (da preservare)
```typescript
// Struttura corrente del block calendar
{
  id: string,
  type: 'calendar',
  content: string,
  metadata: {
    startDate: string,        // ISO datetime
    endDate: string,          // ISO datetime
    title: string,
    infoSpaceId: string,      // Collegamento alla pagina Info
    displayMode: string,
    updatedAt: number
  }
}
```

### 1.2 Nuova Struttura Proposta
```typescript
// Definizione TypeScript per il nuovo schema
interface CalendarEventMetadata {
  // === CORE (esistente) ===
  startDate: string;                    // ISO datetime "yyyy-MM-dd'T'HH:mm"
  endDate: string;                      // ISO datetime
  title: string;
  infoSpaceId?: string;                 // Link alla pagina Info/Notes
  displayMode?: 'card' | 'compact' | 'minimal';
  updatedAt?: number;

  // === TIPO EVENTO (nuovo) ===
  eventType: 'event' | 'task' | 'timeblock' | 'meeting' | 'deadline';
  
  // === TASK-SPECIFIC (nuovo) ===
  isCompleted?: boolean;                 // Solo per type='task'
  completedAt?: number;                  // Timestamp completamento
  
  // === TIME & LOCATION (nuovo - WIP) ===
  timezone?: string;                     // IANA timezone (es. "Europe/Rome")
  location?: {
    text?: string;                       // Indirizzo testuale
    coordinates?: { lat: number; lng: number };  // GPS (futuro)
  };

  // === PARTECIPANTI (nuovo - WIP) ===
  attendees?: Array<{
    id: string;
    name: string;
    email?: string;
    status?: 'pending' | 'accepted' | 'declined' | 'tentative';
  }>;

  // === NOTIFICHE (nuovo) ===
  reminders?: Array<{
    id: string;
    offsetMinutes: number;              // -10 = 10 min prima, -60 = 1 ora prima
    type: 'notification' | 'email';     // Tipo di reminder
    enabled: boolean;
  }>;

  // === RICORRENZA (nuovo) ===
  recurrence?: {
    pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval?: number;                  // Ogni N giorni/settimane/etc
    endDate?: string;                   // Fine ricorrenza
    endAfterOccurrences?: number;       // O dopo N occorrenze
    daysOfWeek?: number[];              // 0-6 per weekly (0=domenica)
    dayOfMonth?: number;                // Per monthly
    exceptions?: string[];              // Date da escludere (ISO)
  };
  parentRecurrenceId?: string;          // ID dell'evento "master" se è un'istanza
  isRecurrenceException?: boolean;      // Se è un'eccezione modificata

  // === PROPRIETÀ CUSTOM (nuovo) ===
  customProperties?: Array<{
    id: string;
    key: string;
    value: string | number | boolean | string[];
    type: 'text' | 'number' | 'checkbox' | 'select' | 'multiselect' | 'date' | 'url';
  }>;

  // === RELAZIONI (nuovo) ===
  projectId?: string;                   // Link a Project Element
  linkedSpaces?: string[];              // Array di spaceId collegati
  tags?: string[];                      // Tag per categorizzazione
  
  // === STYLING (nuovo) ===
  color?: string;                       // Colore personalizzato (#hex)
  icon?: string;                        // Nome icona Lucide
}
```

### 1.3 File da Creare: `src/types/CalendarTypes.ts`

Creeremo un file dedicato per le definizioni TypeScript, esportando:
- `CalendarEventType` - Union type dei tipi evento
- `CalendarEventMetadata` - Interface completa
- `CalendarReminder` - Interface per notifiche
- `CalendarRecurrence` - Interface per ricorrenza
- `CalendarCustomProperty` - Interface per proprietà custom
- Helper functions per validazione e defaults

---

## 2. Logica di Gestione Tipologie Evento

### 2.1 Event Types e Comportamenti

| Tipo | Checkbox | Stile Grafico | Icona | Comportamento Speciale |
|------|----------|---------------|-------|------------------------|
| `event` | ❌ | Standard (filled) | Calendar | Default, nessuno |
| `task` | ✅ | Bordo-only quando completato | CheckSquare | Checkbox funzionale, strikethrough on complete |
| `timeblock` | ❌ | Semitrasparente (30% opacity) | Clock | Non interrompibile, background |
| `meeting` | ❌ | Gradient premium | Users | Mostra partecipanti |
| `deadline` | ❌ | Linea verticale/marker | AlertTriangle | Visualizzato come marker/linea |

### 2.2 Rendering Condizionale (Elemento "A")

```typescript
// Pseudocodice per il rendering
function getEventStyle(event: CalendarEvent) {
  switch(event.metadata.eventType) {
    case 'task':
      return {
        showCheckbox: true,
        opacity: event.metadata.isCompleted ? 0.5 : 1,
        textDecoration: event.metadata.isCompleted ? 'line-through' : 'none',
        borderStyle: 'solid',
        icon: 'CheckSquare'
      };
    case 'timeblock':
      return {
        showCheckbox: false,
        opacity: 0.35,
        pattern: 'diagonal-stripes',  // CSS pattern
        icon: 'Clock'
      };
    case 'meeting':
      return {
        showCheckbox: false,
        gradient: 'linear-gradient(135deg, primary, primary-dark)',
        showAttendees: true,
        icon: 'Users'
      };
    case 'deadline':
      return {
        displayMode: 'marker',  // Linea verticale invece di box
        icon: 'AlertTriangle',
        accent: 'danger'
      };
    default: // 'event'
      return {
        showCheckbox: false,
        standard: true,
        icon: 'Calendar'
      };
  }
}
```

### 2.3 File da Modificare per Event Types

1. **`CalendarApp.tsx`** - Componenti di rendering eventi:
   - `DraggableCalendarEvent`
   - `DraggableMultiDayEvent`
   - `DraggableTimelineEvent`
   - Funzione `calculateTimelineLayout`

2. **Nuova utility:** `src/utils/calendarEventStyles.ts`
   - Funzioni helper per stili e icone
   - Costanti per colori e pattern

---

## 3. Piano di Aggiornamento Interfacce

### 3.1 Viste Calendario

#### Month View
- **Elemento "A":** Aggiungere icona tipo + checkbox per tasks
- **Tasks:** Checkbox cliccabile inline
- **Deadlines:** Marker rosso sulla data
- **Timeblocks:** Render semitrasparente

#### Week/Day/N-Days Views
- **Stessa logica del Month** applicata ai blocchi timeline
- **Deadlines:** Linea orizzontale attraverso la colonna giorno

#### List View
- Già supporta checkbox tramite `SortableListItem`
- Aggiungere filtro per `eventType`
- Colonna icona tipo

#### Year View
- Solo indicatori colorati (dots) differenziati per tipo

### 3.2 Popover di Creazione (Quick Create)

**Modifiche minime alla struttura esistente:**

```
┌────────────────────────────────────┐
│  [Titolo Input]                    │
│  ─────────────────                 │
│                                    │
│  [Tipo: ▼ Event] ← NUOVO dropdown  │
│                                    │
│  [Start datetime] [End datetime]   │
│                                    │
│  [More details]  [Create Event]    │
└────────────────────────────────────┘
```

- Aggiungere Select per `eventType` sotto il titolo
- Mantenere layout compatto esistente
- Default: 'event'

### 3.3 Popover di Modifica (Edit Popover - Elemento "A")

**Layout proposto (rispettando struttura esistente):**

```
┌─────────────────────────────────────────┐
│  ☐ Checkbox (solo per task)  [X]       │
│                                         │
│  [Titolo editabile]                     │
│  ─────────────────                      │
│                                         │
│  📅 [Tipo icona] Event ▼                │
│                                         │
│  🕐 Start: [datetime-local]             │
│  🕐 End:   [datetime-local]             │
│                                         │
│  📍 Location: [input] (WIP badge)       │
│  🌐 Timezone: [select] (WIP badge)      │
│                                         │
│  ─── AVANZATE (collapsible) ───         │
│                                         │
│  🔔 Reminders: [+ Add]                  │
│     • 10 min before [x]                 │
│     • 1 hour before [x]                 │
│                                         │
│  🔄 Repeat: [None ▼]                    │
│                                         │
│  👥 Attendees: (WIP)                    │
│                                         │
│  🏷️ Custom Properties: [+ Add]          │
│     • Priority: High                    │
│                                         │
│  📁 Project: [Select project]           │
│                                         │
│  ─────────────────────────────────      │
│  [Open Info ↗]  [Delete 🗑]             │
└─────────────────────────────────────────┘
```

### 3.4 Modal Dettagli (Full Modal)

Il modal esistente (`isOpen` / `onOpen`) verrà esteso con tabs:
1. **Generale** - Titolo, date, tipo, location, timezone
2. **Avanzate** - Reminders, recurrence, attendees
3. **Proprietà** - Custom properties, project link, tags
4. **Note** - Embedded PageEditor per Info space

### 3.5 Spaces Integration

Gli elementi calendar in PageEditor/CanvasSpace mostreranno:
- Icona appropriata per tipo
- Badge colorato per stato (completed, upcoming, overdue)
- Checkbox funzionale per tasks

---

## 4. Ordine di Implementazione (Fasi)

### Fase 1: Schema Dati e Types (1-2 ore)
1. Creare `src/types/CalendarTypes.ts` con tutte le interface
2. Creare `src/utils/calendarEventStyles.ts` con helper
3. Aggiornare `handleCreateEvent` per includere `eventType: 'event'` come default

### Fase 2: Event Type Selection (1-2 ore)
1. Aggiungere Select `eventType` al popover di creazione
2. Aggiungere Select `eventType` al popover di modifica
3. Testare creazione eventi con diversi tipi

### Fase 3: Rendering Condizionale (2-3 ore)
1. Modificare `DraggableCalendarEvent` per stili per tipo
2. Modificare `DraggableMultiDayEvent` per stili per tipo
3. Modificare `DraggableTimelineEvent` per stili per tipo
4. Implementare checkbox funzionale per tasks
5. Implementare render deadline come marker

### Fase 4: Reminders System (1-2 ore)
1. UI per aggiungere/rimuovere reminders nel popover
2. Logica di storage dei reminders
3. (Futuro) Sistema di notifiche browser

### Fase 5: Recurrence Logic (2-3 ore)
1. UI per selezione pattern ricorrenza
2. Funzione `expandRecurrence()` per generare istanze virtuali
3. Gestione eccezioni e modifiche singola istanza

### Fase 6: Custom Properties (1-2 ore)
1. UI per add/edit/delete proprietà custom
2. Storage nel metadata
3. Display nelle viste calendario (tooltip/popover)

### Fase 7: WIP Features (placeholder)
1. Location field (solo testo, senza mappa)
2. Timezone selector (UI only, no conversion logic)
3. Attendees list (UI only, no invites)

---

## 5. File Impattati

### Nuovi File
- `src/types/CalendarTypes.ts`
- `src/utils/calendarEventStyles.ts`

### File da Modificare
- `src/components/apps/CalendarApp.tsx` - Principale
- `src/components/apps/SortableListItem.tsx` - List view
- `src/components/spaces/PageEditor.tsx` - Calendar blocks
- `src/components/spaces/CanvasSpace.tsx` - Calendar blocks
- `src/components/spaces/TextElement.tsx` - Inline calendar

### Nessuna Modifica
- Sidebar.tsx
- WelcomePage.tsx
- Global styles

---

## 6. Migration Strategy

Per eventi esistenti senza `eventType`:
```typescript
// Nel rendering, fallback safe
const eventType = event.metadata?.eventType || 'event';
```

Non è necessaria migrazione di dati - backward compatible.

---

## 7. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Performance con molti eventi ricorrenti | Media | Alto | Virtualizzazione, lazy expansion |
| Breaking changes UI popover | Bassa | Medio | Mantenere layout esistente, solo aggiunte |
| Complessità recurrence logic | Alta | Alto | Libreria `rrule` o implementazione semplificata |
| State management complexity | Media | Medio | Continuare con pattern refs attuali |

---

## 8. Domande Aperte per Approvazione

1. **Recurrence:** Usare libreria `rrule` (robusta, 15kb) o implementazione custom semplificata?

2. **Reminders:** Le notifiche devono funzionare anche a browser chiuso (service worker) o solo in-app?

3. **Deadlines:** Preferisci linea verticale attraverso tutto il giorno o marker triangolare sulla timeline?

4. **Custom Properties:** Schema libero (any key/value) o set predefinito di proprietà configurabili?

5. **Attendees (WIP):** Solo nomi testuali o integrazione con sistema utenti futuro?

---

**Attendo approvazione del piano e risposte alle domande aperte prima di procedere.**
