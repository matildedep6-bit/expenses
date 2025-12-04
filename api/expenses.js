// Persistent expenses storage via Vercel KV
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  return res.json();
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value })
  });
}

export default async function handler(req, res) {
  const method = req.method;

  // always load stored expenses
  let store = await kvGet("expenses");
  let expenses = store?.result ? JSON.parse(store.result) : [];

  if (method === "GET") {
    return res.status(200).json({ success: true, expenses });
  }

  if (method === "POST") {
    const { description, amount, category, date } = req.body || {};

    if (!description || !amount || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      });
    }

    const newExpense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      category,
      date
    };

    expenses.push(newExpense);

    await kvSet("expenses", JSON.stringify(expenses));

    return res
      .status(201)
      .json({ success: true, expense: newExpense, expenses });
  }

  if (method === "PUT") {
    const { id } = req.query;
    const { description, amount, category, date } = req.body || {};

    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1)
      return res
        .status(404)
        .json({ success: false, error: "Expense not found" });

    expenses[index] = {
      ...expenses[index],
      description,
      amount: parseFloat(amount),
      category,
      date
    };

    await kvSet("expenses", JSON.stringify(expenses));

    return res.status(200).json({ success: true, expenses });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
