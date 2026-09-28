import React, { useState, useEffect, useRef } from 'react';
import { DishCard } from './DishCard';
import { MenuItem } from '../../types/menu.types';

interface LazyDishCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onClick: (item: MenuItem) => void;
}

export const LazyDishCard: React.FC<LazyDishCardProps> = ({ item, onAdd, onClick }) => {
  const [isVisible, setIsVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    // Use IntersectionObserver to lazy load the card 200px before scrolling into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Once visible, keep loaded
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="min-h-[220px] sm:min-h-[290px]">
      {isVisible ? (
        <DishCard item={item} onAdd={onAdd} onClick={onClick} />
      ) : (
        <div className="w-full h-44 sm:h-72 bg-white border border-slate-300 rounded-2xl sm:rounded-3xl animate-pulse flex flex-col justify-between p-3.5 sm:p-4 shadow-sm">
          <div className="w-full h-24 sm:h-44 bg-slate-100 rounded-xl" />
          <div className="space-y-2 pt-2">
            <div className="w-3/4 h-3.5 bg-slate-200 rounded-full" />
            <div className="w-1/2 h-3 bg-slate-100 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
export default LazyDishCard;
