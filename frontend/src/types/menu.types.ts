export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  imageUrl?: string;
  iconName?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  required: boolean;
  maxSelect?: number;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string;
  price: number; // in Indian Rupees ₹
  imageUrl: string;
  imageGallery?: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isNonVeg?: boolean;
  isGlutenFree: boolean;
  isJain?: boolean;
  isChefSpecial?: boolean;
  isBestSeller?: boolean;
  isPopular?: boolean;
  isUnder300?: boolean;
  spiceLevel?: number; // 0 (None), 1 (Mild), 2 (Medium), 3 (Spicy)
  calories?: number;
  rating?: number;
  reviewCount?: number;
  preparationTimeMinutes: number;
  ingredients?: string[];
  allergens?: string[];
  customizationGroups?: CustomizationGroup[];
}

export interface CartCustomization {
  groupTitle: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId?: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice?: number;
  addonNames?: string[];
  selectedCustomizations?: CartCustomization[];
  specialNotes?: string;
}

export interface Coupon {
  code: string;
  title: string;
  discountAmount: number;
  discountPercentage?: number;
  minOrderAmount: number;
  description: string;
}
