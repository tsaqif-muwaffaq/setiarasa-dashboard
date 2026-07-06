import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdmin() {
  // 👇 UBAH EMAIL DAN PASSWORD DI SINI SESUAI KEINGINAN LU 👇
  const emailBaru = "admin@setiarasa.com"; 
  const passwordBaru = "setiarasa123"; 
  
  try {
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    const ownerAccount = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });

    if (!ownerAccount) {
      console.log("Akun Owner belum ada, membuat baru...");
      await prisma.user.create({
        data: {
          name: "Owner Setia Rasa",
          email: emailBaru,
          password: hashedPassword,
          role: "OWNER"
        }
      });
    } else {
      console.log("Mengupdate akun Owner yang sudah ada...");
      await prisma.user.update({
        where: { id: ownerAccount.id },
        data: {
          email: emailBaru,
          password: hashedPassword
        }
      });
    }

    console.log("✅ Sukses! Silakan login dengan:");
    console.log("Email:", emailBaru);
    console.log("Password:", passwordBaru);
  } catch (error) {
    console.error("Gagal reset admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();