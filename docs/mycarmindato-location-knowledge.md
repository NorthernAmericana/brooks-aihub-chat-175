# MyCarMindATO USA Location Knowledge Base

This document merges the national reference list of U.S. cities with the MyCarMindATO Season 1 city dataset so the agent can ground responses in a wider geographic vocabulary while still prioritizing its detailed city profiles.

## Source Inputs

- `research/location-dictionary.md`: National reference list of U.S. cities and notable locations grouped by state.
- `data/mycarmindato/season-1-cities.json`: Detailed city profiles used by the MyCarMindATO agent workflow.

## MyCarMindATO Season 1 Detailed City Coverage

Total entries in `season-1-cities.json`: **216** (includes full cities plus test/placeholder entries).

### City Entries (as stored in the dataset)

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
- Cedar Grove, Alabama
- Lakeside, Alabama
- Summit, Alabama
- Riverbend, Alaska
- Cedar Grove, Alaska
- Lakeside, Alaska
- Summit, Alaska
- Riverbend, Arizona
- Cedar Grove, Arizona
- Lakeside, Arizona
- Summit, Arizona
- Riverbend, Arkansas
- Cedar Grove, Arkansas
- Lakeside, Arkansas
- Summit, Arkansas
- Riverbend, California
- Cedar Grove, California
- Lakeside, California
- Summit, California
- Riverbend, Colorado
- Cedar Grove, Colorado
- Lakeside, Colorado
- Summit, Colorado
- Riverbend, Connecticut
- Cedar Grove, Connecticut
- Lakeside, Connecticut
- Summit, Connecticut
- Riverbend, Delaware
- Cedar Grove, Delaware
- Lakeside, Delaware
- Summit, Delaware
- Riverbend, Georgia
- Cedar Grove, Georgia
- Lakeside, Georgia
- Summit, Georgia
- Riverbend, Hawaii
- Cedar Grove, Hawaii
- Lakeside, Hawaii
- Summit, Hawaii
- Riverbend, Idaho
- Cedar Grove, Idaho
- Lakeside, Idaho
- Summit, Idaho
- Riverbend, Illinois
- Cedar Grove, Illinois
- Lakeside, Illinois
- Summit, Illinois
- Riverbend, Indiana
- Cedar Grove, Indiana
- Lakeside, Indiana
- Summit, Indiana
- Riverbend, Iowa
- Cedar Grove, Iowa
- Lakeside, Iowa
- Summit, Iowa
- Riverbend, Kansas
- Cedar Grove, Kansas
- Lakeside, Kansas
- Summit, Kansas
- Riverbend, Kentucky
- Cedar Grove, Kentucky
- Lakeside, Kentucky
- Summit, Kentucky
- Riverbend, Louisiana
- Cedar Grove, Louisiana
- Lakeside, Louisiana
- Summit, Louisiana
- Riverbend, Maine
- Cedar Grove, Maine
- Lakeside, Maine
- Summit, Maine
- Riverbend, Maryland
- Cedar Grove, Maryland
- Lakeside, Maryland
- Summit, Maryland
- Riverbend, Massachusetts
- Cedar Grove, Massachusetts
- Lakeside, Massachusetts
- Summit, Massachusetts
- Riverbend, Michigan
- Cedar Grove, Michigan
- Lakeside, Michigan
- Summit, Michigan
- Riverbend, Minnesota
- Cedar Grove, Minnesota
- Lakeside, Minnesota
- Summit, Minnesota
- Riverbend, Mississippi
- Cedar Grove, Mississippi
- Lakeside, Mississippi
- Summit, Mississippi
- Riverbend, Missouri
- Cedar Grove, Missouri
- Lakeside, Missouri
- Summit, Missouri
- Riverbend, Montana
- Cedar Grove, Montana
- Lakeside, Montana
- Summit, Montana
- Riverbend, Nebraska
- Cedar Grove, Nebraska
- Lakeside, Nebraska
- Summit, Nebraska
- Riverbend, Nevada
- Cedar Grove, Nevada
- Lakeside, Nevada
- Summit, Nevada
- Riverbend, New Hampshire
- Cedar Grove, New Hampshire
- Lakeside, New Hampshire
- Summit, New Hampshire
- Riverbend, New Jersey
- Cedar Grove, New Jersey
- Lakeside, New Jersey
- Summit, New Jersey
- Riverbend, New Mexico
- Cedar Grove, New Mexico
- Lakeside, New Mexico
- Summit, New Mexico
- Riverbend, New York
- Cedar Grove, New York
- Lakeside, New York
- Summit, New York
- Riverbend, North Carolina
- Cedar Grove, North Carolina
- Lakeside, North Carolina
- Summit, North Carolina
- Riverbend, North Dakota
- Cedar Grove, North Dakota
- Lakeside, North Dakota
- Summit, North Dakota
- Riverbend, Ohio
- Cedar Grove, Ohio
- Lakeside, Ohio
- Summit, Ohio
- Riverbend, Oklahoma
- Cedar Grove, Oklahoma
- Lakeside, Oklahoma
- Summit, Oklahoma
- Riverbend, Oregon
- Cedar Grove, Oregon
- Lakeside, Oregon
- Summit, Oregon
- Riverbend, Pennsylvania
- Cedar Grove, Pennsylvania
- Lakeside, Pennsylvania
- Summit, Pennsylvania
- Riverbend, Rhode Island
- Cedar Grove, Rhode Island
- Lakeside, Rhode Island
- Summit, Rhode Island
- Riverbend, South Carolina
- Cedar Grove, South Carolina
- Lakeside, South Carolina
- Summit, South Carolina
- Riverbend, South Dakota
- Cedar Grove, South Dakota
- Lakeside, South Dakota
- Summit, South Dakota
- Riverbend, Tennessee
- Cedar Grove, Tennessee
- Lakeside, Tennessee
- Summit, Tennessee
- Riverbend, Texas
- Cedar Grove, Texas
- Lakeside, Texas
- Summit, Texas
- Riverbend, Utah
- Cedar Grove, Utah
- Lakeside, Utah
- Summit, Utah
- Riverbend, Vermont
- Cedar Grove, Vermont
- Lakeside, Vermont
- Summit, Vermont
- Riverbend, Virginia
- Cedar Grove, Virginia
- Lakeside, Virginia
- Summit, Virginia
- Riverbend, Washington
- Cedar Grove, Washington
- Lakeside, Washington
- Summit, Washington
- Riverbend, West Virginia
- Cedar Grove, West Virginia
- Lakeside, West Virginia
- Summit, West Virginia
- Riverbend, Wisconsin
- Cedar Grove, Wisconsin
- Lakeside, Wisconsin
- Summit, Wisconsin
- Riverbend, Wyoming
- Cedar Grove, Wyoming
- Lakeside, Wyoming
- Summit, Wyoming
- Riverbend, District of Columbia
- Cedar Grove, District of Columbia
- Lakeside, District of Columbia
- Summit, District of Columbia
- Jacksonville, Florida
- Miami, Florida
- Tampa, Florida
- Orlando, Florida
- St. Petersburg, Florida
- Pace/Milton/Avalon, Florida

## National USA Location Dictionary (State → Cities)

Use this list to expand geographic recognition beyond the detailed Season 1 profiles. It can be used for lightweight lookup, location disambiguation, and to identify future cities to enrich in `season-1-cities.json`.

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
