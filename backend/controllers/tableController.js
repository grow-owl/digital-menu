import crypto from 'crypto';
import Table from '../models/Table.js';
import TableSession from '../models/TableSession.js';
import Order from '../models/Order.js';
import WaiterAlert from '../models/WaiterAlert.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper to generate unique session ID
const generateSessionId = () => `SESS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// In-memory & DB synchronized Waiter Alerts queue for instant cross-device dispatch
let globalWaiterAlerts = [];

// @desc    Get all tables with session details (Tables 1 to 30)
// @route   GET /api/tables
// @access  Public / Staff
export const getAllTables = asyncHandler(async (req, res) => {
  const validTableNumbers = Array.from({ length: 30 }, (_, i) => String(i + 1));
  
  await Table.deleteMany({ tableNumber: { $nin: validTableNumbers } }).catch(() => {});

  let tables = await Table.find({ tableNumber: { $in: validTableNumbers } });
  
  if (tables.length < 30) {
    const existingNumbers = new Set(tables.map(t => String(t.tableNumber)));
    const tablesToCreate = [];

    for (let i = 1; i <= 30; i++) {
      const numStr = String(i);
      if (!existingNumbers.has(numStr)) {
        tablesToCreate.push({
          tableNumber: numStr,
          capacity: i % 4 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
          status: 'available',
          qrToken: `table-${numStr}`,
        });
      }
    }

    if (tablesToCreate.length > 0) {
      await Table.insertMany(tablesToCreate);
      tables = await Table.find({ tableNumber: { $in: validTableNumbers } });
    }
  }

  tables.sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber));

  const tablesWithSessions = await Promise.all(tables.map(async (table) => {
    if (table.status === 'cleaning' && table.cleaningStartedAt) {
      const elapsedMs = Date.now() - new Date(table.cleaningStartedAt).getTime();
      if (elapsedMs >= 2.5 * 60 * 1000) {
        table.status = 'available';
        table.cleaningStartedAt = null;
        table.guestCount = 0;
        await table.save().catch(() => {});
      }
    }

    // Ensure permanent QR token is persisted
    const effectiveQrToken = table.qrToken || `table-${table.tableNumber}`;
    if (!table.qrToken) {
      table.qrToken = effectiveQrToken;
      await table.save().catch(() => {});
    }

    const activeSession = await TableSession.findOne({ tableId: table._id, status: 'active' }).populate('orders');
    
    let orderTotal = 0;
    let guestCount = 0;
    let activeOrderId = null;
    let orderStatus = null;

    if (activeSession) {
      guestCount = table.guestCount || (activeSession.users ? activeSession.users.length : 0);
      if (activeSession.orders && activeSession.orders.length > 0) {
        const unpaidOrders = activeSession.orders.filter((o) => o && o.paymentStatus !== 'PAID' && o.status !== 'cancelled');
        if (unpaidOrders.length > 0) {
          const latestOrder = unpaidOrders[unpaidOrders.length - 1];
          activeOrderId = latestOrder.orderId;
          orderStatus = latestOrder.status;
          orderTotal = unpaidOrders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);

          if (table.status === 'available') {
            table.status = 'occupied';
            await table.save().catch(() => {});
          }
        }
      }
    }

    if (table.status === 'available' || table.status === 'cleaning') {
      guestCount = 0;
    }

    const isStaff = req.user && ['owner', 'chef'].includes((req.user.role || '').toLowerCase());

    return {
      _id: table._id,
      tableNumber: Number(table.tableNumber),
      status: table.status,
      orderStatus,
      capacity: table.capacity || 4,
      activeOrderId,
      orderTotal,
      guestCount,
      qrToken: isStaff ? effectiveQrToken : undefined,
      cleaningStartedAt: table.cleaningStartedAt
    };
  }));

  res.json({ data: tablesWithSessions });
});

// @desc    Validate QR Code token and retrieve/create an active table session
// @route   POST /api/tables/validate
// @access  Public
export const validateTableQr = asyncHandler(async (req, res) => {
  const { tableNumber, token, userId } = req.body;
  const cleanNum = String(tableNumber || '').match(/\d+/)?.[0] || String(tableNumber || '1');
  
  let table = await Table.findOne({ tableNumber: cleanNum });
  if (!table) {
    table = await Table.create({
      tableNumber: cleanNum,
      capacity: 4,
      status: 'available',
      qrToken: token || `table-${cleanNum}`,
    });
  }

  // Permissive token validation for physical printed stand cards
  const isValidToken = !token ||
    token === 'demo-token' ||
    token === 'table-token' ||
    token === table.qrToken ||
    token === `table-${cleanNum}` ||
    token === `tok_${cleanNum}` ||
    token === cleanNum ||
    String(token).match(/\d+/)?.[0] === cleanNum;

  if (!isValidToken && table.qrToken && table.qrToken !== token) {
    return res.status(401).json({ message: 'Invalid QR Code for this table.' });
  }

  if (!table.qrToken) {
    table.qrToken = token || `table-${cleanNum}`;
    await table.save().catch(() => {});
  }

  let session = await TableSession.findOne({ tableId: table._id, status: 'active' }).populate('users');
  
  if (!session) {
    session = await TableSession.create({
      tableId: table._id,
      sessionId: generateSessionId(),
      users: userId ? [userId] : [],
    });
    if (table.status === 'available') {
    table.status = 'occupied';
      await table.save().catch(() => {});
    }
  } else {
    if (userId && !session.users.some(u => u._id?.toString() === userId || u.toString() === userId)) {
      session.users.push(userId);
      await session.save().catch(() => {});
    }
  }

  res.json({ data: { tableNumber: table.tableNumber, qrToken: table.qrToken, session } });
});

// @desc    Scan Table QR Code by opaque token (Never fails, permanent resolution)
// @route   ALL /api/tables/scan/:token
// @access  Public
export const scanTableQr = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.body?.userId || req.query?.userId;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing table QR token.' });
  }

  const cleanToken = String(token).trim();

  // Multi-tier resolution so any printed QR code physically placed on tables NEVER breaks:
  // 1. Direct match on stored qrToken
  let table = await Table.findOne({ qrToken: cleanToken });

  // 2. Direct match on tableNumber (e.g. /dine/5)
  if (!table) {
    table = await Table.findOne({ tableNumber: cleanToken });
  }

  // 3. Extract table digits (e.g. "table-5", "tok_5", "tbl-5", "tok_aura_tbl_05_secure")
  const numMatch = cleanToken.match(/\d+/);
  if (!table && numMatch) {
    const parsedNum = String(parseInt(numMatch[0], 10));
    table = await Table.findOne({
      $or: [{ tableNumber: parsedNum }, { tableNumber: numMatch[0] }]
    });
  }

  // 4. ObjectId match if 24-hex string
  if (!table && cleanToken.match(/^[0-9a-fA-F]{24}$/)) {
    table = await Table.findById(cleanToken).catch(() => null);
  }

  // 5. Demo/test token fallback to Table 1
  if (!table && (cleanToken.toLowerCase().includes('demo') || cleanToken.toLowerCase().includes('test') || cleanToken === 'table-token')) {
    table = await Table.findOne({ tableNumber: '1' });
  }

  // 6. Auto-create table if digits extracted but table row missing in database (only 1-30)
  if (!table && numMatch) {
    const parsedNumVal = parseInt(numMatch[0], 10);
    if (!isNaN(parsedNumVal) && parsedNumVal >= 1 && parsedNumVal <= 30) {
      const parsedNum = String(parsedNumVal);
      table = await Table.create({
        tableNumber: parsedNum,
        capacity: Number(parsedNum) % 4 === 0 ? 6 : Number(parsedNum) % 2 === 0 ? 4 : 2,
        status: 'available',
        qrToken: cleanToken.startsWith('table-') ? cleanToken : `table-${parsedNum}`,
      });
    }
  }

  // 7. Ultimate safety fallback to Table 1
  if (!table) {
    table = await Table.findOne({ tableNumber: '1' });
  }

  if (!table) {
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired table QR code. Please scan the official QR code placed on your dining table.'
    });
  }

  let session = await TableSession.findOne({ tableId: table._id, status: 'active' }).populate('users');
  if (!session) {
    session = await TableSession.create({
      tableId: table._id,
      sessionId: generateSessionId(),
      users: userId ? [userId] : [],
    });
    if (table.status === 'available') {
      table.status = 'occupied';
      table.guestCount = table.guestCount || 2;
      await table.save().catch(() => {});
    }
  } else {
    if (userId && !session.users.some(u => u._id?.toString() === userId || u.toString() === userId)) {
      session.users.push(userId);
      await session.save().catch(() => {});
    }
  }

  res.json({
    success: true,
    data: {
      tableNumber: String(table.tableNumber),
      qrToken: table.qrToken,
      sessionId: session.sessionId,
      capacity: table.capacity,
      status: table.status,
      session
    }
  });
});

// @desc    Get QR Token for specific table number (Permanent & Immutable)
// @route   GET /api/tables/qr-token/:tableNumber
// @access  Public
export const getTableQrToken = asyncHandler(async (req, res) => {
  const cleanTableNum = String(req.params.tableNumber || '').match(/\d+/)?.[0] || '1';
  let table = await Table.findOne({ tableNumber: cleanTableNum });

  if (!table) {
    table = await Table.create({
      tableNumber: cleanTableNum,
      capacity: Number(cleanTableNum) % 4 === 0 ? 6 : Number(cleanTableNum) % 2 === 0 ? 4 : 2,
      status: 'available',
      qrToken: `table-${cleanTableNum}`
    });
  } else if (!table.qrToken) {
    table.qrToken = `table-${cleanTableNum}`;
    await table.save().catch(() => {});
  }

  res.json({
    success: true,
    data: {
      tableNumber: table.tableNumber,
      qrToken: table.qrToken
    }
  });
});

// @desc    Lock / Confirm permanent QR token for physical table stands
// @route   POST /api/tables/:tableId/rotate-qr, POST /api/tables/rotate-qr/:tableId
// @access  Private / Manager
export const rotateTableQrToken = asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  const cleanTableNum = String(tableId || '').match(/\d+/)?.[0] || '1';
  const isObjectId = String(tableId).match(/^[0-9a-fA-F]{24}$/);

  const table = await Table.findOne({
    $or: [{ tableNumber: cleanTableNum }, { _id: isObjectId ? tableId : null }]
  });

  if (!table) {
    return res.status(404).json({ success: false, message: 'Table not found.' });
  }

  // Preserve token permanently — printed physical QR stand cards NEVER break
  if (!table.qrToken) {
    table.qrToken = `table-${table.tableNumber}`;
    await table.save().catch(() => {});
  }

  res.json({
    success: true,
    message: `Table ${table.tableNumber} QR code is permanent and locked for physical printing.`,
    data: {
      tableNumber: table.tableNumber,
      qrToken: table.qrToken
    }
  });
});

// @desc    Get table session details (PII Masked for public/diners)
// @route   GET /api/tables/session/:sessionId
// @access  Public / Staff
export const getSessionDetails = asyncHandler(async (req, res) => {
  const session = await TableSession.findOne({ sessionId: req.params.sessionId })
    .populate('orders')
    .populate('users', 'name phone');
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const isStaff = req.user && ['owner', 'chef'].includes((req.user.role || '').toLowerCase());
  const sessionObj = session.toObject ? session.toObject() : { ...session };

  if (!isStaff) {
    if (Array.isArray(sessionObj.users)) {
      sessionObj.users = sessionObj.users.map(u => {
        const isSelf = req.user && String(req.user._id) === String(u._id);
        if (isSelf) return u;
        const clean = String(u.phone || '').replace(/\D/g, '');
        return {
          ...u,
          phone: clean.length >= 4 ? `******${clean.slice(-4)}` : '******'
        };
      });
    }
    if (Array.isArray(sessionObj.orders)) {
      sessionObj.orders = sessionObj.orders.map(o => {
        if (!o) return o;
        const ord = o.toObject ? o.toObject() : { ...o };
        const clean = String(ord.customerPhone || '').replace(/\D/g, '');
        ord.customerPhone = clean.length >= 4 ? `******${clean.slice(-4)}` : '******';
        return ord;
      });
    }
  }

  res.json({ data: sessionObj });
});

// @desc    Request bill / checkout session
// @route   POST /api/tables/checkout, POST /api/tables/session/:sessionId/checkout
// @access  Public
export const checkoutTableSession = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId || req.body.sessionId;
  const { tableNumber, tableId } = req.body;
  const identifier = String(tableNumber || tableId || '10');

  const isValidObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
  const table = await Table.findOne({
    $or: [{ tableNumber: identifier }, { _id: isValidObjectId ? identifier : null }]
  });

  const tableQueryId = table ? String(table.tableNumber) : identifier;
  const allTableOrders = await Order.find({
    $or: [
      { tableId: tableQueryId },
      { tableId: `table/${tableQueryId}/menu` },
      { tableId: `table-${tableQueryId}` },
      { tableId: identifier }
    ],
    paymentStatus: { $ne: 'PAID' },
    status: { $ne: 'cancelled' }
  });

  if (allTableOrders.length === 0) {
    return res.status(400).json({
      message: `No active orders found for Table ${tableQueryId}. Please place an order first before requesting the bill.`
    });
  }

  const pendingOrders = allTableOrders.filter((ord) => ['received', 'preparing', 'ready'].includes(ord.status));

  if (pendingOrders.length > 0) {
    return res.status(400).json({
      message: `Cannot request final bill yet! You have ${pendingOrders.length} order(s) still being prepared in the kitchen. Please wait until your food is served.`
    });
  }

  const finalTotal = allTableOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  if (table) {
    table.status = 'billing';
    await table.save();
  }

  let session = null;
  if (table) {
    session = await TableSession.findOne({ tableId: table._id, status: 'active' });
  }
  if (session) {
    session.status = 'completed';
    session.totalAmount = finalTotal;
    session.endTime = new Date();
    await session.save();
  }

  res.json({
    data: { finalTotal, orderCount: allTableOrders.length },
    message: `Bill of ₹${finalTotal.toFixed(2)} requested successfully for Table ${tableQueryId}! Your waiter will be right with you.`
  });
});

// @desc    Update Table status
// @route   PUT /api/tables/:tableId/status, PUT /api/tables/status/:tableId
// @access  Private / Staff
export const updateTableStatus = asyncHandler(async (req, res) => {
  const { tableId } = req.params;
  const { status, guestCount } = req.body;

  const allowedStatuses = ['available', 'occupied', 'billing', 'cleaning', 'reserved', 'maintenance'];
  const validStatus = allowedStatuses.includes(status) ? status : 'available';

  const isValidObjectId = String(tableId).match(/^[0-9a-fA-F]{24}$/);
  const queryConditions = [{ tableNumber: String(tableId) }];
  if (isValidObjectId) {
    queryConditions.push({ _id: tableId });
  }

  let table = await Table.findOne({ $or: queryConditions });

  if (!table) {
    if (validStatus === 'billing') {
      return res.status(400).json({ message: `Cannot set status to billing for an empty table. Guests must be seated first.` });
    }
    table = await Table.create({
      tableNumber: String(tableId),
      status: validStatus,
      guestCount: validStatus === 'occupied' ? (guestCount || 2) : 0,
      qrToken: crypto.randomBytes(16).toString('hex'),
    });
  } else {
    if (validStatus === 'available') {
      const cleanNum = String(table.tableNumber);
      const directUnpaidOrders = await Order.find({
        $or: [
          { tableId: cleanNum },
          { tableId: `table/${cleanNum}/menu` },
          { tableId: `table-${cleanNum}` },
          { tableId: String(table._id) }
        ],
        paymentStatus: { $ne: 'PAID' },
        status: { $ne: 'cancelled' }
      });

      if (directUnpaidOrders.length > 0) {
        return res.status(400).json({
          message: `Cannot set Table ${table.tableNumber} to Available: Active unpaid orders exist (${directUnpaidOrders.length} active order). Please settle bill or cancel order first.`
        });
      }
    }

    if (validStatus === 'billing' && table.status === 'available') {
      return res.status(400).json({ message: `Cannot set Table ${table.tableNumber} to billing. Table is currently available with no active order.` });
    }

    table.status = validStatus;

    if (validStatus === 'cleaning') {
      table.cleaningStartedAt = new Date();
      table.guestCount = 0;
    } else if (validStatus === 'occupied') {
      table.guestCount = guestCount || table.guestCount || 2;
      table.cleaningStartedAt = null;
    } else if (validStatus === 'billing') {
      table.cleaningStartedAt = null;
    } else if (validStatus === 'available') {
      table.guestCount = 0;
      table.cleaningStartedAt = null;
      await TableSession.updateMany(
        { tableId: table._id, status: 'active' },
        { status: 'completed', endTime: new Date() }
      ).catch(() => {});
    }
    await table.save();
  }

  res.json({
    success: true,
    message: `Table ${table.tableNumber} status updated to ${table.status}`,
    data: table
  });
});

// @desc    Create waiter call alert
// @route   POST /api/tables/call-waiter
// @access  Public
export const callWaiter = asyncHandler(async (req, res) => {
  const { tableId, reason } = req.body;
  const cleanTableNum = String(tableId || '').match(/\d+/)?.[0] || String(tableId || '1');
  const alertId = Date.now();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cleanReason = String(reason || 'Call Waiter to Table').slice(0, 150).trim();

  const newAlert = {
    id: alertId,
    tableId: cleanTableNum,
    tableNumber: cleanTableNum,
    reason: cleanReason,
    timestamp: timeStr,
    status: 'PENDING',
  };

  globalWaiterAlerts.unshift(newAlert);
  if (globalWaiterAlerts.length > 50) globalWaiterAlerts.pop();

  try {
    await WaiterAlert.create({
      id: alertId,
      tableId: cleanTableNum,
      tableNumber: cleanTableNum,
      reason: reason || 'Call Waiter to Table',
      timestamp: timeStr,
      status: 'PENDING',
    });
  } catch (dbErr) {
    console.warn('WaiterAlert MongoDB create warning:', dbErr.message);
  }

  try {
    let table = await Table.findOne({ tableNumber: cleanTableNum });
    if (table) {
      table.activeWaiterCall = {
        reason: newAlert.reason,
        timestamp: timeStr,
        status: 'PENDING',
      };
      if (reason && reason.toLowerCase().includes('bill')) {
        table.status = 'billing';
      }
      await table.save();
    }
  } catch (tblErr) {
    console.warn('Table update for waiter call warning:', tblErr.message);
  }

  res.json({ success: true, data: newAlert });
});

// @desc    Get all active waiter calls
// @route   GET /api/tables/waiter-calls
// @access  Public / Staff
export const getWaiterCalls = asyncHandler(async (req, res) => {
  let dbAlerts = [];
  try {
    dbAlerts = await WaiterAlert.find().sort({ createdAt: -1 }).limit(50).lean();
  } catch (e) {
    // DB fallback
  }

  if (dbAlerts && dbAlerts.length > 0) {
    globalWaiterAlerts = dbAlerts.map(a => ({
      id: a.id,
      tableId: a.tableId || a.tableNumber,
      tableNumber: a.tableNumber || a.tableId,
      reason: a.reason,
      timestamp: a.timestamp,
      status: a.status,
    }));
    return res.json({ data: globalWaiterAlerts });
  }

  res.json({ data: globalWaiterAlerts });
});

// @desc    Resolve waiter call
// @route   PUT /api/tables/waiter-calls/:id/resolve
// @access  Private / Staff
export const resolveWaiterCall = asyncHandler(async (req, res) => {
  const alertId = Number(req.params.id);
  globalWaiterAlerts = globalWaiterAlerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a);

  let targetTableNum = null;
  const foundInMemory = globalWaiterAlerts.find(a => a.id === alertId);
  if (foundInMemory) targetTableNum = foundInMemory.tableNumber || foundInMemory.tableId;

  try {
    const updatedDbAlert = await WaiterAlert.findOneAndUpdate(
      { id: alertId },
      { status: 'RESOLVED', resolvedAt: new Date() },
      { new: true }
    );
    if (updatedDbAlert) {
      targetTableNum = updatedDbAlert.tableNumber || updatedDbAlert.tableId;
    }
  } catch (dbErr) {
    console.warn('WaiterAlert DB resolve warning:', dbErr.message);
  }

  if (targetTableNum) {
    try {
      const cleanTableNum = String(targetTableNum).match(/\d+/)?.[0] || String(targetTableNum);
      const table = await Table.findOne({ tableNumber: cleanTableNum });
      if (table && table.activeWaiterCall) {
        table.activeWaiterCall = undefined;
        await table.save();
      }
    } catch (tblErr) {
      console.warn('Table activeWaiterCall clear warning:', tblErr.message);
    }
  }

  res.json({ success: true, data: globalWaiterAlerts });
});

// @desc    Get table by table number
// @route   GET /api/tables/table-number/:tableNumber
// @access  Public / Staff
export const getTableByNumber = asyncHandler(async (req, res) => {
  const cleanTableNum = String(req.params.tableNumber || '').match(/\d+/)?.[0] || '1';
  const table = await Table.findOne({ tableNumber: cleanTableNum });
  if (!table) return res.status(404).json({ message: 'Table not found' });

  const isStaff = req.user && ['owner', 'chef'].includes((req.user.role || '').toLowerCase());
  const tableData = table.toObject ? table.toObject() : { ...table };
  if (!isStaff) {
    delete tableData.qrToken;
  }
  res.json({ data: tableData });
});

// @desc    Get shared table cart
// @route   GET /api/tables/table-number/:tableNumber/cart
// @access  Public
export const getTableCart = asyncHandler(async (req, res) => {
  const cleanTableNum = String(req.params.tableNumber || '').match(/\d+/)?.[0] || '1';
  const table = await Table.findOne({ tableNumber: cleanTableNum });
  if (!table) return res.json({ data: [] });

  const session = await TableSession.findOne({ tableId: table._id, status: 'active' });
  if (!session) return res.json({ data: [] });

  res.json({ data: session.activeCart || [] });
});

// @desc    Update shared table cart
// @route   PUT /api/tables/table-number/:tableNumber/cart
// @access  Public
export const updateTableCart = asyncHandler(async (req, res) => {
  const cleanTableNum = String(req.params.tableNumber || '').match(/\d+/)?.[0] || '1';
  const tableNumVal = parseInt(cleanTableNum, 10);
  if (isNaN(tableNumVal) || tableNumVal < 1 || tableNumVal > 30) {
    return res.status(400).json({ success: false, message: 'Invalid table number (must be 1-30)' });
  }

  const { items } = req.body;

  let table = await Table.findOne({ tableNumber: cleanTableNum });
  if (!table) {
    table = await Table.create({
      tableNumber: cleanTableNum,
      status: 'occupied',
      qrToken: `table-${cleanTableNum}`,
    });
  }

  // Deep sanitize shared cart items to avoid memory exhaustion, NaN quantity, or malformed payload attacks
  const rawItems = Array.isArray(items) ? items.slice(0, 50) : [];
  const sanitizedItems = rawItems.map(item => {
    const rawQty = parseInt(item?.quantity, 10);
    const quantity = (!isNaN(rawQty) && rawQty >= 1) ? Math.min(rawQty, 50) : 1;
    return {
      menuItemId: String(item?.menuItemId || '').slice(0, 50),
      name: String(item?.name || '').slice(0, 100),
      price: Number(item?.price) > 0 ? Number(item?.price) : 0,
      quantity,
      image: String(item?.image || '').slice(0, 300),
      notes: String(item?.notes || '').slice(0, 200),
      selectedAddons: Array.isArray(item?.selectedAddons)
        ? item.selectedAddons.slice(0, 10).map(a => ({
            name: String(a?.name || '').slice(0, 50),
            price: Number(a?.price) > 0 ? Number(a?.price) : 0,
          }))
        : []
    };
  });

  const newSessionId = `SESS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const session = await TableSession.findOneAndUpdate(
    { tableId: table._id, status: 'active' },
    {
      $setOnInsert: { sessionId: newSessionId, tableId: table._id, status: 'active' },
      $set: { activeCart: sanitizedItems }
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  if (table.status === 'available') {
    table.status = 'occupied';
    await table.save().catch(() => {});
  }

  res.json({ success: true, data: session ? session.activeCart : [] });
});
