import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memberRouter from "./member";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import transfersRouter from "./transfers";
import billsRouter from "./bills";
import loansRouter from "./loans";
import cardsRouter from "./cards";
import statementsRouter from "./statements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memberRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(transfersRouter);
router.use(billsRouter);
router.use(loansRouter);
router.use(cardsRouter);
router.use(statementsRouter);

export default router;
