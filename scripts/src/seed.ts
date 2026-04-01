import { db, usersTable, patientsTable, medicalRecordsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(usersTable).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    process.exit(0);
  }

  const superAdminHash = await bcrypt.hash("admin123", 10);
  const doctorHash = await bcrypt.hash("doctor123", 10);
  const staffHash = await bcrypt.hash("staff123", 10);

  const [superAdmin] = await db.insert(usersTable).values({
    name: "Super Admin",
    username: "admin",
    email: "admin@tibbiy.uz",
    passwordHash: superAdminHash,
    role: "super_admin",
    isActive: true,
  }).returning();

  const [doctor1] = await db.insert(usersTable).values({
    name: "Dr. Alisher Karimov",
    username: "dr.alisher",
    email: "alisher@tibbiy.uz",
    passwordHash: doctorHash,
    role: "doctor",
    isActive: true,
  }).returning();

  const [doctor2] = await db.insert(usersTable).values({
    name: "Dr. Malika Yusupova",
    username: "dr.malika",
    email: "malika@tibbiy.uz",
    passwordHash: doctorHash,
    role: "doctor",
    isActive: true,
  }).returning();

  await db.insert(usersTable).values({
    name: "Xodim Dilnoza",
    username: "staff1",
    email: "dilnoza@tibbiy.uz",
    passwordHash: staffHash,
    role: "staff",
    isActive: true,
  });

  await db.insert(usersTable).values({
    name: "Abdullayev Admin",
    username: "admin2",
    email: "admin2@tibbiy.uz",
    passwordHash: superAdminHash,
    role: "admin",
    isActive: true,
  });

  const [patient1] = await db.insert(patientsTable).values({
    fullName: "Toshmatov Akbar Salimovich",
    passport: "AB1234567",
    jshshir: "12345678901234",
    birthDate: "1985-03-15",
    phone: "+998901234567",
    status: "approved",
    createdById: superAdmin.id,
  }).returning();

  const [patient2] = await db.insert(patientsTable).values({
    fullName: "Ergasheva Zulfiya Hamidovna",
    passport: "CD7654321",
    jshshir: "98765432109876",
    birthDate: "1990-07-22",
    phone: "+998901234568",
    status: "pending",
    createdById: superAdmin.id,
  }).returning();

  await db.insert(patientsTable).values({
    fullName: "Mirzayev Jasur Bekmurodovich",
    passport: "EF1122334",
    jshshir: "11223344556677",
    birthDate: "1978-11-05",
    phone: "+998901234569",
    status: "draft",
    createdById: superAdmin.id,
  });

  const uuid1 = uuidv4();
  const verifyCode1 = "123456";
  const qrCode1 = await QRCode.toDataURL(`https://example.com/verify/${uuid1}`);

  await db.insert(medicalRecordsTable).values({
    patientId: patient1.id,
    status: "approved",
    doctorId: doctor1.id,
    chairmanId: doctor2.id,
    checkDate: "2024-01-15",
    nextCheckDate: "2025-01-15",
    decision: "allowed",
    uuid: uuid1,
    verifyCode: verifyCode1,
    qrCode: qrCode1,
  });

  await db.insert(medicalRecordsTable).values({
    patientId: patient2.id,
    status: "pending",
    doctorId: doctor1.id,
    checkDate: "2024-01-20",
  });

  console.log("Seeding completed!");
  console.log("Login credentials:");
  console.log("  Super Admin: admin / admin123");
  console.log("  Doctor: dr.alisher / doctor123");
  console.log("  Staff: staff1 / staff123");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
