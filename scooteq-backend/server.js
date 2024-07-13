const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection setup
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "scooteq",
});

// Connection to MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("MySQL connected...");
});

// User registration
app.post("/api/register", (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
  db.query(sql, [username, hashedPassword, email], (err, result) => {
    if (err) {
      console.error("Error registering user:", err);
      return res.status(500).send("Error registering user");
    }
    res.status(200).send("User registered successfully");
  });
});

// User login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log("Login request payload:", req.body);

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error("Error logging in user:", err);
      return res.status(500).send("Error logging in user");
    }

    if (results.length === 0) {
      return res.status(400).send("Invalid credentials");
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id }, "secret_key", { expiresIn: 86400 });
    res.status(200).send({ auth: true, token });
  });
});

// Handle fare calculation
app.post('/api/calculate-fare', (req, res) => {
  const { duration, distance } = req.body;
  let fare = 0;

  if (duration) {
    fare = duration * 0.5; // Example: $0.5 per minute
  } else if (distance) {
    fare = distance * 2; // Example: $2 per km
  } else {
    return res.status(400).json({ message: 'Duration or distance required' });
  }

  res.json({ fare });
});

// Rent a scooter
app.post('/api/rent-scooter', (req, res) => {
  const { user_id, scooter_id, start_time } = req.body;
  const query = 'INSERT INTO rentals (user_id, scooter_id, start_time) VALUES (?, ?, ?)';
  db.query(query, [user_id, scooter_id, start_time], (err, results) => {
    if (err) throw err;
    // Update scooter status to rented
    db.query('UPDATE scooters SET status = "rented" WHERE id = ?', [scooter_id], (err, results) => {
      if (err) throw err;
      res.json({ message: 'Scooter rented successfully' });
    });
  });
});

// Get scooter details
app.get('/api/scooters', (req, res) => {
  const query = 'SELECT * FROM scooters';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
