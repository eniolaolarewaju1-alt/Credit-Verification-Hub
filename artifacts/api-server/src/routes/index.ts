import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import memberRouter from "./member";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import transfersRouter from "./transfers";
import externalPayeesRouter from "./external-payees";
import externalTransfersRouter from "./external-transfers";
import billsRouter from "./bills";
import loansRouter from "./loans";
import cardsRouter from "./cards";
import statementsRouter from "./statements";
import validateRoutingRouter from "./validate-routing";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use(memberRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(transfersRouter);
router.use(externalPayeesRouter);
router.use(externalTransfersRouter);
router.use(billsRouter);
router.use(loansRouter);
router.use(cardsRouter);
router.use(statementsRouter);
router.use(validateRoutingRouter);

export default router;
