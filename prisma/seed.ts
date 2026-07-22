import { PrismaClient, Role, ProductStatus, AppointmentStatus } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("sherift09", 12);

  const branch = await prisma.branch.upsert({
    where: { slug: "providencia" },
    update: { name: "Vikingos Providencia" },
    create: {
      name: "Vikingos Providencia",
      slug: "providencia",
      address: "Av. Nueva Providencia 1881",
      commune: "Providencia",
      city: "Santiago",
      phone: "+56 2 2345 6789",
      whatsapp: "+56 9 1234 5678",
      openingTime: "09:00",
      closingTime: "20:00",
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85"
    }
  });

  const branch2 = await prisma.branch.upsert({
    where: { slug: "las-condes" },
    update: { name: "Vikingos Las Condes" },
    create: {
      name: "Vikingos Las Condes",
      slug: "las-condes",
      address: "Av. Apoquindo 4615",
      commune: "Las Condes",
      city: "Santiago",
      phone: "+56 2 2765 4321",
      whatsapp: "+56 9 1234 5678",
      openingTime: "10:00",
      closingTime: "21:00",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85"
    }
  });

  await prisma.user.deleteMany({ where: { email: "admin@vikingos.cl" } });
  await prisma.user.upsert({
    where: { email: "ignacio.ypezoa@gmail.com" },
    update: { passwordHash, name: "Ignacio Ypezoa", role: Role.ADMIN, active: true },
    create: {
      name: "Ignacio Ypezoa",
      email: "ignacio.ypezoa@gmail.com",
      passwordHash,
      role: Role.ADMIN
    }
  });

  const serviceSeeds = [
    ["Corte Signature", "corte-signature", "Asesoría, lavado, corte y styling final.", "Cabello", 45, 18990, "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85"],
    ["Barba Ritual", "barba-ritual", "Perfilado, toallas calientes y tratamiento hidratante.", "Barba", 30, 14990, "https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?auto=format&fit=crop&w=900&q=85"],
    ["Corte + Barba", "corte-barba", "La experiencia completa para renovar tu estilo.", "Combos", 75, 29990, "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=85"],
    ["Limpieza Facial", "limpieza-facial", "Limpieza profunda, exfoliación y mascarilla.", "Cuidado", 35, 17990, "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=85"]
  ] as const;

  const services = [];
  for (const [name, slug, description, category, duration, price, image] of serviceSeeds) {
    services.push(await prisma.service.upsert({
      where: { slug },
      update: { category },
      create: { name, slug, description, category, duration, price, image }
    }));
  }

  const barberSeeds = [
    ["Tomás", "Silva", "tomas-silva", "Cortes clásicos", "Precisión, conversación y doce años dominando la tijera.", branch.id, "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=85"],
    ["Matías", "Rojas", "matias-rojas", "Fade & textura", "Especialista en degradados y estilos urbanos contemporáneos.", branch.id, "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=85"],
    ["Benjamín", "Vega", "benjamin-vega", "Barba y afeitado", "El ritual tradicional llevado a una experiencia moderna.", branch2.id, "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=700&q=85"]
  ] as const;

  const barbers = [];
  for (const [firstName, lastName, slug, specialty, bio, branchId, photo] of barberSeeds) {
    const barber = await prisma.barber.upsert({
      where: { slug },
      update: {},
      create: { firstName, lastName, slug, specialty, bio, branchId, photo }
    });
    barbers.push(barber);
    for (const service of services) {
      await prisma.barberService.upsert({
        where: { barberId_serviceId: { barberId: barber.id, serviceId: service.id } },
        update: {},
        create: { barberId: barber.id, serviceId: service.id }
      });
    }
    for (let day = 1; day <= 6; day++) {
      const existing = await prisma.schedule.findFirst({ where: { barberId: barber.id, dayOfWeek: day } });
      if (!existing) {
        await prisma.schedule.create({
          data: { barberId: barber.id, branchId, dayOfWeek: day, startTime: "09:00", endTime: "20:00" }
        });
      }
    }
  }

  const categories = {
    cabello: await prisma.productCategory.upsert({ where: { slug: "cabello" }, update: {}, create: { name: "Cabello", slug: "cabello" } }),
    barba: await prisma.productCategory.upsert({ where: { slug: "barba" }, update: {}, create: { name: "Barba", slug: "barba" } }),
    cuidado: await prisma.productCategory.upsert({ where: { slug: "cuidado" }, update: {}, create: { name: "Cuidado", slug: "cuidado" } })
  };

  const products = [
    ["Pomada Matte", "pomada-matte", "POM-MAT-001", "Fijación flexible y acabado natural sin brillo.", "Vikingos", 12990, 18, categories.cabello.id, "https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&w=700&q=85"],
    ["Aceite de Barba", "aceite-barba", "ACE-BAR-001", "Nutre, suaviza y entrega un aroma amaderado.", "Vikingos", 10990, 6, categories.barba.id, "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85"],
    ["Shampoo Detox", "shampoo-detox", "SHA-DET-001", "Limpieza profunda para uso diario.", "Reuzel", 15990, 12, categories.cuidado.id, "https://images.unsplash.com/photo-1585232351009-aa87416fca90?auto=format&fit=crop&w=700&q=85"],
    ["Bálsamo After Shave", "after-shave", "BAL-AFT-001", "Calma e hidrata después del afeitado.", "Vikingos", 13990, 4, categories.cuidado.id, "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=85"]
  ] as const;

  for (const [name, slug, sku, description, brand, price, stock, categoryId, image] of products) {
    await prisma.product.upsert({
      where: { slug },
      update: { sku, brand },
      create: { name, slug, sku, description, brand, price, stock, categoryId, image, status: ProductStatus.ACTIVE }
    });
  }

  await prisma.shippingMethod.upsert({
    where: { id: "pickup" },
    update: {},
    create: { id: "pickup", name: "Retiro en tienda", description: "Disponible en 24 horas", price: 0, isPickup: true }
  });
  await prisma.shippingMethod.upsert({
    where: { id: "delivery" },
    update: {},
    create: { id: "delivery", name: "Despacho RM", description: "Entrega de 2 a 4 días hábiles", price: 3990 }
  });

  await prisma.businessConfig.upsert({
    where: { id: "main" },
    update: {
      businessName: "Vikingos",
      phone: "+56 2 2345 6789",
      email: "hola@vikingos.cl",
      instagram: "vikingosbarbershop",
      facebook: "vikingosbarbershop",
      whatsapp: "+56 9 1234 5678",
      address: "Santiago, Chile",
      heroTitle: "Tu estilo. Nuestro oficio.",
      heroSubtitle: "Una experiencia diseñada al detalle: técnica, pausa y atención genuina.",
      heroImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=90",
      generalHours: "Lunes a sábado · 09:00–20:00"
    },
    create: {
      businessName: "Vikingos",
      phone: "+56 2 2345 6789",
      email: "hola@vikingos.cl",
      instagram: "vikingosbarbershop",
      facebook: "vikingosbarbershop",
      whatsapp: "+56 9 1234 5678",
      address: "Santiago, Chile",
      heroTitle: "Tu estilo. Nuestro oficio.",
      heroSubtitle: "Una experiencia diseñada al detalle: técnica, pausa y atención genuina.",
      heroImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=90",
      generalHours: "Lunes a sábado · 09:00–20:00"
    }
  });

  await prisma.emailConfig.upsert({
    where: { id: "main" },
    update: { fromName: "Vikingos" },
    create: {
      id: "main",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      smtpSecure: false,
      fromEmail: "reservas@vikingos.cl",
      fromName: "Vikingos",
      adminEmail: "ignacio.ypezoa@gmail.com",
      enabled: false
    }
  });

  await prisma.advancedConfig.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" }
  });

  const loyaltySeeds = [
    { id: "five-visits", name: "Cliente Frecuente", visits: 5, points: 50, rewardType: "DISCOUNT", rewardValue: 10, description: "10% de descuento al completar 5 visitas." },
    { id: "ten-visits", name: "Corte de la Casa", visits: 10, points: 100, rewardType: "FREE_SERVICE", rewardValue: 100, description: "Un corte gratis al completar 10 visitas." },
    { id: "twenty-visits", name: "Vikingo Legendario", visits: 20, points: 200, rewardType: "PREMIUM_SERVICE", rewardValue: 100, description: "Servicio premium al completar 20 visitas." }
  ];
  for (const tier of loyaltySeeds) {
    await prisma.loyaltyTier.upsert({ where: { id: tier.id }, update: tier, create: tier });
  }

  const customer = await prisma.customer.upsert({
    where: { email_phone: { email: "cliente@demo.cl", phone: "+56987654321" } },
    update: {},
    create: { name: "Cliente Demo", email: "cliente@demo.cl", phone: "+56987654321" }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const endAt = new Date(tomorrow.getTime() + services[0].duration * 60000);
  await prisma.appointment.upsert({
    where: { code: "VK-DEMO01" },
    update: {},
    create: {
      code: "VK-DEMO01",
      customerId: customer.id,
      branchId: branch.id,
      barberId: barbers[0].id,
      serviceId: services[0].id,
      startAt: tomorrow,
      endAt,
      status: AppointmentStatus.CONFIRMED
    }
  });
}

main()
  .then(() => console.log("Seed completado"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
