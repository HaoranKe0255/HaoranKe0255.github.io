const mongoose = require('mongoose');

// Define Schema
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  expected_answer: { type: String, required: true },
  response: { type: String, default: null },
});

// Create models
const History = mongoose.model('History', QuestionSchema);
const SocialScience = mongoose.model('Social_Science', QuestionSchema);
const ComputerSecurity = mongoose.model('Computer_Security', QuestionSchema);

module.exports = { History, SocialScience, ComputerSecurity };
