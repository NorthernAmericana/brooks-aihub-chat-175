DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'UserLocation'
  ) THEN
    ALTER TABLE "UserLocation"
      ADD CONSTRAINT "UserLocation_home_location_route_check"
      CHECK ("locationType" <> 'home-location' OR "route" = '/MyCarMindATO/');
  END IF;
END $$;
