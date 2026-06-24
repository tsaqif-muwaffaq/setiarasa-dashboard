import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding database...');

  const ownerEmail = 'admin@setiarasa.web.id'; // Ganti email jika perlu
  const ownerPassword = 'passwordRahasia123'; // Ganti dengan password yang aman

  // Cek apakah akun owner sudah ada untuk mencegah duplikasi
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (existingOwner) {
    console.log('Akun Owner sudah terdaftar di database.');
    return;
  }

  // Enkripsi password menggunakan bcrypt (Salt rounds: 10)
  const hashedPassword = await bcrypt.hash(ownerPassword, 10);

  // Simpan data Owner ke database PostgreSQL
  const newOwner = await prisma.user.create({
    data: {
      name: 'Owner Setia Rasa',
      email: ownerEmail,
      password: hashedPassword,
      role: 'OWNER', // Sesuai dengan ENUM di schema.prisma
    },
  });

  console.log(`✅ Berhasil! Akun Owner telah dibuat.`);
  console.log(`Email: ${newOwner.email}`);
  console.log(`Role: ${newOwner.role}`);
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Putuskan koneksi database setelah selesai
    await prisma.$disconnect();
  });