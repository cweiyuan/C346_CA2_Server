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
    timezone: '+08:00',
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
        const [rows] = await connection.execute('SELECT * FROM Habits WHERE is_active = 1');
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


// Update Route: Update a game by ID
app.put('/updategame/:id', async (req, res) => {
    const { id } = req.params;
    const { game_name, game_pic } = req.body;

    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE defaultdb.games SET game_name = ?, game_pic = ? WHERE id = ?',
            [game_name, game_pic, id]
        );
        res.json({ message: 'Game updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update game' });
    }
});


// Delete Route: Delete a game by IDs
app.delete('/deletegame/:id', async(req,res) => {
    const {id} = req.params;
    try{
        let connection = await mysql.createConnection(dbConfig)
        await connection.execute('DELETE FROM defaultdb.games WHERE id = ?', [id]);
        res.json({message: 'Game deleted successfully'});
    }
    catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error - could not delete game'});
    }
});
