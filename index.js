import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = '534696919943-hdd' + 'f4qt3m7rnd2psmj01k' + '1ps7skg9uon.apps.' + 'googleusercontent.com';
const CLIENT_SECRET = 'GOCSPX-sat-jtQJwCBF' + 'VHqdjJOThfCuNjj1';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04iK6gHsueGZLCgYIARAAGAQSNwF-L9Irz' + 'aHfUsigFmyi5mEPRDTUulu8sFGkP5h8zMQF3X7dHfVK2-cgVSoSvXH8KCSOZ-gxKxU';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.API_KEY_1 + process.env.API_KEY_2
});

const aiService = {
  askQuestion: async () => {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ "role": "user", "content": "Hello!" }],
    });

    return chatCompletion.choices[0].message;
  },
  // sendEmail: async () => {

  // }
};

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/sendEmail', async (req, res) => {
  try {
    const recipient = req.query.recipient;
    const subject = req.query.subject;
    const message = req.query.message;

    if (recipient && subject && message) {
      const accessToken = await oAuth2Client.getAccessToken();

      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'mariusrimkus97@gmail.com',
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: 'Marius Rimkus <mariusrimkus97@gmail.com>',
        to: recipient,
        subject: subject,
        text: message
      };

      const result = await transport.sendMail(mailOptions);

      res.send(result);
    } else {
      res.status(400).send('Recipient, subject or message parameter is missing');
    }
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("An error occurred while sending the email.");
  }
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