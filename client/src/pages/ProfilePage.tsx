import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { ScreenHeader } from '../components/NavShell';
import { Button, Card } from '../components/ui';
import { FieldLabel, TextInput } from '../components/formFields';
import { AuthApi } from '../lib/resources';
import { useAuth } from '../store/AuthContext';
import { useToastStore } from '../store/toast';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const [name, setName] = useState(user?.name ?? '');
  const [grade, setGrade] = useState(user?.grade ?? '');
  const [wakeTime, setWakeTime] = useState(user?.studyWindowStart ?? '07:00');
  const [sleepTime, setSleepTime] = useState(user?.studyWindowEnd ?? '22:30');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { user: updated } = await AuthApi.update({ name, grade, studyWindowStart: wakeTime, studyWindowEnd: sleepTime });
      updateUser(updated);
      push('Profile updated.', 'success');
    } catch {
      push('Could not save changes.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Profile" subtitle="Your account and preferences" />

      <Card className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center font-display font-bold text-xl shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink-800 truncate">{user?.name}</p>
          <p className="text-sm text-ink-500 truncate">{user?.email}</p>
        </div>
      </Card>

      {!user?.isPremium ? (
        <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-none flex items-center justify-between gap-3">
          <div>
            <p className="font-display font-bold">Get Stubby+</p>
            <p className="text-brand-100 text-xs mt-0.5">Remove ads & unlock stats — $5 once.</p>
          </div>
          <Button variant="accent" size="sm" onClick={() => navigate('/upgrade')} className="shrink-0">
            <Sparkles size={14} /> Upgrade
          </Button>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 bg-mint-500/10 border-mint-500/20">
          <Sparkles size={18} className="text-mint-600" />
          <p className="text-sm font-semibold text-mint-700">You're on Stubby+ — thanks for supporting Stubby.</p>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <p className="font-display font-bold text-ink-800">Account</p>
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Grade</FieldLabel>
          <TextInput value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Usually awake by</FieldLabel>
            <TextInput type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Usually asleep by</FieldLabel>
            <TextInput type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-ink-400">Stubby only ever schedules study sessions inside this window.</p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Card>

      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="flex items-center justify-center gap-2 text-sm font-semibold text-red-600 py-3"
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}
