import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';

import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);

    try {
        await mongoClient.connect();
        console.log("MongoDB conectado!");
    } catch (err) {
        console.log(err.message);                   
    }

export const db = mongoClient.db()

app.post("/cadastro", async (req,res)=>{
    const { nome, email, senha } = req.body;

    const userSchema = joi.object({
        nome: joi.string().required(),
        email: joi.string().email().required(),
        senha: joi.string().required().min(3),
    });

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

        const hash = bcrypt.hashSync(senha, 10);

        await db.collection("users").insertOne({ nome, email, senha: hash, transacoes: [] });
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

        const acertouSenha = bcrypt.compareSync(senha, usuario.senha);
        if (!acertouSenha){
            return res.status(401).send("Senha incorreta");
        }

        await db.collection("session").deleteMany({ idUsuario: usuario._id });
        const token = uuid();
        await db.collection("session").insertOne({ token, idUsuario: usuario._id });

        res.status(200).send(token);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/home", async (req,res)=>{
    const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");

    if (!token) return res.sendStatus(401);

    try {
        const session = await db.collection("session").findOne({ token });
        if (!session) return res.sendStatus(401);
        console.log("session:", session);

        const user = await db.collection("users").findOne({ _id: new ObjectId(session.idUsuario) });
        console.log("user:", user);

        const saldo = user.transacoes.reduce((acc, transacao) => {
            if (transacao.tipo === "entrada") {
                return acc + transacao.valor;
            } else if (transacao.tipo === "saida") {
                return acc - transacao.valor;
            }
            return acc;
        }, 0);

        const userInfo = { username: user.nome, transacoes: user.transacoes, saldo };
        console.log("userInfo:", userInfo);

        res.status(200).send(userInfo);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/nova-transacao/:tipo", async (req,res)=>{
    const { tipo } = req.params;
    const { valor, descricao } = req.body;
    const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");

    if (!token) return res.sendStatus(401);

    const transacaoSchema = joi.object({
        valor: joi.number().required(),
        descricao: joi.string().required(),
        tipo: joi.string().valid('entrada', 'saida').required()
    });

    const transacao = { valor, descricao, tipo }

    const validation = transacaoSchema.validate(transacao, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const session = await db.collection("session").findOne({ token });
        if (!session) return res.sendStatus(401);

        const user = await db.collection("users").findOne({ _id: new ObjectId(session.idUsuario) });

        await db.collection("users").updateOne(
            { email: user.email },
            { $push: { transacoes: transacao } }
        );
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/logout", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer ", "");

    try {
        if (!token) return res.sendStatus(401);

        await db.collection("session").deleteOne({ token });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const port = process.env.PORT;

app.listen(port);