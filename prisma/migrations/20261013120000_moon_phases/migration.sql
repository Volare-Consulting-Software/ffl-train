-- CreateTable
CREATE TABLE "moon_phases" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "illuminationPercent" INTEGER NOT NULL,
    "phaseName" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moon_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moon_phases_date_key" ON "moon_phases"("date");
