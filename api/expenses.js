// In-memory expenses array (reset on each deployment)
let expenses = [];

export default function handler(req, res) {
  const { method } = req;

  // GET /api/expenses → return all expenses
  if (method === "GET") {
    return res.status(200).json({ success: true, expenses });
  }

  // POST /api/expenses → add a new expense
  if (method === "POST") {
    const { description, amount, category, date } = req.body || {};

    if (!description || !amount || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: description, amount, category, date"
      });
    }

    const newExpense = { description, amount, category, date };
    expenses.push(newExpense);

    return res.status(201).json({
      success: true,
      message: "Expense added",
      expense: newExpense,
      expenses
    });
  }

  // PUT /api/expenses?id=1 → update expense at index
  if (method === "PUT") {
    const { id } = req.query;
    const index = Number(id);

    if (isNaN(index) || index < 0 || index >= expenses.length) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing 'id' for update"
      });
    }

    const { description, amount, category, date } = req.body || {};

    if (!description || !amount || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: description, amount, category, date"
      });
    }

    expenses[index] = { description, amount, category, date };

    return res.status(200).json({
      success: true,
      message: "Expense updated",
      expense: expenses[index],
      expenses
    });
  }

  // If method is not allowed
  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).json({ error: `Method ${method} not allowed` });
}
