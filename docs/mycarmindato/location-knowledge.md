# MyCarMindATO USA Location Knowledge Base

This document merges the national reference list of U.S. cities with the MyCarMindATO Season 1 city dataset so the agent can ground responses in a wider geographic vocabulary while still prioritizing its detailed city profiles.

## MyCarMindATO Agent Usage Notes

- Use the **Season 1 detailed city profiles** for high-confidence answers when a city is present in `season-1-cities.json`.
- If a user mentions a U.S. city **not** in `season-1-cities.json`, explicitly say the city is not yet in the internal database and perform a web search to fill any missing details before responding.
- This document is intended for the MyCarMindATO agentic route and should be referenced when the agent needs broader U.S. location recognition.
- Business coverage is still expanding (today we only have curated sections like thrift shops and coffee shops in some cities), so call out gaps and avoid implying full business coverage when it is not present.

## Source Inputs

- `research/location-dictionary.md`: National reference list of U.S. cities and notable locations grouped by state.
- `data/mycarmindato/season-1-cities.json`: Detailed city profiles used by the MyCarMindATO agent workflow.

## MyCarMindATO Season 1 Detailed City Coverage

Total entries in `season-1-cities.json`: **210** (17 detailed cities + 193 baseline entries sourced from the national location dictionary).

### Detailed City Profiles

- Pensacola, Florida
- Huntsville, Alabama
- Birmingham, Alabama
- Montgomery, Alabama
- Mobile, Alabama
- Tuscaloosa, Alabama
- Hoover, Alabama
- Dothan, Alabama
- Auburn, Alabama
- Decatur, Alabama
- Madison, Alabama
- Jacksonville, Florida
- Miami, Florida
- Tampa, Florida
- Orlando, Florida
- St. Petersburg, Florida
- Pace/Milton/Avalon, Florida

### Baseline City Entries

The remaining entries in `season-1-cities.json` are baseline records sourced from the national location dictionary. They are valid U.S. cities but have minimal structured data until the full city profile (including businesses, anchors, and quest templates) is added.

## National USA Location Dictionary (State → Cities)

Use this list to expand geographic recognition beyond the detailed Season 1 profiles. It can be used for lightweight lookup, location disambiguation, and to identify future cities to enrich in `season-1-cities.json`. The list currently contains **200** city/location entries from the national reference source.

### Alabama

- Birmingham
- Mobile
- Montgomery
- Huntsville

### Alaska

- Anchorage
- Juneau
- Fairbanks
- Denali (Healy area)

### Arizona

- Phoenix
- Tucson
- Sedona
- Grand Canyon Village

### Arkansas

- Little Rock
- Hot Springs
- Bentonville
- Eureka Springs

### California

- Los Angeles
- San Francisco
- San Diego
- Yosemite Valley

### Colorado

- Denver
- Colorado Springs
- Aspen
- Rocky Mountain National Park (Estes Park)

### Connecticut

- Hartford
- New Haven
- Mystic
- Greenwich

### Delaware

- Wilmington
- Dover
- Rehoboth Beach
- Lewes

### Florida

- Miami
- Orlando
- Tampa
- Key West

### Georgia

- Atlanta
- Savannah
- Augusta
- Athens

### Hawaii

- Honolulu (Oahu)
- Lahaina (Maui)
- Hilo (Big Island)
- Līhuʻe (Kauai)

### Idaho

- Boise
- Coeur d’Alene
- Sun Valley (Ketchum)
- Idaho Falls

### Illinois

- Chicago
- Springfield
- Galena
- Starved Rock (Utica)

### Indiana

- Indianapolis
- Bloomington
- South Bend
- Brown County (Nashville)

### Iowa

- Des Moines
- Iowa City
- Dubuque
- Cedar Rapids

### Kansas

- Wichita
- Kansas City (KS)
- Lawrence
- Topeka

### Kentucky

- Louisville
- Lexington
- Bowling Green
- Paducah

### Louisiana

- New Orleans
- Baton Rouge
- Lafayette
- Shreveport

### Maine

- Portland
- Acadia (Bar Harbor)
- Kennebunkport
- Bangor

### Maryland

- Baltimore
- Annapolis
- Ocean City
- Frederick

### Massachusetts

- Boston
- Cape Cod (Provincetown)
- Salem
- Martha’s Vineyard

### Michigan

- Detroit
- Grand Rapids
- Traverse City
- Mackinac Island

### Minnesota

- Minneapolis
- Duluth
- Bloomington (Mall of America)
- Boundary Waters (Voyageurs NP area)

### Mississippi

- Jackson
- Biloxi
- Oxford
- Natchez

### Missouri

- St. Louis
- Kansas City
- Branson
- Hannibal

### Montana

- Billings
- Missoula
- West Yellowstone
- Glacier (Whitefish)

### Nebraska

- Omaha
- Lincoln
- Kearney
- Scottsbluff

### Nevada

- Las Vegas
- Reno
- Lake Tahoe
- Carson City

### New Hampshire

- Portsmouth
- Mount Washington Valley (North Conway)
- Hanover
- Manchester

### New Jersey

- Atlantic City
- Jersey City
- Princeton
- Cape May

### New Mexico

- Santa Fe
- Albuquerque
- Taos
- Carlsbad

### New York

- New York City
- Niagara Falls
- Lake Placid
- Albany

### North Carolina

- Charlotte
- Asheville
- Outer Banks (Kill Devil Hills)
- Raleigh

### North Dakota

- Fargo
- Bismarck
- Medora
- Minot

### Ohio

- Cleveland
- Cincinnati
- Columbus
- Hocking Hills

### Oklahoma

- Oklahoma City
- Tulsa
- Lawton (Mount Scott)
- Quapaw (Beavers Bend)

### Oregon

- Portland
- Crater Lake (Prospect)
- Bend
- Cannon Beach

### Pennsylvania

- Philadelphia
- Pittsburgh
- Lancaster (Amish Country)
- Gettysburg

### Rhode Island

- Providence
- Newport
- Block Island
- Narragansett

### South Carolina

- Charleston
- Myrtle Beach
- Columbia
- Greenville

### South Dakota

- Keystone (Mount Rushmore)
- Rapid City
- Badlands (Interior)
- Sioux Falls

### Tennessee

- Nashville
- Memphis
- Chattanooga
- Gatlinburg (Great Smoky Mountains)

### Texas

- Austin
- San Antonio
- Houston
- Dallas

### Utah

- Salt Lake City
- Zion National Park (Springdale)
- Arches National Park (Moab)
- Bryce Canyon (Tropic)

### Vermont

- Burlington
- Stowe
- Woodstock
- Montpelier

### Virginia

- Richmond
- Virginia Beach
- Shenandoah (Luray)
- Williamsburg

### Washington

- Seattle
- Olympic National Park (Port Angeles)
- Mount Rainier (Ashford)
- Spokane

### West Virginia

- Charleston
- Harpers Ferry
- Snowshoe
- Shepherdstown

### Wisconsin

- Milwaukee
- Madison
- Door County
- Wisconsin Dells

### Wyoming

- Jackson (Grand Teton)
- Jackson (Yellowstone)
- Cheyenne
- Cody
