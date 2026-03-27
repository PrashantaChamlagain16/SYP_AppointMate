import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const toYmd = (date) => date.toISOString().slice(0, 10);

const nextFiveWeekdays = () => {
  const result = [];
  const cursor = new Date();
  while (result.length < 5) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      result.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const toMinutes = (timeString) => {
  const [hour, minute] = timeString.split(":").map(Number);
  return hour * 60 + minute;
};

const generateSlots = (start, end, duration) => {
  if (!start || !end) return [];
  const slots = [];
  let current = toMinutes(start);
  const finish = toMinutes(end);
  const dur = duration || 30;
  while (current < finish) {
    const hh = String(Math.floor(current / 60)).padStart(2, "0");
    const mm = String(current % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    current += dur;
  }
  return slots;
};

const displaySlot = (value) => {
  const [hRaw, m] = value.split(":");
  let h = Number(hRaw);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const todayYmdLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function BookingSlotPicker({
  doctorId,
  onSelect,
  selectedDate: controlledDate = "",
  selectedTime: controlledTime = "",
}) {
  const [availability, setAvailability] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(controlledDate);
  const [selectedTime, setSelectedTime] = useState(controlledTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError("");
      try {
        const availData = await api.get(`/availability/${doctorId}`);
        setAvailability(availData);
        if (availData) {
          const daysArray = String(availData.available_days || "")
            .split(",")
            .map((d) => d.trim().toLowerCase());
          const next5 = nextFiveWeekdays().filter((d) => {
            const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
            return daysArray.includes(dayName);
          });
          setAvailableDays(next5);
          const slots = generateSlots(availData.start_time, availData.end_time, availData.slot_duration);
          setTimeSlots(slots);
        }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    };
    if (doctorId) fetchAvailability();
  }, [doctorId]);

  useEffect(() => { setSelectedDate(controlledDate); }, [controlledDate]);
  useEffect(() => { setSelectedTime(controlledTime); }, [controlledTime]);

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    onSelect(dateStr, selectedTime);
  };

  const handleTimeClick = (timeStr) => {
    setSelectedTime(timeStr);
    onSelect(selectedDate, timeStr);
  };

  const isPastSlotForToday = (slot) => {
    if (selectedDate !== todayYmdLocal()) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return toMinutes(slot) < currentMins;
  };

  if (loading) return <p className="eyebrow" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>Retrieving clinical availability...</p>;
  if (error) return <p className="err-text" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>{error}</p>;

  return (
    <div className="slot-picker-ethereal" style={{ display: 'grid', gap: 'var(--spacing-8)' }}>
      <div className="picker-section">
        <label className="eyebrow" style={{ marginBottom: 'var(--spacing-4)', display: 'block' }}>Consultation Date</label>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          {availableDays.map((d) => {
            const value = toYmd(d);
            const selected = selectedDate === value;
            return (
              <button key={value} type="button" className={`day-chip ${selected ? "active" : ""}`} onClick={() => handleDateClick(value)}>
                <strong>{d.toLocaleDateString(undefined, { weekday: "short" })}</strong>
                <span>{d.toLocaleDateString(undefined, { day: "numeric" })}</span>
              </button>
            );
          })}
          {availableDays.length === 0 && !loading && <div className="glass-card" style={{ width: '100%', padding: 'var(--spacing-4)', color: '#c62828' }}>No clinical hours scheduled for this period.</div>}
        </div>
      </div>

      <div className="picker-section">
        <label className="eyebrow" style={{ marginBottom: 'var(--spacing-4)', display: 'block' }}>Available Hours</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--spacing-2)' }}>
          {timeSlots.map((slot) => (
            <button key={slot} type="button" disabled={isPastSlotForToday(slot)} className={`time-chip ${selectedTime === slot ? "active" : ""}`} onClick={() => handleTimeClick(slot)}>
              {displaySlot(slot)}
            </button>
          ))}
        </div>
        {!availability && !loading && <div className="glass-card" style={{ width: '100%', padding: 'var(--spacing-4)', color: '#c62828' }}>Availability profile not yet configured by the specialist.</div>}
      </div>
    </div>
  );
}
