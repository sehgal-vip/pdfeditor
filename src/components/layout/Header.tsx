import {
  HelpCircle, Sun, Moon, Monitor,
  Scissors, Layers, ArrowUpDown, Trash2, FileOutput, FilePlus,
  RotateCw, Maximize, Hash, Type, Lock, Unlock, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TOOLS, CATEGORIES } from '@/lib/constants';
import { useAppStore } from '@/stores/appStore';
import { useProcessingStore } from '@/stores/processingStore';
import { useFileStore } from '@/stores/fileStore';
import { useThemeStore } from '@/stores/themeStore';

const iconMap: Record<string, LucideIcon> = {
  Scissors, Layers, ArrowUpDown, Trash2, FileOutput, FilePlus,
  RotateCw, Maximize, Hash, Type, Lock, Unlock, FileText,
};

const categoryDotMap: Record<string, string> = {
  'blue-500': 'bg-blue-500',
  'amber-500': 'bg-amber-500',
  'purple-500': 'bg-purple-500',
  'red-500': 'bg-red-500',
  'green-500': 'bg-green-500',
  'teal-500': 'bg-teal-500',
  'orange-500': 'bg-orange-500',
};

const categoryIconColorMap: Record<string, string> = {
  'blue-500': 'text-blue-500',
  'amber-500': 'text-amber-500',
  'purple-500': 'text-purple-500',
  'red-500': 'text-red-500',
  'green-500': 'text-green-500',
  'teal-500': 'text-teal-500',
  'orange-500': 'text-orange-500',
};

const grouped = Object.entries(CATEGORIES).map(([key, cat]) => ({
  key,
  ...cat,
  tools: TOOLS.filter((t) => t.category === key),
}));

interface HeaderProps {
  onShowShortcuts: () => void;
}

const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const;
const themeOrder: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];

export function Header({ onShowShortcuts }: HeaderProps) {
  const { currentToolId, setView } = useAppStore();
  const { mode, setMode } = useThemeStore();

  const handleNavigate = (toolId: string) => {
    const status = useProcessingStore.getState().status;
    const hasFiles = useFileStore.getState().currentFiles.length > 0;
    if (status === 'processing') {
      if (!window.confirm('You have work in progress. Leave this page?')) {
        return;
      }
    } else if (hasFiles) {
      if (!window.confirm('You have a file loaded. Leave this tool?')) {
        return;
      }
    }
    setView('tool', toolId);
  };

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(mode);
    setMode(themeOrder[(idx + 1) % themeOrder.length]);
  };
  const ThemeIcon = themeIcons[mode];

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Quire</h1>

      <div className="flex items-center gap-1">
        <nav className="hidden md:flex items-center gap-1">
          {grouped.map((group) => (
            <div className="relative group" key={group.key}>
              <button
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                aria-haspopup="true"
              >
                <span className={`w-2 h-2 rounded-full ${categoryDotMap[group.color]}`} />
                {group.label}
              </button>

              <div className="absolute top-full right-0 hidden group-hover:block pt-1 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[220px]">
                  {group.tools.map((tool) => {
                    const Icon = iconMap[tool.icon];
                    const isActive = currentToolId === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleNavigate(tool.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {Icon && <Icon size={16} className={`shrink-0 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : categoryIconColorMap[tool.categoryColor]}`} />}
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{tool.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
          aria-label={`Theme: ${mode}`}
        >
          <ThemeIcon size={20} />
        </button>

        <button
          onClick={onShowShortcuts}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
}
