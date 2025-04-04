import { Router } from "express";
import { LatexController } from "../controllers/latex.controller";

const router = Router();
const latexController = new LatexController();

router.post("/compile", latexController.compileLatex);

export default router;
