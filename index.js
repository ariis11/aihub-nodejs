import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express()
const port = process.env.PORT || 3000

const openai = new OpenAI({
  apiKey: process.env.API_KEY
});

const aiService = {
  askQuestion: async () => {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ "role": "user", "content": "Hello!" }],
    });

    return chatCompletion.choices[0].message;
  }
};

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/generateEmail', async (req, res) => {
  try {
    const message = req.query.message;
    if (message) {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": message }],
      });
      console.log(chatCompletion.choices[0].message);
      res.send(chatCompletion.choices[0].message);
    } else {
      res.status(400).send('Message parameter is required');
    }
  } catch (error) {
    console.error("Error generating email:", error);
    res.status(500).send("An error occurred while generating the email.");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});