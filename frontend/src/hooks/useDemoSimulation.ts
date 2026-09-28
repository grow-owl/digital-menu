import { useState, useEffect } from 'react';

export const useDemoSimulation = () => {
  const [isSimulating, setIsSimulating] = useState(true);
  const [revenue, setRevenue] = useState(4280.5);
  const [orderCount, setOrderCount] = useState(142);
  const [latestEvent, setLatestEvent] = useState<string>('Demo Simulation Mode initialized');

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const addedRevenue = Math.floor(Math.random() * 45) + 15;
      setRevenue((prev) => +(prev + addedRevenue).toFixed(2));
      setOrderCount((prev) => prev + 1);

      const events = [
        `Chef Marco bumped Order #${Math.floor(Math.random() * 80) + 100} to READY`,
        `Table ${Math.floor(Math.random() * 20) + 1} settled ₹${addedRevenue}.00 payment (Credit Card)`,
        `New order placed for VIP Suite ${Math.floor(Math.random() * 4) + 1}`,
        `Guest requested Water Refill at Table ${Math.floor(Math.random() * 15) + 1}`,
        `Reservation confirmed for Baron Rothschild (Party of 4)`
      ];

      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLatestEvent(randomEvent);
    }, 12000); // Trigger live event every 12s

    return () => clearInterval(interval);
  }, [isSimulating]);

  return {
    isSimulating,
    toggleSimulation: () => setIsSimulating(!isSimulating),
    revenue,
    orderCount,
    latestEvent
  };
};
