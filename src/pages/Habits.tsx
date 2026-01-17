import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, Plus, Trash2, Edit, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string;
  is_active: boolean;
  goal_id: string | null;
}

interface Goal {
  id: string;
  title: string;
  color: string;
}

interface HabitEntry {
  habit_id: string;
  completed: boolean;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
];

export default function Habits() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todayEntries, setTodayEntries] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    color: COLORS[0],
    goal_id: '',
  });
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Auto-open dialog when navigating to /habits/new
  useEffect(() => {
    if (location.pathname === '/habits/new') {
      setIsDialogOpen(true);
      navigate('/habits', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Fetch goals for dropdown
    const { data: goalsData } = await supabase
      .from('goals')
      .select('id, title, color')
      .eq('user_id', user!.id)
      .eq('year', new Date().getFullYear());

    // Fetch today's entries
    const { data: entriesData } = await supabase
      .from('habit_entries')
      .select('habit_id, completed')
      .eq('user_id', user!.id)
      .eq('date', today);

    setHabits(habitsData || []);
    setGoals(goalsData || []);
    
    const entriesMap = new Map<string, boolean>();
    entriesData?.forEach((entry) => {
      entriesMap.set(entry.habit_id, entry.completed);
    });
    setTodayEntries(entriesMap);
    
    setLoading(false);
  };

  const toggleHabit = async (habitId: string) => {
    const currentStatus = todayEntries.get(habitId) || false;
    const newStatus = !currentStatus;

    // Optimistic update
    setTodayEntries(new Map(todayEntries.set(habitId, newStatus)));

    const { error } = await supabase
      .from('habit_entries')
      .upsert({
        user_id: user!.id,
        habit_id: habitId,
        date: today,
        completed: newStatus,
      }, { onConflict: 'habit_id,date' });

    if (error) {
      // Revert on error
      setTodayEntries(new Map(todayEntries.set(habitId, currentStatus)));
      toast.error('Failed to update habit');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }

    setSaving(true);

    if (editingHabit) {
      const { error } = await supabase
        .from('habits')
        .update({
          name: formData.name,
          description: formData.description || null,
          frequency: formData.frequency,
          color: formData.color,
          goal_id: formData.goal_id || null,
        })
        .eq('id', editingHabit.id);

      if (error) {
        toast.error('Failed to update habit');
      } else {
        toast.success('Habit updated!');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('habits').insert({
        user_id: user!.id,
        name: formData.name,
        description: formData.description || null,
        frequency: formData.frequency,
        color: formData.color,
        goal_id: formData.goal_id || null,
      });

      if (error) {
        toast.error('Failed to create habit');
      } else {
        toast.success('Habit created!');
        fetchData();
      }
    }

    setSaving(false);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete habit');
    } else {
      toast.success('Habit deleted');
      setHabits(habits.filter((h) => h.id !== id));
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      color: habit.color,
      goal_id: habit.goal_id || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingHabit(null);
    setFormData({ name: '', description: '', frequency: 'daily', color: COLORS[0], goal_id: '' });
  };

  const completedCount = habits.filter((h) => todayEntries.get(h.id)).length;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-headline font-bold tracking-tight">Habits</h1>
            <p className="mt-1 text-body text-muted-foreground">
              {completedCount} of {habits.length} completed today
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingHabit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
                <DialogDescription>
                  {editingHabit ? 'Update your habit details' : 'Add a new habit to track daily'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Habit Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Morning meditation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add more details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {goals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Goal (optional)</Label>
                    <Select value={formData.goal_id} onValueChange={(v) => setFormData({ ...formData, goal_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No goal</SelectItem>
                        {goals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full transition-transform ${
                          formData.color === color ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : habits.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-subtitle font-semibold">No habits yet</h3>
              <p className="mb-4 text-center text-caption text-muted-foreground">
                Start by creating your first habit to track
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const isCompleted = todayEntries.get(habit.id) || false;
              return (
                <Card
                  key={habit.id}
                  className={cn(
                    'group transition-all',
                    isCompleted && 'bg-muted/50'
                  )}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
                      >
                        {isCompleted ? (
                          <CheckCircle2
                            className="h-7 w-7"
                            style={{ color: habit.color }}
                          />
                        ) : (
                          <Circle
                            className="h-7 w-7 text-muted-foreground"
                          />
                        )}
                      </button>
                      <div>
                        <h3
                          className={cn(
                            'font-medium transition-all',
                            isCompleted && 'text-muted-foreground line-through'
                          )}
                        >
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-caption text-muted-foreground">
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(habit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(habit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}