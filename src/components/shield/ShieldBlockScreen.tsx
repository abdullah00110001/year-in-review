import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Shadcn Textarea
import { 
  ArrowLeft,
  Check,
  X,
  Crown,
  Upload,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BlockScreenOption {
  id: string;
  background: string;
  isPremium?: boolean;
  isCustom?: boolean;
}

interface ShieldBlockScreenProps {
  onBack: () => void;
  // এখন আর প্রপস থেকে selectedScreen দরকার নেই, আমরা লোকাল স্টোরেজ ইউজ করব
}

export function ShieldBlockScreen({ onBack }: ShieldBlockScreenProps) {
  const [selectedScreen, setSelectedScreen] = useState('default');
  const [customText, setCustomText] = useState('Stay Focused on your GOALS, your PEACE & your HAPPINESS...');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blockScreens: BlockScreenOption[] = [
    { id: 'default', background: 'bg-gradient-to-br from-violet-300 to-violet-400' },
    { id: 'ocean', background: 'bg-gradient-to-br from-cyan-400 to-blue-500', isPremium: true },
    { id: 'sunset', background: 'bg-gradient-to-br from-cyan-300 to-pink-400', isPremium: true },
    { id: 'nature', background: 'bg-gradient-to-br from-violet-200 to-violet-300', isPremium: true },
    { id: 'minimal', background: 'bg-gradient-to-br from-pink-300 to-rose-400', isPremium: true },
    { id: 'custom', background: 'bg-slate-800', isCustom: true, isPremium: true }, // Custom one at the end
  ];

  // 🟢 Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('shield_block_screen_theme');
    const savedText = localStorage.getItem('shield_block_screen_text');
    const savedImage = localStorage.getItem('shield_block_screen_image');

    if (savedTheme) setSelectedScreen(savedTheme);
    if (savedText) setCustomText(savedText);
    if (savedImage) setCustomImage(savedImage);
  }, []);

  // 🟢 Save preferences whenever they change
  const handleSelectScreen = (id: string) => {
    setSelectedScreen(id);
    localStorage.setItem('shield_block_screen_theme', id);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCustomText(newText);
    localStorage.setItem('shield_block_screen_text', newText);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomImage(base64String);
        localStorage.setItem('shield_block_screen_image', base64String);
        toast.success("Custom background updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 🟢 Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white px-4 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Block Screen Style</h1>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-6">
        
        {/* 🟢 Custom Text Editor Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Type className="h-4 w-4 text-primary" />
              Custom Motivation Message
            </h3>
          </div>
          <Textarea 
            value={customText}
            onChange={handleTextChange}
            placeholder="Type your custom motivation here..."
            className="resize-none h-20 bg-muted/50 border-border/50 focus-visible:ring-primary/50 text-sm font-medium"
          />
          <p className="text-[10px] text-muted-foreground">This text will appear when you try to open a blocked app.</p>
        </div>

        <div className="h-px bg-border/50 w-full" />

        {/* 🟢 Themes Grid */}
        <div className="grid grid-cols-2 gap-4">
          {blockScreens.map((screen) => (
            <Card 
              key={screen.id}
              className={cn(
                'relative overflow-hidden cursor-pointer transition-all aspect-[3/4] shadow-sm hover:shadow-md',
                selectedScreen === screen.id ? 'ring-4 ring-primary scale-[0.98]' : 'ring-1 ring-border/50 hover:scale-[1.02]'
              )}
              onClick={() => handleSelectScreen(screen.id)}
            >
              <CardContent className={cn('p-0 h-full w-full relative', screen.background)}>
                
                {/* 🟢 Background Image Logic for Custom Theme */}
                {screen.isCustom && customImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${customImage})` }} 
                  />
                )}
                
                {/* Dark Overlay for Custom Image to make text readable */}
                {screen.isCustom && customImage && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                )}

                <div className="absolute inset-0 p-4 flex flex-col z-10">
                  {/* Top Bar (App Icon & Close) */}
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-extrabold">SF</span>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* Quote Preview */}
                  <div className="mt-4">
                    <p className="text-white text-xs font-semibold leading-relaxed drop-shadow-md line-clamp-4">
                      {customText || "Stay Focused..."}
                    </p>
                  </div>

                  {/* Center Status Icon */}
                  <div className="flex-1 flex items-center justify-center">
                    {selectedScreen === screen.id ? (
                      <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                    ) : screen.isPremium ? (
                      <div className="h-12 w-12 rounded-full bg-amber-500/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                    ) : null}
                  </div>

                  {/* Custom Upload Button */}
                  {screen.isCustom && (
                    <div className="mt-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/20 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents card selection when clicking upload
                          handleSelectScreen(screen.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {customImage ? 'Change Image' : 'Upload Image'}
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
