import * as SQLite from 'expo-sqlite';
import { nowIso } from '../utils/format';

let db;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sacha_hisaab.db');
    await migrateDb(db);
  }
  return db;
}

async function migrateDb(database) {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      photo_uri TEXT,
      section_type TEXT NOT NULL CHECK(section_type IN ('LEND', 'BORROW')),
      reminder_days INTEGER DEFAULT 7,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('LEND', 'BORROW')),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      amount_settled REAL DEFAULT 0,
      balance_remaining REAL NOT NULL,
      note TEXT,
      FOREIGN KEY(customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(customer_id) REFERENCES Customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS RepaymentAllocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repayment_id INTEGER NOT NULL,
      entry_id INTEGER NOT NULL,
      amount_applied REAL NOT NULL,
      FOREIGN KEY(repayment_id) REFERENCES Repayments(id) ON DELETE CASCADE,
      FOREIGN KEY(entry_id) REFERENCES Entries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      language TEXT NOT NULL DEFAULT 'en',
      pin_enabled INTEGER NOT NULL DEFAULT 0,
      biometric_enabled INTEGER NOT NULL DEFAULT 0
    );
  `);
  await database.runAsync(
    'INSERT OR IGNORE INTO Settings (id, language, pin_enabled, biometric_enabled) VALUES (1, ?, 0, 0)',
    ['en']
  );
}

export async function loadSettings() {
  const database = await getDb();
  return await database.getFirstAsync('SELECT * FROM Settings WHERE id = 1');
}

export async function updateSettings(values) {
  const database = await getDb();
  const current = await loadSettings();
  const next = { ...current, ...values };
  await database.runAsync(
    'UPDATE Settings SET language = ?, pin_enabled = ?, biometric_enabled = ? WHERE id = 1',
    [next.language, Number(next.pin_enabled), Number(next.biometric_enabled)]
  );
  return await loadSettings();
}

export async function listCustomers(sectionType) {
  const database = await getDb();
  const params = sectionType ? [sectionType] : [];
  const where = sectionType ? 'WHERE section_type = ?' : '';
  return await database.getAllAsync(
    `
      SELECT c.*,
        COALESCE(SUM(e.balance_remaining), 0) AS outstanding,
        MAX(e.date) AS last_entry_date
      FROM Customers c
      LEFT JOIN Entries e ON e.customer_id = c.id
      ${where}
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE
    `,
    params
  );
}

export async function getCustomer(id) {
  const database = await getDb();
  return await database.getFirstAsync(
    `
      SELECT c.*,
        COALESCE(SUM(e.balance_remaining), 0) AS outstanding
      FROM Customers c
      LEFT JOIN Entries e ON e.customer_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `,
    [id]
  );
}

export async function saveCustomer(customer) {
  const database = await getDb();
  const payload = [
    customer.name.trim(),
    customer.phone.trim(),
    customer.photo_uri || null,
    customer.section_type,
    Number(customer.reminder_days || 7),
  ];
  if (customer.id) {
    await database.runAsync(
      'UPDATE Customers SET name = ?, phone = ?, photo_uri = ?, section_type = ?, reminder_days = ? WHERE id = ?',
      [...payload, customer.id]
    );
    return customer.id;
  }
  const result = await database.runAsync(
    'INSERT INTO Customers (name, phone, photo_uri, section_type, reminder_days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [...payload, nowIso()]
  );
  return result.lastInsertRowId;
}

export async function deleteCustomer(id) {
  const database = await getDb();
  await database.runAsync('DELETE FROM Customers WHERE id = ?', [id]);
}

export async function listEntries(customerId) {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM Entries WHERE customer_id = ? ORDER BY date DESC, id DESC', [customerId]);
}

export async function listRepayments(customerId) {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM Repayments WHERE customer_id = ? ORDER BY date DESC, id DESC', [customerId]);
}

export async function saveEntry(entry) {
  const database = await getDb();
  const amount = Number(entry.amount);
  if (entry.id) {
    const allocations = await database.getFirstAsync(
      'SELECT COALESCE(SUM(amount_applied), 0) AS settled FROM RepaymentAllocations WHERE entry_id = ?',
      [entry.id]
    );
    const settled = Math.min(Number(allocations?.settled || 0), amount);
    await database.runAsync(
      'UPDATE Entries SET amount = ?, date = ?, amount_settled = ?, balance_remaining = ?, note = ? WHERE id = ?',
      [amount, entry.date, settled, amount - settled, entry.note || '', entry.id]
    );
    return entry.id;
  }
  const result = await database.runAsync(
    'INSERT INTO Entries (customer_id, type, amount, date, amount_settled, balance_remaining, note) VALUES (?, ?, ?, ?, 0, ?, ?)',
    [entry.customer_id, entry.type, amount, entry.date, amount, entry.note || '']
  );
  return result.lastInsertRowId;
}

export async function deleteEntry(id) {
  const database = await getDb();
  await database.runAsync('DELETE FROM RepaymentAllocations WHERE entry_id = ?', [id]);
  await database.runAsync('DELETE FROM Entries WHERE id = ?', [id]);
}

export async function addRepayment(repayment, manualAllocations = []) {
  const database = await getDb();
  const amount = Number(repayment.amount);
  await database.withExclusiveTransactionAsync(async (txn) => {
    const result = await txn.runAsync(
      'INSERT INTO Repayments (customer_id, amount, date, note) VALUES (?, ?, ?, ?)',
      [repayment.customer_id, amount, repayment.date, repayment.note || '']
    );
    const repaymentId = result.lastInsertRowId;
    const allocations = manualAllocations.length
      ? manualAllocations
      : await buildOldestFirstAllocations(txn, repayment.customer_id, amount);

    for (const allocation of allocations) {
      if (Number(allocation.amount_applied) > 0) {
        await txn.runAsync(
          'INSERT INTO RepaymentAllocations (repayment_id, entry_id, amount_applied) VALUES (?, ?, ?)',
          [repaymentId, allocation.entry_id, Number(allocation.amount_applied)]
        );
        await txn.runAsync(
          'UPDATE Entries SET amount_settled = amount_settled + ?, balance_remaining = MAX(balance_remaining - ?, 0) WHERE id = ?',
          [Number(allocation.amount_applied), Number(allocation.amount_applied), allocation.entry_id]
        );
      }
    }
  });
}

async function buildOldestFirstAllocations(txn, customerId, amount) {
  const entries = await txn.getAllAsync(
    'SELECT id, balance_remaining FROM Entries WHERE customer_id = ? AND balance_remaining > 0 ORDER BY date ASC, id ASC',
    [customerId]
  );
  let remaining = amount;
  const allocations = [];
  for (const entry of entries) {
    if (remaining <= 0) {
      break;
    }
    const applied = Math.min(Number(entry.balance_remaining), remaining);
    allocations.push({ entry_id: entry.id, amount_applied: applied });
    remaining -= applied;
  }
  return allocations;
}

export async function loadDashboard() {
  const database = await getDb();
  const totals = await database.getFirstAsync(`
    SELECT
      COALESCE(SUM(CASE WHEN c.section_type = 'LEND' THEN e.balance_remaining ELSE 0 END), 0) AS lend_total,
      COALESCE(SUM(CASE WHEN c.section_type = 'BORROW' THEN e.balance_remaining ELSE 0 END), 0) AS borrow_total
    FROM Entries e
    JOIN Customers c ON c.id = e.customer_id
  `);
  const overdue = await database.getAllAsync(`
    SELECT c.*, COALESCE(SUM(e.balance_remaining), 0) AS outstanding, MIN(e.date) AS oldest_date
    FROM Customers c
    JOIN Entries e ON e.customer_id = c.id AND e.balance_remaining > 0
    GROUP BY c.id
    HAVING julianday('now') - julianday(oldest_date) >= c.reminder_days
    ORDER BY oldest_date ASC
    LIMIT 10
  `);
  const collections = await database.getFirstAsync(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM Repayments WHERE date(date) = date('now')"
  );
  return { totals, overdue, todayCollections: Number(collections?.total || 0) };
}

export async function loadCalendarActivity(monthPrefix) {
  const database = await getDb();
  return await database.getAllAsync(
    `
      SELECT substr(date, 1, 10) AS day, COUNT(*) AS count, SUM(amount) AS amount, 'entry' AS kind
      FROM Entries
      WHERE substr(date, 1, 7) = ?
      GROUP BY day
      UNION ALL
      SELECT substr(date, 1, 10) AS day, COUNT(*) AS count, SUM(amount) AS amount, 'repayment' AS kind
      FROM Repayments
      WHERE substr(date, 1, 7) = ?
      GROUP BY day
      ORDER BY day
    `,
    [monthPrefix, monthPrefix]
  );
}
