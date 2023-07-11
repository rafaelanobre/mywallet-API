import { Router } from "express";
import { adicionaTransacao } from "../controllers/adicionatransacoes.controllers.js";
import { listaTransacoes } from "../controllers/listatransacoes.controllers.js";

const moneyRouter = Router();

moneyRouter.post("/nova-transacao/:tipo", adicionaTransacao);
moneyRouter.get("/home", listaTransacoes);

export default moneyRouter;