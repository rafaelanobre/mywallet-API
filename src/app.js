import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';

import bcrypt, { compareSync } from "bcrypt";
import { v4 as uuid } from "uuid";

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

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(3),
});

app.post("/cadastro", async (req,res)=>{
    const { name, email, password } = req.body;

    const validation = userSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const usuario = await db.collection("users").findOne({ email });
        if (usuario){
            return res.status(409).send("E-mail já cadastrado");
        }

        const hash = bcrypt.hashSync(password, 10);

        await db.collection("users").insertOne({ name, email, password: hash });
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/", async (req,res)=>{
    const { email, senha } = req.body;

    try {
        const usuario = await db.collection("users").findOne({ email });
        if (!usuario){
            return res.status(404).send("Usuário não cadastrado");
        }

        const acertouSenha = bcrypt.compareSync(senha, usuario.password);
        if (!acertouSenha){
            return res.status(401).send("Senha incorreta");
        }

        await db.collection("session").deleteMany({ idUsuario: usuario._id });
        const token = uuid();
        await db.collection("session").insertOne({ token, idUsuario: usuario._id });

        res.status(201).send(token);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const port = process.env.PORT;

app.listen(port);