-- DropTable
DROP TABLE "flight_quotes";

-- CreateTable
CREATE TABLE "flight_searches" (
    "id" SERIAL NOT NULL,
    "airportCode" TEXT NOT NULL,
    "flightDate" DATE NOT NULL,
    "flightDistanceMiles" DOUBLE PRECISION NOT NULL,
    "itineraries" JSONB NOT NULL,
    "googleFlightsUrl" TEXT,
    "raw" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flight_searches_airportCode_flightDate_key" ON "flight_searches"("airportCode", "flightDate");
