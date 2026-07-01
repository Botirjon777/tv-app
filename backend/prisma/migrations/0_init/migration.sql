-- CreateEnum
CREATE TYPE "device_type" AS ENUM ('android_tv', 'tizen');

-- CreateEnum
CREATE TYPE "content_type" AS ENUM ('background', 'announcement', 'menu_item', 'promo');

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "timezone" VARCHAR(60) NOT NULL,
    "default_language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "floor" SMALLINT,
    "device_token" VARCHAR(64) NOT NULL,
    "device_type" "device_type" NOT NULL,
    "background_url" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_guests" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "exely_reservation_id" VARCHAR(64) NOT NULL,
    "guest_first_name" VARCHAR(100) NOT NULL,
    "guest_last_name" VARCHAR(100) NOT NULL,
    "guest_language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_services" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "icon_url" TEXT,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "deep_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_content" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "content_type" "content_type" NOT NULL,
    "title" JSONB,
    "body" JSONB,
    "media_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_from" TIMESTAMP(3),
    "display_until" TIMESTAMP(3),
    "priority" VARCHAR(20) DEFAULT 'info',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_cache" (
    "city_key" VARCHAR(100) NOT NULL,
    "data" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_cache_pkey" PRIMARY KEY ("city_key")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL DEFAULT 'en',
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sourceLang" TEXT NOT NULL DEFAULT 'en',
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "descI18n" TEXT NOT NULL DEFAULT '{}',
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_recommendations" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "floors" INTEGER NOT NULL DEFAULT 1,
    "roomsPerFloor" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "tripadvisorUrl" TEXT NOT NULL DEFAULT '',
    "googleMapsUrl" TEXT NOT NULL DEFAULT '',
    "yandexMapsUrl" TEXT NOT NULL DEFAULT '',
    "wifiName" TEXT NOT NULL DEFAULT '',
    "wifiPassword" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "telegramUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "guestName" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT NOT NULL DEFAULT '',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'web',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_rooms" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "floor" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_orders" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT NOT NULL DEFAULT '',
    "total" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "menu_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_guests" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT '',
    "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_device_token_key" ON "rooms"("device_token");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hotel_id_room_number_key" ON "rooms"("hotel_id", "room_number");

-- CreateIndex
CREATE INDEX "menu_products_categoryId_idx" ON "menu_products"("categoryId");

-- CreateIndex
CREATE INDEX "menu_recommendations_dayOfWeek_idx" ON "menu_recommendations"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "menu_recommendations_dayOfWeek_productId_key" ON "menu_recommendations"("dayOfWeek", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_hotels_slug_key" ON "menu_hotels"("slug");

-- CreateIndex
CREATE INDEX "service_requests_hotelId_idx" ON "service_requests"("hotelId");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- CreateIndex
CREATE INDEX "menu_rooms_hotelId_idx" ON "menu_rooms"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_rooms_hotelId_number_key" ON "menu_rooms"("hotelId", "number");

-- CreateIndex
CREATE INDEX "menu_orders_roomId_idx" ON "menu_orders"("roomId");

-- CreateIndex
CREATE INDEX "menu_orders_status_idx" ON "menu_orders"("status");

-- CreateIndex
CREATE INDEX "menu_orders_createdAt_idx" ON "menu_orders"("createdAt");

-- CreateIndex
CREATE INDEX "menu_order_items_orderId_idx" ON "menu_order_items"("orderId");

-- CreateIndex
CREATE INDEX "menu_guests_hotelId_roomNumber_idx" ON "menu_guests"("hotelId", "roomNumber");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_guests" ADD CONSTRAINT "room_guests_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_services" ADD CONSTRAINT "hotel_services_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_content" ADD CONSTRAINT "hotel_content_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_products" ADD CONSTRAINT "menu_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_recommendations" ADD CONSTRAINT "menu_recommendations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "menu_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "menu_hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_rooms" ADD CONSTRAINT "menu_rooms_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "menu_hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_orders" ADD CONSTRAINT "menu_orders_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "menu_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_order_items" ADD CONSTRAINT "menu_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "menu_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_order_items" ADD CONSTRAINT "menu_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "menu_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_guests" ADD CONSTRAINT "menu_guests_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "menu_hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

