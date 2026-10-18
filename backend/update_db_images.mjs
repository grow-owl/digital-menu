import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Map of updates by DB item id or name
const UPDATES = [
  // 19 New Local Photos:
  { id: 204, name: 'Espresso Tonic', imageUrl: '/images/menu/espresso_tonic.png' },
  { id: 206, name: 'Iced Americano', imageUrl: '/images/menu/iced_americano.png' },
  { id: 207, name: 'Iced Spanish Latte', imageUrl: '/images/menu/iced_spanish_latte.png' },
  { id: 208, name: 'Iced Caramel Macchiato', imageUrl: '/images/menu/iced_caramel_macchiato.png' },
  { id: 209, name: 'Affogato', imageUrl: '/images/menu/affogato.png' },
  { id: 602, name: 'Veg Cheese Corn Sandwich', imageUrl: '/images/menu/veg_cheese_corn_sandwich.png' },
  { id: 604, name: 'Tandoori Chicken Cheese Sandwich', imageUrl: '/images/menu/tandoori_chicken_cheese_sandwich.png' },
  { id: 902, name: 'Egg Chowmein', imageUrl: '/images/menu/egg_chowmein.png' },
  { id: 903, name: 'Chicken Chowmein', imageUrl: '/images/menu/chicken_chowmein.png' },
  { id: 904, name: 'Chicken Egg Chowmein', imageUrl: '/images/menu/chicken_egg_chowmein.png' },
  { id: 905, name: 'Chicken Double Egg Chowmein', imageUrl: '/images/menu/chicken_double_egg_chowmein.png' },
  { id: 1102, name: 'Masala Coke / Sprite', imageUrl: '/images/menu/masala_coke.png' },
  { id: 1108, name: 'Green Apple Mojito', imageUrl: '/images/menu/green_apple_mojito.png' },
  { id: 1110, name: 'Kala Khatta Mocktail', imageUrl: '/images/menu/kala_khatta_mocktail.png' },
  { id: 1203, name: 'Pineapple Lassi', imageUrl: '/images/menu/pineapple_lassi.png' },
  { id: 1305, name: 'Matcha Frappe', imageUrl: '/images/menu/matcha_frappe.png' },
  { id: 1306, name: 'Strawberry Frappe', imageUrl: '/images/menu/strawberry_frappe.png' },
  { id: 9902, name: 'Extra Cheese Topping', imageUrl: '/images/menu/extra_cheese_topping.png' },
  { id: 9903, name: 'Extra Grilled Chicken', imageUrl: '/images/menu/extra_grilled_chicken.png' },

  // Other items:
  { id: 202, name: 'Cold Coffee', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80' },
  { id: 205, name: 'Americano', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
  { id: 301, name: 'Butterscotch Cream Shake', imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80' },
  { id: 302, name: 'Banana Honey Cream Shake', imageUrl: '/images/menu/banana_honey_shake.jpg' },
  { id: 303, name: 'Pineapple Delight Shake', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
  { id: 305, name: 'Oreo Blast Shake', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { id: 306, name: 'Kitkat Crunch Shake', imageUrl: '/images/menu/kitkat_crunch_shake.png' },
  { id: 308, name: 'Strawberry Delight Shake', imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80' },
  { id: 309, name: 'Blueberry Cream Shake', imageUrl: '/images/menu/blueberry_cream_shake.png' },
  { id: 401, name: 'Nutty Taro Boba Tea', imageUrl: '/images/menu/nutty_taro_boba.jpg' },
  { id: 402, name: 'Coffee Mocha Boba Tea', imageUrl: '/images/menu/coffee_mocha_boba.png' },
  { id: 403, name: 'Blueberry Boba Tea', imageUrl: '/images/menu/blueberry_frappe.jpg' },
  { id: 404, name: 'Matcha Boba Tea', imageUrl: '/images/menu/matcha_boba_tea.png' },
  { id: 405, name: 'Hazelnut Boba Tea', imageUrl: '/images/menu/hazelnut_boba.png' },
  { id: 104, name: 'Honey Ginger Black Tea', imageUrl: '/images/menu/honey_ginger_black_tea.png' },
  { id: 501, name: 'Iced Matcha Latte', imageUrl: '/images/menu/iced_matcha_latte.png' },
  { id: 502, name: 'Vanilla Matcha Latte', imageUrl: '/images/menu/vanilla_matcha_latte.png' },
  { id: 503, name: 'Strawberry Matcha Latte', imageUrl: '/images/menu/strawberry_matcha_latte.png' },
  { id: 504, name: 'Mango Matcha Latte', imageUrl: '/images/menu/mango_matcha_latte.png' },
  { id: 603, name: 'Chicken Cheese Sandwich', imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=800&q=80' },
  { id: 705, name: 'Peri Peri Fries', imageUrl: '/images/menu/peri_peri_fries.png' },
  { id: 706, name: 'Loaded Fries', imageUrl: '/images/menu/loaded_fries.png' },
  { id: 802, name: 'Paneer Pops (10 pcs)', imageUrl: '/images/menu/paneer_pops.jpg' },
  { id: 803, name: 'Cheesy Pizza Fingers', imageUrl: '/images/menu/cheesy_pizza_fingers.jpg' },
  { id: 804, name: 'Potato Cheese Bites', imageUrl: '/images/menu/potato_cheese_bites.png' },
  { id: 805, name: 'Paneer Chilly (8 pcs)', imageUrl: '/images/menu/paneer_chilly.jpg' },
  { id: 806, name: 'Chicken Pakora (8 pcs)', imageUrl: '/images/menu/chicken_pakora.png' },
  { id: 807, name: 'Chicken Chilly (8 pcs)', imageUrl: '/images/menu/chicken_chilli.png' },
  { id: 808, name: 'Chicken Wings (5 pcs)', imageUrl: '/images/menu/chicken_wings.png' },
  { id: 901, name: 'Veg Chowmein', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },
  { id: 1001, name: 'Veg Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
  { id: 1002, name: 'Chicken Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
  { id: 1003, name: 'Chicken Egg Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { id: 1004, name: 'Mixed Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
  { id: 1006, name: 'Chicken Cutlet (3 pcs)', imageUrl: '/images/menu/chicken_cutlet.png' },
  { id: 1104, name: 'Red Bull Energy Drink', imageUrl: '/images/menu/red_bull_energy_drink.png' },
  { id: 1105, name: 'Green Mint Cooler', imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80' },
  { id: 1107, name: 'Blue Lagoon', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { id: 1201, name: 'Sweet Lassi', imageUrl: '/images/menu/sweet_lassi.jpg' },
  { id: 1202, name: 'Mango Lassi', imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80' },
  { id: 1204, name: 'Strawberry Lassi', imageUrl: '/images/menu/strawberry_lassi.jpg' },
  { id: 1205, name: 'Banana Lassi', imageUrl: '/images/menu/banana_lassi.jpg' },
  { id: 1301, name: 'Oreo Frappe', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { id: 1302, name: 'Biscoff Frappe', imageUrl: '/images/menu/biscoff_frappe.jpg' },
  { id: 1303, name: 'Caramel Frappe', imageUrl: '/images/menu/caramel_frappe.jpg' },
  { id: 1304, name: 'Coffee Mocha Frappe', imageUrl: '/images/menu/coffee_mocha_frappe.jpg' },
  { id: 1307, name: 'Blueberry Frappe', imageUrl: '/images/menu/blueberry_frappe.jpg' },
  { id: 1308, name: 'Mango Frappe', imageUrl: '/images/menu/mango_frappe.jpg' },
  { id: 1401, name: 'Arrabbiata Pasta (Veg)', imageUrl: '/images/menu/arrabbiata_pasta_veg.jpg' },
  { id: 1402, name: 'Arrabbiata Pasta (Chicken)', imageUrl: '/images/menu/arrabbiata_pasta_chicken.jpg' },
  { id: 1404, name: 'Alfredo Pasta (Chicken)', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80' },
  { id: 9904, name: 'Ice Cream Add On (1 scoop)', imageUrl: '/images/menu/ice_cream_1scoop.jpg' },
];

async function updateDb() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
  const collection = mongoose.connection.db.collection('menuitems');

  let updatedCount = 0;
  for (const item of UPDATES) {
    const res = await collection.updateOne(
      { $or: [{ id: item.id }, { name: item.name }] },
      { $set: { imageUrl: item.imageUrl } }
    );
    if (res.modifiedCount > 0 || res.matchedCount > 0) {
      updatedCount++;
      console.log(`[UPDATED] ${item.id} - ${item.name} -> ${item.imageUrl}`);
    } else {
      console.log(`[NOT FOUND] ${item.id} - ${item.name}`);
    }
  }

  console.log(`Successfully updated ${updatedCount} items in MongoDB.`);
  process.exit(0);
}

updateDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
