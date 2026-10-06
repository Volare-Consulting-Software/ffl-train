-- CreateTable
CREATE TABLE "airports" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "date_usages" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_imports" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_quotes" (
    "id" SERIAL NOT NULL,
    "airportCode" TEXT NOT NULL,
    "flightDate" DATE NOT NULL,
    "priceUsd" INTEGER,
    "connections" INTEGER,
    "durationMinutes" INTEGER,
    "flightDistanceMiles" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB NOT NULL,

    CONSTRAINT "flight_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picks" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "pickerTeamId" INTEGER NOT NULL,
    "pickerName" TEXT NOT NULL,
    "stationCode" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_calendars" (
    "serviceId" TEXT NOT NULL,
    "weekdays" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "service_calendars_pkey" PRIMARY KEY ("serviceId")
);

-- CreateTable
CREATE TABLE "shapes" (
    "id" TEXT NOT NULL,
    "points" JSONB NOT NULL,

    CONSTRAINT "shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "stop_times" (
    "tripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "stationCode" TEXT NOT NULL,
    "arrivalSeconds" INTEGER NOT NULL,
    "departureSeconds" INTEGER NOT NULL,
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "shapeIndex" INTEGER,

    CONSTRAINT "stop_times_pkey" PRIMARY KEY ("tripId","sequence")
);

-- CreateTable
CREATE TABLE "train_routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "train_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "trainNumber" TEXT NOT NULL,
    "headsign" TEXT NOT NULL,
    "shapeId" TEXT,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "date_usages_clientId_weekStart_idx" ON "date_usages"("clientId", "weekStart");

-- CreateIndex
CREATE INDEX "date_usages_departureDate_idx" ON "date_usages"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "date_usages_clientId_departureDate_key" ON "date_usages"("clientId", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "flight_quotes_airportCode_flightDate_key" ON "flight_quotes"("airportCode", "flightDate");

-- CreateIndex
CREATE UNIQUE INDEX "picks_season_week_key" ON "picks"("season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "picks_season_pickerTeamId_key" ON "picks"("season", "pickerTeamId");

-- CreateIndex
CREATE INDEX "stop_times_stationCode_idx" ON "stop_times"("stationCode");

-- CreateIndex
CREATE INDEX "trips_serviceId_idx" ON "trips"("serviceId");

-- AddForeignKey
ALTER TABLE "stop_times" ADD CONSTRAINT "stop_times_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "train_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
