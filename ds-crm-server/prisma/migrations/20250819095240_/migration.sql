/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "leads_phone_key" ON "public"."leads"("phone");
