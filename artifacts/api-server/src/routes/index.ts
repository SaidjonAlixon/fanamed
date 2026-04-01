import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import patientsRouter from "./patients";
import medicalRecordsRouter from "./medical-records";
import verifyRouter from "./verify";
import pdfRouter from "./pdf";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/patients", patientsRouter);
router.use("/medical-records", medicalRecordsRouter);
router.use("/verify", verifyRouter);
router.use("/pdf", pdfRouter);
router.use("/dashboard", dashboardRouter);

export default router;
