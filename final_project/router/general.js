const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({message: "User already exists"});
  }

  users.push({username, password});
  return res.status(200).json({message: "User registered successfully"});
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  if (req.headers["x-async-request"] === "true") {
    return res.status(200).json(books);
  }

  try {
    const response = await axios.get("http://localhost:5000/", {
      headers: {"x-async-request": "true"},
    });
    return res.status(200).send(JSON.stringify(response.data, null, 2));
  } catch (error) {
    return res.status(500).json({message: "Error retrieving book list"});
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  if (req.headers["x-async-request"] === "true") {
    const book = books[isbn];
    if (book) {
      return res.status(200).json(book);
    }
    return res.status(404).json({message: "Book not found"});
  }

  try {
    const response = await axios.get(`http://localhost:5000/isbn/${encodeURIComponent(isbn)}`, {
      headers: {"x-async-request": "true"},
    });
    return res.status(200).send(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({message: "Error retrieving book details"});
  }
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  const bookKeys = Object.keys(books);
  const matchingBooks = {};

  bookKeys.forEach((key) => {
    if (books[key].author === author) {
      matchingBooks[key] = books[key];
    }
  });

  if (Object.keys(matchingBooks).length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 2));
  }
  return res.status(404).json({message: "No books found for this author"});
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  const bookKeys = Object.keys(books);
  const matchingBooks = {};

  bookKeys.forEach((key) => {
    if (books[key].title === title) {
      matchingBooks[key] = books[key];
    }
  });

  if (Object.keys(matchingBooks).length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 2));
  }
  return res.status(404).json({message: "No books found for this title"});
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).send(JSON.stringify(book.reviews, null, 2));
  }
  return res.status(404).json({message: "Book not found"});
});

module.exports.general = public_users;
