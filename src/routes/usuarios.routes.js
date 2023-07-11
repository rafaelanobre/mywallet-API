import { Router } from "express";
import { cadastro, login, logout } from "../controllers/usuarios.controllers.js";

const userRouter = Router();

userRouter.post("/cadastro", cadastro);
userRouter.post("/", login);
userRouter.post("/logout", logout);

export default userRouter;