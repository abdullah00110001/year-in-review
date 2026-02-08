import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  GripVertical
} from 'lucide-react';

interface DashboardItem {
  id: string;
  label: string;
}

interface ShieldOrganiseDashboardProps {
  onBack: () => void;
  items: DashboardItem[];
  onReorder: (items: DashboardItem[]) => void;
}

export function ShieldOrganiseDashboard({ onBack, items, onReorder }: ShieldOrganiseDashboardProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const defaultItems: DashboardItem[] = [
    { id: 'profiles', label: 'Profiles' },
    { id: 'apps', label: 'Apps Blocked' },
    { id: 'sites', label: 'Sites Blocked' },
    { id: 'keywords', label: 'Keywords Blocked' },
    { id: 'adult', label: 'Block Adult Content' },
    { id: 'reels', label: 'Block Reels/Shorts' },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = displayItems.findIndex(item => item.id === draggedItem);
    const targetIndex = displayItems.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...displayItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    onReorder(newItems);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white px-4 py-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-muted/20 text-white hover:bg-muted/30"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Organise Dashboard</h1>
        </div>
        <p className="text-white/70 text-sm">
          Long press and drag to rearrange items on your dashboard.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {displayItems.map((item) => (
          <Card 
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, item.id)}
            className={`transition-all cursor-move ${
              draggedItem === item.id ? 'opacity-50 scale-95' : ''
            }`}
          >
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">{item.label}</span>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
