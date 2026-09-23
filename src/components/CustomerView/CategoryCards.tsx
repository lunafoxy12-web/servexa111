import React from 'react';
import { Category } from '../../types';
import { Zap, Wrench, Paintbrush, Sparkles, Cog, Thermometer, Truck, Car, Utensils, Stethoscope } from 'lucide-react';

interface CategoryCardsProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
}

interface CategoryThemeConfig {
  borderHover: string;
  bgTint: string;
  badgeBg: string;
  badgeText: string;
  actionText: string;
}

const CATEGORY_THEMES: Record<string, CategoryThemeConfig> = {
  'cat-doctor': {
    borderHover: 'hover:border-teal-400 hover:ring-2 hover:ring-teal-100',
    bgTint: 'bg-teal-50/30',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeText: 'Health Clinic',
    actionText: 'text-teal-700'
  },
  'cat-food': {
    borderHover: 'hover:border-orange-400 hover:ring-2 hover:ring-orange-100',
    bgTint: 'bg-orange-50/30',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeText: 'Gourmet Food',
    actionText: 'text-orange-700'
  },
  'cat-taxi': {
    borderHover: 'hover:border-amber-400 hover:ring-2 hover:ring-amber-100',
    bgTint: 'bg-amber-50/30',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Express Rides',
    actionText: 'text-amber-700'
  },
  'cat-electrician': {
    borderHover: 'hover:border-yellow-400 hover:ring-2 hover:ring-yellow-100',
    bgTint: 'bg-yellow-50/30',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeText: 'Power & Wiring',
    actionText: 'text-yellow-700'
  },
  'cat-plumber': {
    borderHover: 'hover:border-sky-400 hover:ring-2 hover:ring-sky-100',
    bgTint: 'bg-sky-50/30',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    badgeText: 'Water & Pipes',
    actionText: 'text-sky-700'
  },
  'cat-painter': {
    borderHover: 'hover:border-rose-400 hover:ring-2 hover:ring-rose-100',
    bgTint: 'bg-rose-50/30',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeText: 'Interior & Walls',
    actionText: 'text-rose-700'
  },
  'cat-cleaner': {
    borderHover: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100',
    bgTint: 'bg-emerald-50/30',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Deep Clean',
    actionText: 'text-emerald-700'
  },
  'cat-mechanic': {
    borderHover: 'hover:border-purple-400 hover:ring-2 hover:ring-purple-100',
    bgTint: 'bg-purple-50/30',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Auto Repair',
    actionText: 'text-purple-700'
  },
  'cat-hvac': {
    borderHover: 'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100',
    bgTint: 'bg-indigo-50/30',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeText: 'AC & Climate',
    actionText: 'text-indigo-700'
  },
  'cat-courier': {
    borderHover: 'hover:border-amber-400 hover:ring-2 hover:ring-amber-100',
    bgTint: 'bg-amber-50/30',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Fast Courier',
    actionText: 'text-amber-700'
  }
};

const DEFAULT_THEME: CategoryThemeConfig = {
  borderHover: 'hover:border-sky-400 hover:ring-2 hover:ring-sky-100',
  bgTint: 'bg-slate-50/50',
  badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
  badgeText: 'Specialist',
  actionText: 'text-sky-700'
};

export const CategoryCards: React.FC<CategoryCardsProps> = ({ categories, onSelectCategory }) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-sky-500" />;
      case 'Paintbrush':
        return <Paintbrush className="w-5 h-5 text-rose-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'Cog':
        return <Cog className="w-5 h-5 text-purple-500" />;
      case 'Thermometer':
        return <Thermometer className="w-5 h-5 text-indigo-500" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-amber-600" />;
      case 'Car':
        return <Car className="w-5 h-5 text-amber-500" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-teal-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Specialists & Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a specialist for instant 15-second dispatch and live chat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat) => {
          const theme = CATEGORY_THEMES[cat.id] || DEFAULT_THEME;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 ${theme.borderHover} shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden text-left cursor-pointer transform hover:-translate-y-1 focus:outline-hidden`}
            >
              {/* Character Visual Stage with unique soft pastel tint - shorter height */}
              <div className={`relative w-full h-24 sm:h-28 ${theme.bgTint} overflow-hidden flex items-center justify-center p-2`}>
                {cat.characterImage ? (
                  <img
                    src={cat.characterImage}
                    alt={cat.name}
                    className="max-h-20 sm:max-h-24 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 drop-shadow-xs"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center">
                    {getCategoryIcon(cat.icon)}
                  </div>
                )}

                {/* Trade Indicator Badge */}
                <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1 z-10">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">
                    Ready
                  </span>
                </div>
              </div>

              {/* Title & Short Action */}
              <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="p-1 rounded-md bg-slate-50 shrink-0">
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {cat.name}
                    </h3>
                  </div>

                  {cat.characterAction && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {cat.characterAction}
                    </p>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`font-bold ${theme.actionText} flex items-center gap-1.5`}>
                    Get Service →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
