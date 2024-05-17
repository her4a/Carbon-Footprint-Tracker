const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// MySQL database connection configuration
const connection = mysql.createConnection({
    host: 'localhost', // or your host name
    user: 'root', // your MySQL username
    password: '', // your MySQL password
    database: 'carbon' // your MySQL database name
});

// Connect to the MySQL database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve index.html from current directory
});

// Route to fetch carbon footprint data from the database
app.get('/carbonData', (req, res) => {
    connection.query('SELECT * FROM carbon_footprint', (error, results, fields) => {
        if (error) {
            console.error('Error retrieving carbon footprint data: ' + error.stack);
            res.status(500).send('Error retrieving carbon footprint data from the database');
            return;
        }
        res.json(results);
    });
});

// Route to add new carbon footprint data to the database
app.post('/carbonData', (req, res) => {
    const { transport, energy, diet } = req.body;

    connection.query('INSERT INTO carbon_footprint (transport, energy, diet) VALUES (?, ?, ?)', [transport, energy, diet], (error, results, fields) => {
        if (error) {
            console.error('Error adding carbon footprint data: ' + error.stack);
            return res.status(500).send('Error adding carbon footprint data to the database');
        }
        res.sendStatus(201);
    });
});

// Route to delete carbon footprint data from the database
app.delete('/carbonData/:id', (req, res) => {
    const id = req.params.id;

    connection.query('DELETE FROM carbon_footprint WHERE id = ?', [id], (error, results, fields) => {
        if (error) {
            console.error('Error deleting carbon footprint data: ' + error.stack);
            return res.status(500).send('Error deleting carbon footprint data from the database');
        }
        res.sendStatus(200);
    });
});

// Route to calculate and retrieve carbon footprint
app.get('/carbonCalculation', (req, res) => {
    connection.query('SELECT SUM(transport) AS totalTransport, SUM(energy) AS totalEnergy, SUM(diet) AS totalDiet FROM carbon_footprint', (error, results, fields) => {
        if (error) {
            console.error('Error retrieving carbon footprint data: ' + error.stack);
            res.status(500).send('Error retrieving carbon footprint data from the database');
            return;
        }

        // Calculate carbon footprint based on tracked data
        const totalTransport = results[0].totalTransport;
        const totalEnergy = results[0].totalEnergy;
        const totalDiet = results[0].totalDiet;
        const carbonFootprint = calculateCarbonFootprint(totalTransport, totalEnergy, totalDiet);

        res.json({ carbonFootprint });
    });
});

// Function to calculate carbon footprint based on tracked data
function calculateCarbonFootprint(transport, energy, diet) {
    // Your carbon footprint calculation logic here
    // For example, a simple calculation:
    const carbonFootprint = transport * 0.1 + energy * 0.5 + diet * 0.2;
    return carbonFootprint.toFixed(2); // Round to 2 decimal places
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
