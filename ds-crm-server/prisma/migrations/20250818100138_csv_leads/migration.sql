-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'COMMENT', 'SHIP_LATER', 'DELIVERED', 'RETURNED');

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "batchName" TEXT,
    "source" TEXT,
    "status" TEXT,
    "items" TEXT[],
    "price" INTEGER NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "public"."leads"("assignedToId");

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
