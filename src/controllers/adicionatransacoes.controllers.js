import { ObjectId } from "mongodb";
import { db } from "../database/database.connection.js";
import { transacaoSchema } from "../schemas/transacao.schemas.js";
import dayjs from "dayjs";

export async function adicionaTransacao(req,res) {
    const { tipo } = req.params;
    const { valor, descricao } = req.body;
    const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");

    if (!token) return res.sendStatus(401);

    const transacao = { valor, descricao, tipo, data: dayjs().format("DD/MM") }

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
}