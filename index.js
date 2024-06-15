import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import axios from 'axios';
import fetch from 'node-fetch';
import moment from 'moment';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = '534696919943-hddf4qt3m7rnd2psmj01k1ps7skg9uon.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04iK6gHsueGZLCgYIARAAGAQSNwF-L9IrzaHfUsigFmyi5mEPRDTUulu8sFGkP5h8zMQF3X7dHfVK2-cgVSoSvXH8KCSOZ-gxKxU';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.API_KEY_1 + process.env.API_KEY_2
});

const aiService = {
  generateEmail: async (req) => {
    const message = req.query.message;

    if (message) {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ "role": "user", "content": message }],
      });

      return chatCompletion.choices[0].message;
    } else {
      return null;
    }
  },
  sendEmail: async (req) => {
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

      return result;
    } else {
      return null;
    }
  },
  evaluateNews: async (title) => {
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": `Evaluate if this header is bullish or bearish for crypto "${title}". Provide only one word: Bullish or Bearish.` }],
      });
      console.log(chatCompletion.choices[0].message);
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("Error evaluating news:", error);
      res.status(500).send("An error occurred while evaluating the news.");
    }
  },
  getCryptoNews: async () => {
    const response = await axios.get('https://cryptopanic.com/api/v1/posts/?auth_token=b6de5c1cb7094cce184670e40540ae5110313327&currencies=TON');

    const data = response.data;

    if (Array.isArray(data.results)) {
      const transformedResults = [];
      for (let i = 0; i < 10 && i < data.results.length; i++) {
        transformedResults.push({
          title: data.results[i].title,
          type: await aiService.evaluateNews(data.results[i].title),
          url: data.results[i].url
        });
      }

      return transformedResults;
    } else {
      return null;
    }
  },
  generateCryptoNewsAnswer: async (req) => {
    const message = req.query.message;

    if (message) {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ "role": "user", "content": message }],
      });

      return chatCompletion.choices[0].message;
    } else {
      return null;
    }
  },
  getCoinHistoricData: async (id, days) => {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const options = {
      method: 'GET',
      headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-i4YdQ2qSrbWPsc97MV2pt6Sx' }
    };

    return fetch(url, options)
      .then(res => res.json())
      .catch(() => null);
  },
  getCoinDayData: async () => {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd`;
    const options = {
      method: 'GET',
      headers: { accept: 'application/json', 'x-cg-demo-api-key': 'CG-i4YdQ2qSrbWPsc97MV2pt6Sx' }
    };

    return fetch(url, options)
      .then(res => res.json())
      .catch(() => null);
  }
};

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/sendEmail', async (req, res) => {
  try {
    const response = await aiService.sendEmail(req);

    if (response) {
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
    const emailBody = await aiService.generateEmail(req);

    if (emailBody) {
      res.send(emailBody);
    } else {
      res.status(400).send('Message parameter is required');
    }
  } catch (error) {
    console.error("Error generating email:", error);
    res.status(500).send("An error occurred while generating the email.");
  }
});

app.get('/generateCryptoNewsAnswer', async (req, res) => {
  try {
    const answer = await aiService.generateCryptoNewsAnswer(req);

    if (answer) {
      res.send(answer);
    } else {
      res.status(400).send('Message parameter is required');
    }
  } catch (error) {
    console.error("Error generating answer for crypto news:", error);
    res.status(500).send("An error occurred while generating answer for crypto news.");
  }
});

app.get('/getCryptoNews', async (req, res) => {
  try {
    const cryptoNews = await aiService.getCryptoNews();

    if (cryptoNews) {
      res.json(cryptoNews);
    } else {
      console.error("No crypto news found.:", error);
      res.status(500).send("An error occurred while returning crypto news.");
    }
  } catch (error) {
    console.error("Error returning crypto news:", error);
    res.status(500).send("An error occurred while returning crypto news.");
  }
});

app.get('/getCoinHistoricData', async (req, res) => {
  const id = req.query.id;
  const days = req.query.days;

  if (!days || !id) {
    res.status(400).send('Message parameter is required');
  }

  try {
    const coinData = await aiService.getCoinHistoricData(id, days);

    if (coinData) {
      const transformArray = (arr) => {
        const filteredArr = arr.filter((_, index) => index % 12 === 0);
        return filteredArr.map(([timestamp, value]) => ({
          time: Date.parse(moment(new Date(timestamp)).format("YYYY-MM-DD HH:mm")) / 1000,
          value: value
        }));
      };

      res.json({
        prices: transformArray(coinData.prices),
        market_caps: transformArray(coinData.market_caps),
        total_volumes: transformArray(coinData.total_volumes)
      });
    } else {
      console.error("No coin records found.:", error);
      res.status(500).send("An error occurred while returning coin records.");
    }
  } catch (error) {
    console.error("Error returning coin records:", error);
    res.status(500).send("An error occurred while returning coin records.");
  }
});

app.get('/getCoinDayData', async (req, res) => {
  try {
    const coinData = await aiService.getCoinDayData();

    console.log('coinData: ' + JSON.stringify(coinData));

    if (coinData) {
      const neededCoins = [ "btc", "eth", "sol", "ton" ];
      const response = {
        btc: null,
        ath: null,
        sol: null,
        ton: null
      };
      
      coinData.forEach(coin => {
        const id = coin.symbol;
        console.log("id: " + id);
        if (neededCoins.includes(id)) {
          console.log("yes");
          console.log("coin.current_price: " + coin.current_price);
          console.log("coin.price_change_percentage_24h: " + coin.price_change_percentage_24h);
          response[id] = {
            price: coin.current_price,
            change: coin.price_change_percentage_24h
          };
        }
      });

      console.log('coinData: ' + JSON.stringify(response));
      res.json(response);
    } else {
      console.error("No coin records found.:", error);
      res.status(500).send("An error occurred while returning coin records.");
    }
  } catch (error) {
    console.error("Error returning coin records:", error);
    res.status(500).send("An error occurred while returning coin records.");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});