import { Category, MenuItem } from '../../types/menu.types';
import { SILIGURI_CATEGORIES } from './categories';
import { TEA_AND_COFFEE_ITEMS } from './teaCoffee';
import { MATCHA_BOBA_SHAKES_ITEMS } from './matchaBobaShakes';
import { BURGERS_SANDWICHES_ITEMS } from './burgersSandwiches';
import { APPETISERS_FRIES_ITEMS } from './appetisersFries';
import { NOODLES_RICE_ITEMS } from './noodlesRice';
import { COOLERS_LASSI_ITEMS } from './coolersLassi';
import { PASTA_DESSERTS_SPECIALS_ITEMS } from './pastaDessertsSpecials';

export { SILIGURI_CATEGORIES } from './categories';
export { TEA_AND_COFFEE_ITEMS } from './teaCoffee';
export { MATCHA_BOBA_SHAKES_ITEMS } from './matchaBobaShakes';
export { BURGERS_SANDWICHES_ITEMS } from './burgersSandwiches';
export { APPETISERS_FRIES_ITEMS } from './appetisersFries';
export { NOODLES_RICE_ITEMS } from './noodlesRice';
export { COOLERS_LASSI_ITEMS } from './coolersLassi';
export { PASTA_DESSERTS_SPECIALS_ITEMS } from './pastaDessertsSpecials';

export const SILIGURI_MENU_ITEMS: MenuItem[] = [
  ...TEA_AND_COFFEE_ITEMS,
  ...MATCHA_BOBA_SHAKES_ITEMS,
  ...BURGERS_SANDWICHES_ITEMS,
  ...APPETISERS_FRIES_ITEMS,
  ...NOODLES_RICE_ITEMS,
  ...COOLERS_LASSI_ITEMS,
  ...PASTA_DESSERTS_SPECIALS_ITEMS,
];
