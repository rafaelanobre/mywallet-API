import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';


const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);

    try {
        await mongoClient.connect()
        console.log("MongoDB conectado!")
    } catch (err) {
        (err) => console.log(err.message)
    }

export const db = mongoClient.db()

app.listen(5000);