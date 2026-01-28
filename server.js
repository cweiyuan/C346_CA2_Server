// include the required packages
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

//database config info
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

//initialize Express app
const app = express();
//helps app to read JSON data
app.use(express.json());

//start the server
app.listen(port, () => {
    console.log('Server running on port ' , port);
});

//Example Route: Get all games
app.get('/habits', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM Habits');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error for habits'});
    }
});

// Create new habit 
app.post('/addhabits', async (req, res) => {
    const {title, description, category, points_per_completion} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO Habits (title, description, category, points_per_completion) VALUES (?, ?, ?, ?)',
            [title, description || null, category || null, points_per_completion || 10]
        );
        await connection.end();
        res.status(201).json({message: `Habit "${title}" added successfully`});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not add habit'});
    }
});


// Update Route: Update a habit by ID
app.put('/updatehabits/:id', async (req, res) => {
    const { id } = req.params;
    const {title, description, category, points_per_completion} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE Habits SET title = ?, description = ?, category = ?, points_per_completion = ? WHERE habit_id = ?',
            [title, description || null, category || null, points_per_completion || 10, id]
        );
        await connection.end();
        res.json({ message: 'Habit updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update habit' });
    }
});


// Delete Route: Delete a game by IDs
app.delete('/deletehabits/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE Habits SET is_active = 0 WHERE habit_id = ?', [id]);
        await connection.end();
        res.json({message: 'Habit deleted successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not delete habit'});
    }
});

//completion route
app.post('/completions', async (req, res) => {
    const {habit_id, points_earned, notes} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO habit_completions (habit_id, points_earned, notes) VALUES (?, ?, ?)',
            [habit_id, points_earned, notes || null]
        );
        await connection.end();
        res.status(201).json({message: 'Habit completed successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not log completion'});
    }
});

app.get('/totalpoints', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT SUM(points_earned) as total_points FROM habit_completions');
        await connection.end();
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error for points'});
    }
});

app.get('/summary', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(`
            SELECT h.title as habit_name, SUM(c.points_earned) as points
            FROM habit_completions c
            JOIN Habits h ON c.habit_id = h.habit_id
            GROUP BY h.habit_id, h.title
            ORDER BY points DESC
        `);
        
        const [total] = await connection.execute('SELECT COALESCE(SUM(points_earned), 0) as total_points FROM habit_completions');
        
        await connection.end();
        
        res.json({
            total_points: total[0].total_points,
            habits: rows  // [{habit_name: "Bag", points: 30}, ...]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error for summary'});
    }
});
