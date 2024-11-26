require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const { OpenAI } = require('openai'); 
const cors = require('cors'); 
const { History, SocialScience, ComputerSecurity } = require('./models/Questions'); 

const app = express();
app.use(cors()); //  CORS support
app.use(express.json()); 

// create OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // load api key from env file
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ChatGPT_Evaluation', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// route1: get random questions
app.get('/questions/random', async (req, res) => {
  const { domain } = req.query; 
  try {
    let model;

    // select collections
    if (domain === 'History') {
      model = History;
    } else if (domain === 'Social_Science') {
      model = SocialScience;
    } else if (domain === 'Computer_Security') {
      model = ComputerSecurity;
    } else {
      return res.status(400).json({ error: 'Invalid domain. Please specify History, Social_Science, or Computer_Security.' });
    }

    // get random questions
    const randomQuestion = await model.aggregate([{ $sample: { size: 1 } }]);
    if (randomQuestion.length > 0) {
      res.json(randomQuestion[0]);
    } else {
      res.status(404).json({ error: `No questions found in the ${domain} collection.` });
    }
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// route2: connect to API and save response
app.post('/chatgpt/answer', async (req, res) => {
  const { question, domain } = req.body; 

  if (!question || !domain) {
    return res.status(400).json({ error: 'Question and domain are required.' });
  }

  try {
    let model;

    
    if (domain === 'History') {
      model = History;
    } else if (domain === 'Social_Science') {
      model = SocialScience;
    } else if (domain === 'Computer_Security') {
      model = ComputerSecurity;
    } else {
      return res.status(400).json({ error: 'Invalid domain. Please specify History, Social_Science, or Computer_Security.' });
    }

    // use ChatGPT API get response
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
      max_tokens: 150  ,
    });

    const chatgptResponse = response.choices[0].message.content.trim();

    // save ChatGPT's response to database
    const updatedQuestion = await model.findOneAndUpdate(
      { question }, 
      { response: chatgptResponse }, 
      { new: true, upsert: true } 
    );

    res.json({ chatgptResponse, updatedQuestion });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
