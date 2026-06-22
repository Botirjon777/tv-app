import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type L = { en: string; ru: string; uz: string };

// Floor-based room generator (mirrors src/lib/slug.ts generateRooms).
function generateRooms(floors: number, roomsPerFloor: number) {
  const rooms: { number: string; floor: number; name: string }[] = [];
  for (let floor = 1; floor <= floors; floor++) {
    for (let r = 1; r <= roomsPerFloor; r++) {
      const number = `${floor}${String(r).padStart(2, "0")}`;
      rooms.push({ number, floor, name: `Room ${number}` });
    }
  }
  return rooms;
}

const HOTELS = [
  {
    name: "Grand Plaza Hotel",
    slug: "grand-plaza",
    floors: 3,
    roomsPerFloor: 6,
    logoUrl: "",
    tripadvisorUrl: "https://www.tripadvisor.com/",
    googleMapsUrl: "https://maps.google.com/",
    yandexMapsUrl: "https://yandex.com/maps/",
    wifiName: "GrandPlaza_Guest",
    wifiPassword: "welcome2024",
    instagramUrl: "https://instagram.com/",
    telegramUrl: "https://t.me/",
  },
  {
    name: "Seaside Resort",
    slug: "seaside-resort",
    floors: 2,
    roomsPerFloor: 5,
    logoUrl: "",
    tripadvisorUrl: "https://www.tripadvisor.com/",
    googleMapsUrl: "https://maps.google.com/",
    yandexMapsUrl: "https://yandex.com/maps/",
    wifiName: "Seaside_Guest",
    wifiPassword: "seaview123",
    instagramUrl: "https://instagram.com/",
    telegramUrl: "https://t.me/",
  },
];

// Prices are integer UZS (so'm).
const MENU: {
  category: L;
  products: { name: L; desc: L; price: number; imageUrl: string }[];
}[] = [
  {
    category: { en: "Breakfast", ru: "Завтрак", uz: "Nonushta" },
    products: [
      {
        name: {
          en: "Continental Breakfast",
          ru: "Континентальный завтрак",
          uz: "Kontinental nonushta",
        },
        desc: {
          en: "Croissant, fresh fruit, yogurt, orange juice & coffee.",
          ru: "Круассан, свежие фрукты, йогурт, апельсиновый сок и кофе.",
          uz: "Kruassan, yangi mevalar, yogurt, apelsin sharbati va qahva.",
        },
        price: 185000,
        imageUrl:
          "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
      },
      {
        name: { en: "Eggs Benedict", ru: "Яйца Бенедикт", uz: "Benedikt tuxumi" },
        desc: {
          en: "Poached eggs, hollandaise, ham on toasted muffin.",
          ru: "Яйца пашот, голландский соус и ветчина на тостовом маффине.",
          uz: "Poshirovka tuxum, gollandiya sousi va vetchina tost ustida.",
        },
        price: 205000,
        imageUrl:
          "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
      },
      {
        name: { en: "Pancake Stack", ru: "Стопка панкейков", uz: "Pancake to‘plami" },
        desc: {
          en: "Buttermilk pancakes, maple syrup & seasonal berries.",
          ru: "Панкейки на пахте с кленовым сиропом и сезонными ягодами.",
          uz: "Pancake'lar, klyon siropi va mavsumiy rezavorlar bilan.",
        },
        price: 155000,
        imageUrl:
          "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
      },
    ],
  },
  {
    category: {
      en: "Starters",
      ru: "Закуски",
      uz: "Boshlang‘ich taomlar",
    },
    products: [
      {
        name: { en: "Caesar Salad", ru: "Салат Цезарь", uz: "Sezar salati" },
        desc: {
          en: "Romaine, parmesan, croutons & classic Caesar dressing.",
          ru: "Романо, пармезан, гренки и классическая заправка Цезарь.",
          uz: "Romano, parmezan, kruton va klassik Sezar sousi.",
        },
        price: 140000,
        imageUrl:
          "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80",
      },
      {
        name: { en: "Tomato Soup", ru: "Томатный суп", uz: "Pomidor sho‘rvasi" },
        desc: {
          en: "Roasted tomato & basil with a swirl of cream.",
          ru: "Запечённые томаты и базилик со сливками.",
          uz: "Tandirda pishirilgan pomidor va rayhon, qaymoq bilan.",
        },
        price: 110000,
        imageUrl:
          "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
      },
      {
        name: { en: "Bruschetta", ru: "Брускетта", uz: "Brusketta" },
        desc: {
          en: "Grilled sourdough, tomato, garlic & olive oil.",
          ru: "Гриль чиабатта с томатами, чесноком и оливковым маслом.",
          uz: "Grildagi non, pomidor, sarimsoq va zaytun moyi bilan.",
        },
        price: 115000,
        imageUrl:
          "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800&q=80",
      },
    ],
  },
  {
    category: {
      en: "Main Courses",
      ru: "Основные блюда",
      uz: "Asosiy taomlar",
    },
    products: [
      {
        name: {
          en: "Grilled Ribeye Steak",
          ru: "Стейк Рибай на гриле",
          uz: "Grilda Ribay steyk",
        },
        desc: {
          en: "300g ribeye, peppercorn sauce & truffle fries.",
          ru: "300 г рибай, перечный соус и трюфельный картофель фри.",
          uz: "300 g ribay, qalampir sousi va trüfelli fri kartoshka.",
        },
        price: 410000,
        imageUrl:
          "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80",
      },
      {
        name: {
          en: "Margherita Pizza",
          ru: "Пицца Маргарита",
          uz: "Margarita pitsasi",
        },
        desc: {
          en: "San Marzano tomato, mozzarella & fresh basil.",
          ru: "Томаты Сан-Марцано, моцарелла и свежий базилик.",
          uz: "San-Marsano pomidori, motsarella va yangi rayhon.",
        },
        price: 190000,
        imageUrl:
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
      },
      {
        name: { en: "Grilled Salmon", ru: "Лосось на гриле", uz: "Grilda losos" },
        desc: {
          en: "Atlantic salmon, lemon butter & seasonal vegetables.",
          ru: "Атлантический лосось, лимонное масло и сезонные овощи.",
          uz: "Atlantika lososi, limonli sariyog‘ va mavsumiy sabzavotlar.",
        },
        price: 310000,
        imageUrl:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
      },
      {
        name: {
          en: "Spaghetti Carbonara",
          ru: "Спагетти Карбонара",
          uz: "Spagetti Karbonara",
        },
        desc: {
          en: "Guanciale, egg, pecorino & cracked black pepper.",
          ru: "Гуанчиале, яйцо, пекорино и чёрный перец.",
          uz: "Guanchiale, tuxum, pekorino va qora qalampir.",
        },
        price: 220000,
        imageUrl:
          "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
      },
      {
        name: { en: "Chicken Burger", ru: "Куриный бургер", uz: "Tovuqli burger" },
        desc: {
          en: "Crispy chicken, slaw, brioche bun & fries.",
          ru: "Хрустящая курица, капустный салат, булочка бриошь и фри.",
          uz: "Xrustaki tovuq, karam salati, brioş bulochka va fri kartoshka.",
        },
        price: 205000,
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
      },
    ],
  },
  {
    category: { en: "Desserts", ru: "Десерты", uz: "Shirinliklar" },
    products: [
      {
        name: {
          en: "Chocolate Lava Cake",
          ru: "Шоколадный фондан",
          uz: "Shokoladli lava tort",
        },
        desc: {
          en: "Warm molten chocolate cake & vanilla ice cream.",
          ru: "Тёплый шоколадный кекс с ванильным мороженым.",
          uz: "Issiq shokoladli tort va vanilli muzqaymoq.",
        },
        price: 115000,
        imageUrl:
          "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
      },
      {
        name: { en: "Tiramisu", ru: "Тирамису", uz: "Tiramisu" },
        desc: {
          en: "Espresso-soaked ladyfingers & mascarpone cream.",
          ru: "Савоярди в эспрессо и крем маскарпоне.",
          uz: "Espresso shimdirilgan savoyardi va maskarpone kremi.",
        },
        price: 110000,
        imageUrl:
          "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80",
      },
      {
        name: { en: "Cheesecake", ru: "Чизкейк", uz: "Chizkeyk" },
        desc: {
          en: "New York style with a berry compote.",
          ru: "Нью-йоркский чизкейк с ягодным компоте.",
          uz: "Nyu-York uslubidagi chizkeyk, rezavor sousi bilan.",
        },
        price: 100000,
        imageUrl:
          "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80",
      },
    ],
  },
  {
    category: { en: "Drinks", ru: "Напитки", uz: "Ichimliklar" },
    products: [
      {
        name: {
          en: "Fresh Orange Juice",
          ru: "Свежий апельсиновый сок",
          uz: "Yangi apelsin sharbati",
        },
        desc: {
          en: "Freshly squeezed oranges.",
          ru: "Свежевыжатые апельсины.",
          uz: "Yangi siqilgan apelsinlar.",
        },
        price: 65000,
        imageUrl:
          "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80",
      },
      {
        name: { en: "Cappuccino", ru: "Капучино", uz: "Kapuchino" },
        desc: {
          en: "Double espresso & steamed milk.",
          ru: "Двойной эспрессо и вспененное молоко.",
          uz: "Ikkita espresso va ko‘pirtirilgan sut.",
        },
        price: 58000,
        imageUrl:
          "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80",
      },
      {
        name: { en: "Sparkling Water", ru: "Газированная вода", uz: "Gazli suv" },
        desc: {
          en: "Chilled 500ml bottle.",
          ru: "Охлаждённая бутылка 500 мл.",
          uz: "Sovutilgan 500 ml shisha.",
        },
        price: 38000,
        imageUrl:
          "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=800&q=80",
      },
      {
        name: {
          en: "House Red Wine",
          ru: "Домашнее красное вино",
          uz: "Uy qizil vinosi",
        },
        desc: {
          en: "Glass of our selected red.",
          ru: "Бокал нашего фирменного красного.",
          uz: "Bizning tanlangan qizil vinomiz, bir bokal.",
        },
        price: 115000,
        imageUrl:
          "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding hotel-menu database…");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();

  // English product name -> id, for wiring up recommendations below.
  const productIdByName: Record<string, string> = {};

  for (let c = 0; c < MENU.length; c++) {
    const group = MENU[c];
    const category = await prisma.category.create({
      data: {
        name: group.category.en,
        sourceLang: "en",
        nameI18n: JSON.stringify(group.category),
        sortOrder: c,
      },
    });
    for (let p = 0; p < group.products.length; p++) {
      const prod = group.products[p];
      const created = await prisma.product.create({
        data: {
          name: prod.name.en,
          description: prod.desc.en,
          sourceLang: "en",
          nameI18n: JSON.stringify(prod.name),
          descI18n: JSON.stringify(prod.desc),
          price: prod.price,
          imageUrl: prod.imageUrl,
          sortOrder: p,
          categoryId: category.id,
        },
      });
      productIdByName[prod.name.en] = created.id;
    }
  }

  // Recommendation of the day (0=Sunday … 6=Saturday).
  const RECS: Record<number, string[]> = {
    1: ["Grilled Ribeye Steak"],
    2: ["Spaghetti Carbonara"],
    3: ["Margherita Pizza"],
    4: ["Grilled Salmon"],
    5: ["Chicken Burger"],
    6: ["Eggs Benedict", "Pancake Stack"],
    0: ["Chocolate Lava Cake", "Continental Breakfast"],
  };
  for (const [dow, names] of Object.entries(RECS)) {
    for (let i = 0; i < names.length; i++) {
      const productId = productIdByName[names[i]];
      if (!productId) continue;
      await prisma.recommendation.create({
        data: { dayOfWeek: Number(dow), productId, sortOrder: i },
      });
    }
  }

  for (const h of HOTELS) {
    await prisma.hotel.create({
      data: {
        name: h.name,
        slug: h.slug,
        floors: h.floors,
        roomsPerFloor: h.roomsPerFloor,
        logoUrl: h.logoUrl,
        tripadvisorUrl: h.tripadvisorUrl,
        googleMapsUrl: h.googleMapsUrl,
        yandexMapsUrl: h.yandexMapsUrl,
        wifiName: h.wifiName,
        wifiPassword: h.wifiPassword,
        instagramUrl: h.instagramUrl,
        telegramUrl: h.telegramUrl,
        rooms: { create: generateRooms(h.floors, h.roomsPerFloor) },
      },
    });
  }

  const productCount = await prisma.product.count();
  const hotelCount = await prisma.hotel.count();
  const roomCount = await prisma.room.count();
  const recCount = await prisma.recommendation.count();
  console.log(
    `✅ Seeded ${MENU.length} categories, ${productCount} products, ${hotelCount} hotels, ${roomCount} rooms, ${recCount} recommendations (en/ru/uz).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
