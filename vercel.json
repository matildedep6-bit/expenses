// In-memory store (resets on every cold start)
let expenses = [];

export default function handler(req, res) {
  // GET → return all expenses
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      data: expenses
    });
  }

  // POST → add a new expense
  if (req.method === "POST") {
    const { amount, description, category, date } = req.body || {};

    // Validate required fields
    if (!amount || !description || !category || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, description, category, date"
      });
    }

    // Create expense object
    const newExpense = {
      id: expenses.length + 1,
      amount,
      description,
      category,
      date
    };

    // Add to memory array
    expenses.push(newExpense);

    return res.status(201).json({
      success: true,
      data: newExpense
    });
  }

  // Unsupported method
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`
  });
}
