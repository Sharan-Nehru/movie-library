require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const MovieList = require('./MovieList'); // Import the corrected schema

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Could not connect to MongoDB:', error));

// Models
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String,
}));

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.send({ message: 'User registered successfully' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send({ error: 'Invalid password' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET);
    res.send({ token });
});

app.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send({ error: 'Invalid token' });
    }
});

app.post('/lists', async (req, res) => {
    const { name } = req.body;
    const username = req.user.username;

    const listExists = await MovieList.findOne({ username, name });
    if (listExists) return res.status(400).send({ error: 'List already exists' });

    const list = new MovieList({ username, name, movies: [] });
    await list.save();
    res.send({ message: 'List created successfully' });
});

app.get('/lists', async (req, res) => {
    const username = req.user.username;
    const lists = await MovieList.find({ username });
    res.send(lists);
});

app.post('/lists/add-movie', async (req, res) => {
    const { listName, title, year, type, poster } = req.body;
    const username = req.user.username;

    const list = await MovieList.findOne({ username, name: listName });
    if (!list) return res.status(400).send({ error: 'List not found' });

    list.movies.push({ title, year, type, poster });
    await list.save();
    res.send({ message: 'Movie added to list successfully' });
});

app.delete('/lists/:name', async (req, res) => {
    const { name } = req.params;
    const username = req.user.username;

    const list = await MovieList.findOneAndDelete({ username, name });
    if (!list) return res.status(400).send({ error: 'List not found' });

    res.send({ message: 'List deleted successfully' });
});

app.get('/lists/shared/:id', async (req, res) => {
    try {
        const listId = req.params.id;
        const movieList = await MovieList.findById(listId);

        if (!movieList) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.json(movieList);
    } catch (error) {
        console.error('Error fetching shared list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
