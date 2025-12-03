// /api/expenses.js
// In-memory store (resets on cold-starts)
let expenses = [];

/**
 * Helper: parse JSON body for Node serverless req (works with Vercel)
 */
async function parseJsonBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Helper: stable sort by date (ISO string) then by insertion (no-op because push preserves)
 * Returns a new array sorted oldest -> newest.
 */
function sortChronological(arr) {
  return arr.slice().sort((a, b) => {
    // prefer explicit date if present, otherwise fallback to createdAt
    const da = a.date || a.createdAt;
    const db = b.date || b.createdAt;
    if (da < db) return -1;
    if (da > db) return 1;
    // tie-breaker: createdAt
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  });
}

/**
 * Generate a simple unique id (timestamp + random)
 */
function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
}

export default async function handler(req, res) {
  const method = req.method && req.method.toUpperCase();

  // Allow OPTIONS for CORS-friendly environments (optional)
  if (method === "OPTIONS") {
    res.setHeader("Allow", "GET,POST,PUT,OPTIONS");
    return res.status(204).end();
  }

  // GET -> return full chronological list
  if (method === "GET") {
    const sorted = sortChronological(expenses);
    return res.status(200).json({ success: true, expenses: sorted });
  }

  // POST -> add a new expense (push, do not overwrite)
  if (method === "POST") {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid JSON body" });
    }

    const { description, amount, category, date } = body || {};

    if (!description || amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: description, amount, category, date"
      });
    }

    // normalize amount to number
    const amt = typeof amount === "number" ? amount : parseFloat(String(amount).replace(',', '.'));
    if (Number.isNaN(amt)) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const newExpense = {
      id: genId(),
      description: String(description),
      amount: Math.round(amt * 100) / 100, // keep two decimals
      category: String(category),
      date: String(date), // expect ISO 'YYYY-MM-DD' or similar
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);

    return res.status(201).json({
      success: true,
      message: "Expense added",
      expense: newExpense,
      expenses: sortChronological(expenses)
    });
  }

  // PUT -> update existing expense by id OR numeric index: /api/expenses?id=...
  if (method === "PUT") {
    const url = new URL(req.url, `http://localhost`);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return res.status(400).json({ success: false, error: "Missing 'id' query parameter" });
    }

    let body;
    try {
      body = await parseJsonBody(req);
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid JSON body" });
    }

    const { description, amount, category, date } = body || {};
    if (!description || amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: description, amount, category, date"
      });
    }

    // try numeric index first (backwards-compatibility)
    let index = Number(idParam);
    let foundIndex = -1;

    if (!Number.isNaN(index) && Number.isFinite(index)) {
      if (index >= 0 && index < expenses.length) {
        foundIndex = index;
      }
    }

    // if not found by numeric index, try by unique id match
    if (foundIndex === -1) {
      foundIndex = expenses.findIndex(e => e.id === idParam);
    }

    if (foundIndex === -1) {
      return res.status(404).json({ success: false, error: "Expense not found for given id" });
    }

    const amt = typeof amount === "number" ? amount : parseFloat(String(amount).replace(',', '.'));
    if (Number.isNaN(amt)) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // preserve id and createdAt
    const existing = expenses[foundIndex];
    const updated = {
      ...existing,
      description: String(description),
      amount: Math.round(amt * 100) / 100,
      category: String(category),
      date: String(date),
      updatedAt: new Date().toISOString()
    };

    expenses[foundIndex] = updated;

    return res.status(200).json({
      success: true,
      message: "Expense updated",
      expense: updated,
      expenses: sortChronological(expenses)
    });
  }

  // Method not allowed
  res.setHeader("Allow", "GET,POST,PUT,OPTIONS");
  return res.status(405).json({ success: false, error: `Method ${method} not allowed` });
}
