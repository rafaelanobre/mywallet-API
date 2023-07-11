import { Router } from "express";
import userRouter from "./usuarios.routes.js";
import moneyRouter from "./transacoes.routes.js";

const router = Router();

router.use(userRouter);
router.use(moneyRouter);

export default router;