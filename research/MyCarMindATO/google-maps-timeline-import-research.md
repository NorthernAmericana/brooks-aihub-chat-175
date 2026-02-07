Analyzing Google Timeline Data in a PWA/TWA App for Travel Statistics

Importing Google Timeline Data in a PWA Environment

Google allows users to export their Location History (Timeline) data (e.g. via Google Takeout or the Google Maps app) as JSON files, typically packaged in a ZIP archive. To use this data in a Progressive Web App (PWA), the app should let the user select or upload the ZIP file containing their timeline JSON. On the client side, you can then employ a library like JSZip along with the browser’s FileReader API to read and extract the JSON content from the ZIP entirely in-browser. This approach has been proven effective for Google Takeout ZIP files – JSZip is “really fast at reading zip files created by Google Takeout” when used with FileReader. By handling file import locally, you also preserve user privacy (the sensitive location data never leaves the user’s device).

Steps to import and read the timeline data:

1. User Exports Data: The user exports their Google Timeline/Location History as a JSON (usually delivered as a ZIP file containing one or more .json files). This JSON uses Google’s custom schema for location history.


2. User Provides ZIP to PWA: Your PWA should offer a file input or drag-and-drop area for the user to upload the ZIP. Once provided, use the FileReader API to read the file as an ArrayBuffer (binary data).


3. Extract JSON Files: Pass the ArrayBuffer to JSZip (e.g. JSZip.loadAsync(arrayBuffer)) to decompress. Then retrieve the JSON file(s) via zip.file("filename.json").async("string") to get their text content. If Google’s export splits the timeline by month (e.g. files like 2023_JANUARY.json), you’ll need to iterate over all JSON files in the zip archive.


4. Parse JSON Content: Once extracted, parse the JSON text into JavaScript objects (e.g. using JSON.parse). Be aware that the full timeline data can be very large (hundreds of thousands of points, possibly hundreds of MB), so loading it into memory needs careful handling (discussed below).



By performing these steps in the browser, the PWA can remain “privacy-first”, doing all processing locally. As one developer noted, “nothing is sent to any server — all processing happens locally on your device” for their timeline visualizer. This keeps the user’s location history safe and ephemeral (data can stay in-memory and vanish when the session ends).

Efficient Parsing and Indexing of Timeline JSON

Google’s timeline JSON has a nested structure and can be quite complex. In the Semantic Location History format (the modern JSON format often exported per month), the root contains an array called timelineObjects. Each entry is either an activitySegment (movement from one place to another) or a placeVisit (a stay at a particular location). Within these, relevant data is deeply nested (for example, a placeVisit contains a location object with details, and an activitySegment may contain start/end locations, timestamps, distance, and mode of travel).

Tips for parsing the JSON structure:

Auto-detect Format: Google’s exports have evolved. You might encounter a single large Records.json (older format of raw GPS points), or multiple files for each month in a semantic format, or a Location History.json from mobile. Your code can check keys to decide how to parse (e.g., presence of timelineObjects array indicates semantic format).

Stream or Batch Process: Instead of parsing the entire JSON array at once (which can lock up the UI), process the timeline entries in chunks. A proven approach is progressive processing: load and handle, say, 1000–5000 entries at a time, then yield to the event loop before continuing. This keeps the web app responsive even for huge data sets. For example, a 170 MB JSON (~630k location points) can be parsed and visualized in ~20–30 seconds on a modern device by chunking the work. If the data is split by month, you can also load one month at a time to manage memory usage.

Use Web Workers (if needed): For truly large datasets or CPU-intensive computations, consider offloading parsing to a Web Worker thread. This way, the parsing/indexing won’t freeze the main UI. The worker can send progress updates and results back to the main thread. However, with proper batch-yield techniques, you might achieve adequate performance on the main thread alone without the added complexity of workers.

Indexing Data: Once parsed, you may want to index the data for easy querying. For example, you can store records in an in-memory data structure or use an in-browser database. IndexedDB or local databases (via libraries like Dexie or LocalForage) can store the timeline points or visits, enabling searches (e.g., by date or location name). If you plan to persist user data or handle very large queries, you could also send processed summaries to a backend database. (For instance, using Next.js APIs to store stats in a Neon Postgres database is an option – though for privacy you’d do this only with user consent or for non-sensitive aggregations.)


It’s important to handle the two main object types:

Place Visits: These entries contain details of places the user stayed/visited. They include a location object often with a readable address and name for the place (e.g. a restaurant name or a street address). This is useful for identifying cities or towns visited. (For example, an address might include a city and state name, which you can parse out.)

Activity Segments: These represent travel between places (walking, driving, etc.). They often include startLocation and endLocation coordinates, timestamps, travel mode, and sometimes a distance field in meters. Google’s semantic JSON even provides the travel distance and mode of transport for each trip segment when available, which is very handy for computing metrics.


By iterating through all timelineObjects, you can build up a structured representation of the user’s travels (e.g., list of trips and stays). At this stage, it might help to convert data to a more convenient schema for your app (for example, a list of visits with date, place name, and a list of segments with distance, duration, mode, etc.).

Calculating Travel Statistics and Insights

With the timeline data parsed and indexed, your app can compute personal travel statistics for the user. The goal is to turn raw data into meaningful insights or even a gamified summary. Here are key metrics and how you might derive them:

Total Distance Traveled: Sum up all distances from the activitySegment entries. In Google’s semantic history, each movement often has a distance (in meters) field or a distanceMeters in sub-objects. Adding these up gives the total distance traveled over the period of the data. You can convert meters to miles or kilometers as needed. If the dataset is raw (no precomputed distance), you can calculate distance between consecutive location points using haversine formula – but the semantic data’s provided distances are convenient and account for the actual path traveled in many cases.

Places and Towns Visited: Using placeVisit entries, compile the unique places the user went. Each placeVisit often has a location.name (e.g. venue name) and an address which includes city/town and possibly state/country. By extracting the city or town from these addresses, you can count unique towns/cities visited. Similarly, aggregating by state or country is possible by parsing that address string or using reverse-geocoding if needed. For example, you might find that the user visited 5 distinct states and 20 distinct towns in the last year.

Travel Frequency and Timeline: Analyze the timestamps to find patterns. You could compute things like number of trips per month, longest trip (in distance or duration), or days spent traveling vs days at home. If the data covers multiple years, the app could chart travel activity over time or identify peak travel periods.

“Levels” or Gamification: To implement levels of exploration (as the user suggested), you can define thresholds for number of places or distance. For instance, Level 1 Explorer for visiting 1–2 states, Level 2 for 5+ states, etc., or levels based on total miles traveled. This is a design choice – the app can reward users with badges or levels when they reach certain milestones (e.g., visited 10 cities or traveled 1,000 miles). The data needed for this (counts and sums) comes directly from the computations above.

Other Stats: There are many possibilities. For example, identify the furthest distance from home the user traveled, the most frequently visited city, or the total hours spent traveling (which you can get by summing durations of activitySegments). If the timeline data has activity types, you can even break down travel by mode (e.g., X miles by foot, Y miles by car, etc., derived from activityType in segments).


All these calculations can be done with plain JavaScript once the data is parsed. It’s usually best to perform these analytics in a background step (after import) and then store the results (perhaps in state or a local database) so that the UI can quickly display “dashboard” stats without recalculating everything repeatedly.

Incorporating an AI Agent for Deeper Analysis

You mentioned an “agentic AI” in the app that would index the timeline data with the help of instructions (perhaps a README in the zip) to provide stats or insights. There are a couple of ways to leverage AI here, and it’s important to weigh the pros and cons:

Parsing and Indexing via AI: One idea is to have an AI agent read the raw JSON (guided by instructions) and extract information. In practice, however, feeding a large JSON file directly to a language model is not optimal – it can exceed token limits and may be error-prone. It’s usually better to handle structured data with code, and then use AI for interpretation or user interaction. Instead of relying on the AI to do low-level parsing, use the deterministic parsing described above to get a clean dataset of trips, places, and stats.

Providing Schema/Format Guidance: That said, you can include a schema description or instructions for the AI so it understands the data format. For example, a short “readme” could explain: “The timeline JSON contains an array of timelineObjects with fields X, Y, Z. ‘placeVisit’ has location name and address, ‘activitySegment’ has distance in meters,” etc. This could be used as a system or context prompt if you have the AI analyze portions of the data. The agent would then know how to interpret the fields. Including this info in the zip for the agent might not be directly read by the AI unless your app specifically loads that text and feeds it into the AI’s prompt.

AI-Generated Insights: A great use of an AI agent is to turn the stats into natural language insights or answer questions. For example, after computing raw stats, you could prompt the AI to generate a summary: “Summarize the user’s travel history: which places did they visit most, approximately how many miles did they travel, and any interesting pattern you can infer?” The AI could produce a friendly recap (e.g., “You traveled about 5,000 miles last year, visiting 3 new states and 12 cities. Your most visited city was New York. It looks like you tend to explore new places in summer.”). This adds a personal touch that pure numbers might lack.

Interactive Q&A: If you integrate a capable language model (via API or on-device), you can enable the user to ask questions about their timeline data in plain English. For instance, “Which month did I travel the most?” or “Have I ever been to Orlando?”. To achieve this, one architecture is to use the AI as a mediator that translates the question into a database query or filters on the data. For example, you could embed the travel data in a vector store or simply have predefined functions that the AI can call (like a function to list visits to a given place, or sum distances in a date range). Using something like OpenAI’s function calling or a tool-using agent (e.g., via LangChain) would let the AI choose to invoke your data functions. This way the heavy lifting (searching the data) is done by your code, and the AI just formats the answer. It’s an advanced but powerful approach to make the app “agentic.”

Automating the Indexing: You mentioned an automated system where instructions help the agent accept the timeline data for indexing. If by that you mean the AI itself will decide how to store or structure the data, it’s still advisable to keep that logic in regular code. The AI could be instructed to output a certain JSON summary, but given that you have full control of the app, you might let the AI focus on insights rather than raw transformation. For reliability and performance, use the AI for what it’s best at (natural language understanding and generation) and use your code for data crunching.


In summary, the best practice is usually a hybrid approach: use conventional programming to parse and compute accurate statistics from the timeline JSON, then use an AI agent to enrich the user experience – e.g., by summarizing those stats, identifying interesting anomalies (maybe the AI can look at yearly data and say “2020 was a quiet year for travel” based on low mileage), or allowing conversational queries about the travel history. This gives you the benefits of both worlds: the precision of structured data processing and the flexibility of AI reasoning.

(Note: If the AI is running on-device (less common) you might consider a smaller model or ensure the JSON and instructions fit in memory. If it’s an API like OpenAI, be mindful of not sending highly sensitive raw location data to the API – perhaps send only aggregate stats or moderate the level of detail to protect user privacy.)

Deployment as a Trusted Web Activity (TWA) and Extending to Mobile

After building the PWA with these capabilities, you can package it as a Trusted Web Activity (TWA) for Android distribution. A TWA essentially wraps your web app in a native Android container that uses Chrome to render the PWA in full-screen mode, making it feel like a native app. The good news is that all the timeline processing features you implement in the PWA will work the same in the TWA, since it’s the same web code running under the hood. Here are some considerations for TWA and other platforms:

TWA on Android: To create a TWA, you can use Google’s Bubblewrap tool or PWABuilder. Bubblewrap will ask for your PWA’s start URL and manifest, then generate an Android project that loads your PWA URL in a Trusted Web Activity. You’ll need to set up Digital Asset Links (to validate your app’s domain with the app package) and fulfill PWA requirements (your PWA must be HTTPS, have a manifest with proper icons, and a service worker for offline support). Once packaged, you can publish this to the Play Store. From the user’s perspective, the app will install and run like a native app, with the PWA inside it. All file-handling (uploading the zip, etc.) should work in a TWA just as in the browser. Just ensure you test the file input on Android Chrome, as TWAs rely on Chrome’s capabilities – modern Chrome on Android does support file inputs and the FileReader API.

iOS and Other Platforms: iOS doesn’t have an official TWA equivalent, but iPhones can still use the PWA via Safari (users can add it to home screen). The PWA’s functionality (including reading the zip and analyzing data) should function in Mobile Safari, as it supports FileReader and JSZip. One thing to note: iOS Safari has some memory and performance limitations, so very large JSON files might be slower – testing on an actual device is prudent. If you want a true App Store app, you might consider wrapping the PWA in a WebView using something like Capacitor or Cordova for iOS. That would let you distribute through Apple’s App Store. Again, the core logic remains the same – your JavaScript code does the parsing and analysis.

Performance on mobile: Given that mobile devices are less powerful, the batching strategy for parsing becomes even more important. Keep those chunks small enough to not stutter the UI. You might also leverage storage – for example, after initial import, store computed stats so that the app can quickly load the summary next time without reprocessing the entire JSON on each launch.

Progressive Enhancement: As a PWA, ensure you use a service worker to cache the app shell so that it loads quickly (especially when the user might be opening it as a TWA offline or with poor connectivity). The timeline data analysis itself can be done offline since all data is provided by the user’s file – meaning your app can function without network, a big plus for user trust and portability.


In essence, building as a PWA first gives you a lot of flexibility: you get a web app accessible on desktop and mobile browsers, and you can “wrap” it for app stores via TWA (Android) or similar wrappers (iOS). The core timeline analysis functionality remains in the web code and doesn’t need to change for each platform, aside from minor adjustments for mobile UI.

Conclusion

Putting it all together, the best way to analyze Google Timeline data in your app is to combine robust client-side data processing with selective use of AI for insights. The PWA can import the user’s timeline JSON (from a ZIP) entirely in-browser, using tools like JSZip for extraction. By parsing the JSON in batches and possibly using background threads, you keep the app responsive while handling large location history files. Once parsed, you compute travel stats such as distances, places visited, and other patterns from the structured data. These metrics can feed into a gamified experience (levels, badges for exploration) and satisfy the user’s curiosity about their travels.

An AI agent in the app can then add value by interpreting these stats or answering questions in natural language, rather than doing the low-level crunching. Provide the AI with context (either via a preset prompt that explains the data schema or via functions it can call) to ground it in the timeline data domain. This way, the AI can confidently generate summaries like “You’ve visited 15 new cities across 3 countries, and walked a total of 120 miles on foot”, backed by the accurate calculations done by your code.

Finally, your web app’s capabilities can be packaged into a TWA for Android distribution, and similarly brought to iOS if needed, ensuring users on all platforms can easily see and interact with their timeline-derived stats. By following this approach, you create a privacy-conscious, performant, and insightful timeline analysis app that leverages both traditional programming and AI where each is most appropriate.

Sources: The implementation strategies and considerations above are informed by real-world projects and documentation, including a privacy-first timeline visualizer that processes Google’s JSON in-browser, official guides on reading ZIP files in JS, Google’s semantic timeline format reference, and Google’s guidance on PWAs to TWA conversion. These sources and others provide a foundation for handling the Google Timeline data and deploying the solution across web and mobile.
