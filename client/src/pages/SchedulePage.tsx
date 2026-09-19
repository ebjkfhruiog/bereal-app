import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { ScreenHeader } from '../components/NavShell';
import { Button, Card, EmptyState, IconButton, Spinner } from '../components/ui';
import { CategoryBadge } from '../components/CategoryBadge';
import { Sheet } from '../components/Sheet';
import { EventForm, type EventFormValues } from '../components/EventForm';
import { EventsApi } from '../lib/resources';
import type { ScheduleEvent } from '../lib/types';
import { eventsOnDate } from '../lib/eventOccurs';
import { addDays, formatTime12h, friendlyDayLabel, todayStr } from '../lib/datetime';
import { useToastStore } from '../store/toast';

export default function SchedulePage() {
  const push = useToastStore((s) => s.push);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);

  async function load() {
    const { events } = await EventsApi.list();
    setEvents(events);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const dayEvents = useMemo(
    () => eventsOnDate(events, selectedDate).sort((a, b) => (a.startTime < b.startTime ? -1 : 1)),
    [events, selectedDate]
  );

  async function handleCreate(values: EventFormValues) {
    await EventsApi.create(values);
    await load();
    setCreating(false);
    push('Added to your schedule.', 'success');
  }

  async function handleUpdate(values: EventFormValues) {
    if (!editing) return;
    await EventsApi.update(editing.id, values);
    await load();
    setEditing(null);
    push('Event updated.', 'success');
  }

  async function handleDelete(id: string) {
    await EventsApi.remove(id);
    await load();
    setEditing(null);
    push('Event removed.', 'success');
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <ScreenHeader
        title="Schedule"
        subtitle="What's already claiming your time"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner />
        </div>
      ) : dayEvents.length === 0 ? (
        <Card>
          <EmptyState
            icon="🗓️"
            title={`Nothing on ${friendlyDayLabel(selectedDate).toLowerCase()}`}
            subtitle="Add school, sports, work, or anything else that takes up time."
            action={
              <Button variant="secondary" onClick={() => setCreating(true)}>
                <Plus size={16} /> Add an event
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {dayEvents.map((ev) => (
            <Card key={ev.id} className="p-4 flex items-center gap-3">
              <div className="w-20 shrink-0 text-xs font-bold text-ink-500 leading-tight">
                {formatTime12h(ev.startTime)}
                <br />
                {formatTime12h(ev.endTime)}
              </div>
              <div className="w-px self-stretch bg-ink-100" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-800 truncate">{ev.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={ev.category} />
                  {ev.recurrence !== 'none' && (
                    <span className="text-[11px] text-ink-400 font-medium">{ev.recurrence === 'weekly' ? 'Weekly' : 'Daily'}</span>
                  )}
                </div>
              </div>
              <IconButton onClick={() => setEditing(ev)} aria-label="Edit">
                <Pencil size={16} />
              </IconButton>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <Sheet title="Add to your schedule" onClose={() => setCreating(false)}>
          <EventForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Sheet>
      )}

      {editing && (
        <Sheet title="Edit event" onClose={() => setEditing(null)}>
          <EventForm event={editing} submitLabel="Save changes" onSubmit={handleUpdate} />
          <button
            onClick={() => handleDelete(editing.id)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-red-600 py-2"
          >
            <Trash2 size={15} /> Delete this event
          </button>
        </Sheet>
      )}
    </div>
  );
}

function DateStrip({ selectedDate, onSelect }: { selectedDate: string; onSelect: (d: string) => void }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayStr(), i - 2)), []);
  return (
    <div className="flex items-center gap-1">
      <IconButton onClick={() => onSelect(addDays(selectedDate, -1))} aria-label="Previous day" className="shrink-0">
        <ChevronLeft size={18} />
      </IconButton>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1">
        {days.map((d) => {
          const date = new Date(d + 'T00:00:00');
          const active = d === selectedDate;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={`shrink-0 w-14 rounded-2xl py-2 flex flex-col items-center transition-colors ${
                active ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-100'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase opacity-80">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="text-base font-bold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
      <IconButton onClick={() => onSelect(addDays(selectedDate, 1))} aria-label="Next day" className="shrink-0">
        <ChevronRight size={18} />
      </IconButton>
    </div>
  );
}
