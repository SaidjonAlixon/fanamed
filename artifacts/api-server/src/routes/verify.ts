import { Router, type IRouter } from "express";
import { db, medicalRecordsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { VerifyCodeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/:uuid", async (req, res): Promise<void> => {
  const { uuid } = req.params;

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.uuid, uuid)).limit(1);
    const record = records[0];

    res.json({ uuid, found: !!record });
  } catch (err) {
    req.log.error({ err }, "Get verify info error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:uuid/check", async (req, res): Promise<void> => {
  const { uuid } = req.params;
  const parsed = VerifyCodeBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }

  try {
    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.uuid, uuid)).limit(1);
    const record = records[0];

    if (!record) {
      res.status(404).json({ error: "Not found", message: "Hujjat topilmadi" });
      return;
    }

    if (record.verifyCode !== parsed.data.code) {
      res.status(401).json({ error: "Wrong code", message: "Noto'g'ri kod" });
      return;
    }

    const patients = await db.select().from(patientsTable).where(eq(patientsTable.id, record.patientId)).limit(1);
    const patient = patients[0];

    res.json({
      valid: true,
      patient: patient ? {
        ...patient,
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString(),
      } : undefined,
      medicalRecord: {
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
      message: "Hujjat tasdiqlandi",
    });
  } catch (err) {
    req.log.error({ err }, "Verify code error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
