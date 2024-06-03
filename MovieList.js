const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: String,
    year: String,
    type: String,
    poster: String,
});

const movieListSchema = new mongoose.Schema({
    username: String,
    name: String,
    movies: [movieSchema], // Correctly define movies as an array of objects
});

const MovieList = mongoose.model('MovieList', movieListSchema);

module.exports = MovieList;
