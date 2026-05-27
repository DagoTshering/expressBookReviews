const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return users.some((user) => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid login. Check username and password"});
  }

  const accessToken = jwt.sign({username}, "access", {expiresIn: "1h"});
  req.session.authorization = {accessToken, username};
  return res.status(200).json({message: "Login successful!"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization?.username;
  const book = books[isbn];

  if (!username) {
    return res.status(401).json({message: "User not logged in"});
  }
  if (!review) {
    return res.status(400).json({message: "Review is required"});
  }
  if (!book) {
    return res.status(404).json({message: "Book not found"});
  }

  book.reviews[username] = review;
  return res.status(200).json({message: "Review added/updated successfully", reviews: book.reviews});
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization?.username;
  const book = books[isbn];

  if (!username) {
    return res.status(401).json({message: "User not logged in"});
  }
  if (!book) {
    return res.status(404).json({message: "Book not found"});
  }
  if (!book.reviews[username]) {
    return res.status(404).json({message: "Review not found for this user"});
  }

  delete book.reviews[username];
  return res.status(200).json({message: "Review deleted successfully", reviews: book.reviews});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
