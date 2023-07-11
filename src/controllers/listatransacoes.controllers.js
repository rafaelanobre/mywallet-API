import { ObjectId } from "mongodb";
import { db } from "../database/database.connection.js";

export async function listaTransacoes(req, res) {
    const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");

    if (!token) return res.sendStatus(401);

    try {
        const session = await db.collection("session").findOne({ token });
        if (!session) return res.sendStatus(401);

        const user = await db.collection("users").findOne({ _id: new ObjectId(session.idUsuario) });

        const saldo = user.transacoes.reduce((acc, transacao) => {
            const valor = parseFloat(transacao.valor);

            if (transacao.tipo === "entrada") {
                return acc + valor;
            } else if (transacao.tipo === "saida") {
                return acc - valor;
            }
            return acc;
        }, 0);

        const userInfo = { username: user.nome, transacoes: user.transacoes, saldo };

        res.status(200).send(userInfo);
    } catch (err) {
        res.status(500).send(err.message);
    }
}