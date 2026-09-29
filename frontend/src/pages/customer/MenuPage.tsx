import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { menuService } from '../../services/menu.service';
import { Category, MenuItem } from '../../types/menu.types';
import { CategoryBar } from '../../components/menu/CategoryBar';
import { FilterChips, ActiveFilter } from '../../components/customer/FilterChips';
import { MenuBrandHeader } from '../../components/menu/MenuBrandHeader';
import { MenuDishesGrid } from '../../components/menu/MenuDishesGrid';
import { MenuFloatingActions } from '../../components/menu/MenuFloatingActions';
import { MenuFloatingCartBar } from '../../components/menu/MenuFloatingCartBar';
import { MenuCustomerModals } from '../../components/menu/MenuCustomerModals';
import { DishDetailModal } from '../../components/menu/DishDetailModal';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { CustomerSidebar } from '../../components/customer/CustomerSidebar';
import { CustomerAuthModal } from '../../components/auth/CustomerAuthModal';
import { CustomerProfileModal } from '../../components/auth/CustomerProfileModal';
import { useCartStore } from '../../store/use-cart-store';
import { useOrderStore } from '../../store/use-order-store';
import { useAuthStore } from '../../store/use-auth-store';
import { useTableStore } from '../../store/use-table-store';
import { useHeaderScrollCollapse } from '../../hooks/useHeaderScrollCollapse';

export const MenuPage: React.FC = () => {
  const { tableId: paramTableId } = useParams<{ tableId?: string }>();
  const activeStoreTableId = useTableStore((state) => state.activeTableId);
  const { user, isAuthenticated, token: authToken } = useAuthStore();

  const isAdmin = React.useMemo(() => {
    if (!isAuthenticated || !authToken || !user) return false;
    const normalizedRole = String(user.role || '').toUpperCase();
    return ['OWNER', 'ADMIN', 'MANAGER', 'RESTAURANT_OWNER'].includes(normalizedRole);
  }, [user, isAuthenticated, authToken]);

  const tableId = activeStoreTableId || paramTableId || (isAdmin ? 'Admin' : '10');
  const navigate = useNavigate();

  // Core Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<ActiveFilter[]>(['ALL']);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Modals & Drawers State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);

  // Status & Dynamic Scroll State
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { isHeaderVisible } = useHeaderScrollCollapse();

  // Stores
  const { addItem, getItemCount, getGrandTotal, clearCart, setTableId: setCartTableId } = useCartStore();
  const { activeOrderId, setActiveOrderId } = useOrderStore();
  const { tableId: sessionTableId, setTableId } = useAuthStore();

  // Sync active URL tableId with AuthStore & CartStore
  useEffect(() => {
    if (tableId) {
      if (tableId !== sessionTableId) {
        setTableId(tableId);
      }
      setCartTableId(tableId);
    }
  }, [tableId]);

  useEffect(() => {
    fetchMenuData();
  }, [selectedCategoryId, searchQuery]);

  const fetchMenuData = async () => {
    if (menuItems.length === 0) {
      setIsLoading(true);
    }
    setFetchError(null);
    try {
      const [catData, itemData] = await Promise.all([
        categories.length === 0 ? menuService.getCategories() : Promise.resolve(categories),
        menuService.getMenuItems({
          categoryId: selectedCategoryId || undefined,
          search: searchQuery || undefined,
        }),
      ]);

      if (categories.length === 0) {
        setCategories(catData);
      }
      setMenuItems(itemData);
    } catch (err: any) {
      console.error('Failed to fetch menu data:', err);
      setFetchError('Unable to connect to kitchen menu services. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFilter = (filter: ActiveFilter) => {
    if (filter === 'ALL') {
      setSelectedFilters(['ALL']);
      return;
    }

    let next: ActiveFilter[] = selectedFilters.filter((f) => f !== 'ALL');
    if (next.includes(filter)) {
      next = next.filter((f) => f !== filter);
    } else {
      if (filter === 'VEG') {
        next = next.filter((f) => f !== 'NON_VEG');
      } else if (filter === 'NON_VEG') {
        next = next.filter((f) => f !== 'VEG' && f !== 'JAIN');
      } else if (filter === 'JAIN') {
        next = next.filter((f) => f !== 'NON_VEG');
      }
      next.push(filter);
    }

    if (next.length === 0) next = ['ALL'];
    setSelectedFilters(next);
  };

  const handleAddToCart = (
    item: MenuItem,
    quantity = 1,
    notes = '',
    unitPrice?: number,
    addonNames?: string[]
  ) => {
    addItem(item, quantity, notes, unitPrice, addonNames);
  };

  const handleResetFilters = () => {
    setSelectedFilters(['ALL']);
    setSearchQuery('');
    setSelectedCategoryId(null);
  };

  // Helper for applying dietary filters
  const applyDietaryFilter = (items: MenuItem[]) => {
    if (selectedFilters.includes('ALL')) return items;
    return items.filter((item) => {
      return selectedFilters.every((f) => {
        if (f === 'VEG') return item.isVegetarian;
        if (f === 'NON_VEG') return item.isNonVeg || !item.isVegetarian;
        if (f === 'JAIN') return item.isJain;
        if (f === 'GF') return item.isGlutenFree;
        if (f === 'SPECIAL') return item.isChefSpecial || item.categoryId === 1;
        if (f === 'BESTSELLER') return item.isBestSeller;
        if (f === 'UNDER300') return item.price <= 300;
        if (f === 'SPICY') return (item.spiceLevel || 0) >= 2;
        return true;
      });
    });
  };

  const filteredItems = applyDietaryFilter(menuItems);

  // Batching & Infinite Scroll
  const BATCH_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedCategoryId, searchQuery, selectedFilters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredItems.length));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredItems.length]);

  return (
    <div className="page-theme-customer min-h-screen flex flex-col bg-[#F4F6F8] text-slate-800 font-sans selection:bg-[#0C831F] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Admin Menu Inspection Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-amber-500/40 px-3.5 py-2 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-black text-[10px] uppercase tracking-wider">
              ADMIN MENU INSPECTION
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Viewing customer digital menu without table QR session
            </span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <span>Return to Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Navigation Header & Category Bar */}
      <div className="sticky top-0 z-30 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-slate-300 shadow-sm">
        <MenuBrandHeader
          isHeaderVisible={isHeaderVisible}
          activeOrderId={activeOrderId}
          cartItemCount={getItemCount()}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <CategoryBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Menu Content Area */}
      <main className="flex-1 pb-44 sm:pb-36 w-full max-w-full overflow-x-hidden">
        {menuItems.length > 0 && (
          <div className="px-2.5 sm:px-6 lg:px-8 max-w-[1560px] mx-auto mt-1.5 mb-2 sm:my-3">
            <FilterChips
              selectedFilters={selectedFilters}
              onToggleFilter={handleToggleFilter}
            />
          </div>
        )}

        <MenuDishesGrid
          tableId={tableId}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          searchQuery={searchQuery}
          menuItemsCount={menuItems.length}
          filteredItems={filteredItems}
          visibleCount={visibleCount}
          isLoading={isLoading}
          fetchError={fetchError}
          sentinelRef={sentinelRef}
          onResetFilters={handleResetFilters}
          onClearCategory={() => setSelectedCategoryId(null)}
          onRetryFetch={fetchMenuData}
          onAddToCart={handleAddToCart}
          onSelectItem={(item) => {
            setSelectedItem(item);
            setIsDetailOpen(true);
          }}
        />
      </main>

      {/* Floating Action Controls */}
      <MenuFloatingActions tableId={tableId} />

      {/* Floating Bottom Cart Bar */}
      <MenuFloatingCartBar
        itemCount={getItemCount()}
        grandTotal={getGrandTotal()}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Dish Customization & Detail Modal */}
      <DishDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableId={tableId}
        onOrderPlaced={(orderId) => {
          setIsCartOpen(false);
          setActiveOrderId(orderId);
          clearCart();
          navigate(`/order/${orderId}`);
        }}
      />

      {/* Customer Sidebar Navigation Drawer */}
      <CustomerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tableId={tableId}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenOffers={() => setIsOffersOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
      />

      {/* Auth & Profile Modals */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        tableId={tableId}
      />

      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Customer Experience Modals */}
      <MenuCustomerModals
        isLoyaltyOpen={isLoyaltyOpen}
        onCloseLoyalty={() => setIsLoyaltyOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isHistoryOpen={isHistoryOpen}
        onCloseHistory={() => setIsHistoryOpen(false)}
        isOffersOpen={isOffersOpen}
        onCloseOffers={() => setIsOffersOpen(false)}
        isGalleryOpen={isGalleryOpen}
        onCloseGallery={() => setIsGalleryOpen(false)}
        isFaqOpen={isFaqOpen}
        onCloseFaq={() => setIsFaqOpen(false)}
        isFeedbackOpen={isFeedbackOpen}
        onCloseFeedback={() => setIsFeedbackOpen(false)}
        activeOrderId={activeOrderId}
      />
    </div>
  );
};
