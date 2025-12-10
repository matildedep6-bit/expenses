// This variable lives in the server's memory.
// WARNING: In Vercel/Serverless, this data will be wiped when the function
// "cold starts" or after a period of inactivity.
let memoryExpenses = [
    { 
        id: 1, 
        description: "Initial Demo Expense", 
        amount: 0, 
        category: "Other", 
        date: new Date().toISOString().split('T')[0] 
    }
];

export default function handler(req, res) {
    // 1. Handle GET requests (Retrieve all expenses)
    if (req.method === 'GET') {
        return res.status(200).json(memoryExpenses);
    }

    // 2. Handle POST requests (Add a new expense)
    if (req.method === 'POST') {
        try {
            const { description, amount, category, date } = req.body;

            // Basic validation
            if (!description || amount === undefined || !category || !date) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const newExpense = {
                id: Date.now(), // Simple ID generation
                description,
                amount: parseFloat(amount),
                category,
                date: date // User provided date (YYYY-MM-DD)
            };

            // Push to our in-memory array
            memoryExpenses.push(newExpense);

            return res.status(201).json(newExpense);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to process data' });
        }
    }

    // 3. Handle unsupported methods
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
