ALTER TABLE "UserLocation"
  ADD CONSTRAINT "UserLocation_home_location_route_check"
  CHECK ("locationType" <> 'home-location' OR "route" = '/MyCarMindATO/');
