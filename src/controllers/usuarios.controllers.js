import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { db } from "../database/database.connection.js";
import { userSchema } from "../schemas/cadastro.schemas.js";


export async function cadastro(req, res) {
    const { nome, email, senha } = req.body;

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
}

export async function login(req,res) {
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
}

export async function logout(req,res) {
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer ", "");

    try {
        if (!token) return res.sendStatus(401);

        await db.collection("session").deleteOne({ token });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err.message);
    }
}