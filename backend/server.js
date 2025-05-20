const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log('OpenAI response received');
    
    const response = {
      response: completion.choices[0].message.content
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error details:', error);
    
    // Handle specific OpenAI errors
    if (error.response) {
      console.error('OpenAI API error:', error.response.data);
      return res.status(error.response.status).json({ 
        error: 'OpenAI API error',
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured');
}); 