import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Map of updates by DB item id or name
const UPDATES = [
  // Circled items from earlier:
  { id: 202, name: 'Cold Coffee', imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80' },
  { id: 204, name: 'Espresso Tonic', imageUrl: 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=800&q=80' },
  { id: 205, name: 'Americano', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
  { id: 206, name: 'Iced Americano', imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80' },
  { id: 207, name: 'Iced Spanish Latte', imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80' },
  { id: 208, name: 'Iced Caramel Macchiato', imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80' },
  { id: 209, name: 'Affogato', imageUrl: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?auto=format&fit=crop&w=800&q=80' },
  { id: 301, name: 'Butterscotch Cream Shake', imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80' },
  { id: 302, name: 'Banana Honey Cream Shake', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
  { id: 303, name: 'Pineapple Delight Shake', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
  { id: 305, name: 'Oreo Blast Shake', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { id: 306, name: 'Kitkat Crunch Shake', imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=800&q=80' },
  { id: 308, name: 'Strawberry Delight Shake', imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80' },
  { id: 309, name: 'Blueberry Cream Shake', imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80' },
  { id: 401, name: 'Nutty Taro Boba Tea', imageUrl: '/images/menu/nutty_taro_boba.jpg' },
  { id: 402, name: 'Coffee Mocha Boba Tea', imageUrl: 'https://images.unsplash.com/photo-1558857563-b37fe8184f94?auto=format&fit=crop&w=800&q=80' },
  { id: 403, name: 'Blueberry Boba Tea', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
  { id: 404, name: 'Matcha Boba Tea', imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80' },
  { id: 501, name: 'Iced Matcha Latte', imageUrl: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80' },
  { id: 502, name: 'Vanilla Matcha Latte', imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80' },
  { id: 503, name: 'Strawberry Matcha Latte', imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80' },
  { id: 504, name: 'Mango Matcha Latte', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
  { id: 602, name: 'Veg Cheese Corn Sandwich', imageUrl: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&w=800&q=80' },
  { id: 603, name: 'Chicken Cheese Sandwich', imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=800&q=80' },
  { id: 705, name: 'Peri Peri Fries', imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
  { id: 706, name: 'Loaded Fries', imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80' },
  { id: 802, name: 'Paneer Pops (10 pcs)', imageUrl: '/images/menu/paneer_pops.jpg' },
  { id: 803, name: 'Cheesy Pizza Fingers', imageUrl: '/images/menu/cheesy_pizza_fingers.jpg' },

  // Items from latest screenshots:
  // 1. Screenshot 1 Items:
  { id: 804, name: 'Potato Cheese Bites', imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80' },
  { id: 805, name: 'Paneer Chilly (8 pcs)', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80' },
  { id: 806, name: 'Chicken Pakora (8 pcs)', imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80' },
  { id: 807, name: 'Chicken Chilly (8 pcs)', imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80' },
  { id: 808, name: 'Chicken Wings (5 pcs)', imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80' },
  { id: 901, name: 'Veg Chowmein', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },
  { id: 902, name: 'Egg Chowmein', imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80' },
  { id: 903, name: 'Chicken Chowmein', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
  { id: 904, name: 'Chicken Egg Chowmein', imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80' },
  { id: 905, name: 'Chicken Double Egg Chowmein', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },

  // 2. Screenshot 2 Items:
  { id: 1001, name: 'Veg Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
  { id: 1002, name: 'Chicken Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
  { id: 1003, name: 'Chicken Egg Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { id: 1004, name: 'Mixed Fried Rice', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80' },
  { id: 1006, name: 'Chicken Cutlet (3 pcs)', imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80' },
  { id: 1102, name: 'Masala Coke / Sprite', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80' },
  { id: 1104, name: 'Red Bull Energy Drink', imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80' },

  // 3. Screenshot 3 Items:
  { id: 1105, name: 'Green Mint Cooler', imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80' },
  { id: 1107, name: 'Blue Lagoon', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { id: 1108, name: 'Green Apple Mojito', imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80' },
  { id: 1110, name: 'Kala Khatta Mocktail', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
  { id: 1201, name: 'Sweet Lassi', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80' },
  { id: 1202, name: 'Mango Lassi', imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80' },
  { id: 1203, name: 'Pineapple Lassi', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80' },
  { id: 1204, name: 'Strawberry Lassi', imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80' },

  // 4. Screenshot 4 Items:
  { id: 1205, name: 'Banana Lassi', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
  { id: 1302, name: 'Biscoff Frappe', imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=800&q=80' },
  { id: 1303, name: 'Caramel Frappe', imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80' },
  { id: 1304, name: 'Coffee Mocha Frappe', imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { id: 1305, name: 'Matcha Frappe', imageUrl: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80' },
  { id: 1306, name: 'Strawberry Frappe', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80' },
  { id: 1307, name: 'Blueberry Frappe', imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80' },

  // 5. Screenshot 5 Items:
  { id: 1401, name: 'Arrabbiata Pasta (Veg)', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281744?auto=format&fit=crop&w=800&q=80' },
  { id: 1404, name: 'Alfredo Pasta (Chicken)', imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80' },
  { id: 9902, name: 'Extra Cheese Topping', imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80' },
  { id: 9903, name: 'Extra Grilled Chicken', imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80' },
  { id: 9904, name: 'Ice Cream Add On (1 scoop)', imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80' },
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
