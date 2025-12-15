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

    // 3. Handle PUT requests (Update an existing expense)
    if (req.method === 'PUT') {
        try {
            const { id, description, amount, category, date } = req.body;

            // Basic validation
            if (!id || !description || amount === undefined || !category || !date) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const expenseIndex = memoryExpenses.findIndex(exp => exp.id == id);
            if (expenseIndex === -1) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            // Update the expense
            memoryExpenses[expenseIndex] = {
                id: parseInt(id),
                description,
                amount: parseFloat(amount),
                category,
                date
            };

            return res.status(200).json(memoryExpenses[expenseIndex]);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to update data' });
        }
    }

    // 4. Handle DELETE requests (Delete an existing expense)
    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;

            // Basic validation
            if (!id) {
                return res.status(400).json({ error: 'ID is required' });
            }

            const expenseIndex = memoryExpenses.findIndex(exp => exp.id == id);
            if (expenseIndex === -1) {
                return res.status(404).json({ error: 'Expense not found' });
            }

            // Remove the expense
            memoryExpenses.splice(expenseIndex, 1);

            return res.status(200).json({ message: 'Expense deleted successfully' });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete data' });
        }
    }

    // 5. Handle unsupported methods
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
