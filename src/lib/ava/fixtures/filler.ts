// Sample text for the page view on Ava page 3. PROTOTYPE ONLY.
//
// The sample drafts are shorter than their stored page counts, so the sheets
// after Ava's real draft are filled with this text to make the demo read like
// a real proposal. It is display only: it is never counted, never checked and
// never treated as proof. The product lays out the member's real file instead,
// and never uses this text.
//
// The facts stay inside the sample bids (fayetteville.ts, mackall.ts): no new
// people, past jobs, certificates, dollar figures or dates.

/** One block of sample text for the page view. Prototype only. */
export interface FillerBlock {
  heading?: string;
  paragraphs?: string[];
  table?: { head: string[]; rows: string[][] };
}

/** Sample blocks by draft section id, in reading order. */
export const FILLER: Record<string, FillerBlock[]> = {
  // Fayetteville, Tab 3: Operations and staffing plan. About 10 pages.
  "sec-operations": [
    {
      heading: "How the cafe team works",
      paragraphs: [
        "Four people run the cafe and the city's events each week. Our kitchen manager leads the team and works 40 hours a week. One cook works 35 hours a week, from 7:00 AM to 2:30 PM. Two servers work 20 hours a week each. They serve on the lunch line and drive food to events. Our owner joins large events and manages the contract.",
        "Each person has one main job and one backup job. The cook can run the line. A server can prepare cold food and salads. The kitchen manager can cook every dish on the menu. This means one absence never stops lunch. We train every person on both jobs in the first month.",
      ],
    },
    {
      heading: "Weekly staff schedule",
      paragraphs: [
        "The schedule below is the same every week of the year. The cafe is closed on city holidays.",
      ],
      table: {
        head: ["Role", "Monday to Friday", "Hours a week", "Main job"],
        rows: [
          ["Kitchen manager", "7:00 AM to 3:30 PM", "40", "Leads the kitchen and food safety"],
          ["Cook", "7:00 AM to 2:30 PM", "35", "Cooks the hot entrée and the vegetarian choice"],
          ["Server 1", "10:45 AM to 1:45 PM", "15", "Serves hot food on the line"],
          ["Server 2", "10:45 AM to 1:45 PM", "15", "Restocks the line and wipes tables"],
          ["Server 1, events", "As ordered", "5", "Drives to events and serves"],
          ["Server 2, events", "As ordered", "5", "Drives to events and serves"],
          ["Owner", "As needed", "Varies", "Manages the contract and large events"],
        ],
      },
    },
    {
      heading: "A normal service day",
      paragraphs: [
        "This is how one weekday runs in the cafe. Event food is made in the cafe kitchen, outside lunch hours.",
      ],
      table: {
        head: ["Time", "What happens", "Who"],
        rows: [
          ["7:00 AM", "Kitchen opens and deliveries are checked", "Kitchen manager and cook"],
          ["7:15 AM", "Fridge and freezer temperatures logged", "Kitchen manager"],
          ["7:30 AM", "Cooking starts for the day's menu", "Cook"],
          ["9:30 AM", "Event emails read and answered", "Kitchen manager"],
          ["10:30 AM", "Hot line filled and first temperature check", "Cook"],
          ["10:45 AM", "Servers arrive and prepare the line", "Servers"],
          ["11:00 AM", "Lunch opens and the first crew break begins", "All staff"],
          ["12:00 PM", "Second crew break begins", "All staff"],
          ["1:30 PM", "Lunch ends and leftovers are cooled", "Cook"],
          ["1:45 PM", "Line and dining room cleaned", "Servers"],
          ["3:00 PM", "Event emails read again and next day planned", "Kitchen manager"],
          ["3:30 PM", "Kitchen locked for the night", "Kitchen manager"],
        ],
      },
    },
    {
      heading: "Opening the kitchen each morning",
      paragraphs: [
        "The kitchen manager and the cook arrive at 7:00 AM. The kitchen manager walks the kitchen before any food is touched. The manager checks that the hand sinks have soap and towels. The manager reads the fridge and freezer temperatures and logs them. Any reading out of range is fixed before cooking starts.",
        "Food deliveries arrive in the early morning. The cook checks each delivery against the order. Cold food is checked with a probe thermometer. Damaged or warm food is refused and noted on the invoice. Everything is dated and stored within 30 minutes.",
      ],
    },
    {
      heading: "Lunch service on the line",
      paragraphs: [
        "Hot lunch is served from 11:00 AM to 1:30 PM, Monday to Friday. Both servers work the line from 10:45 AM to 1:45 PM. One server plates hot food. The other restocks the line, wipes tables and helps guests. The cook stays at the stove and refills pans as they empty. The kitchen manager watches the line and the temperature log.",
        "Field crews take a 30-minute break at 11:00 AM or 12:00 PM. We have the line full and hot before each break begins. Most guests arrive in the first 10 minutes of each break. So we cook the second batch to be ready by 11:50 AM. This keeps the wait short for crews with a fixed break.",
      ],
    },
    {
      heading: "Counting meals",
      paragraphs: [
        "Each guest scans a city badge when they collect lunch. The kitchen manager reads the badge count after lunch ends. The manager writes the count in the daily log. We use that same count on the monthly invoice. This way, our bills match the city's own records.",
        "If a scanner fails, servers write each guest's badge number by hand. The manager adds those numbers to the day's count. We tell the city's contact about the failed scanner the same day.",
      ],
    },
    {
      heading: "Closing the kitchen each day",
      paragraphs: [
        "Lunch ends at 1:30 PM. The cook cools leftovers at once in shallow pans. Cooled food is labeled with the date and stored. Food that sat on the line is not served again.",
        "The servers clean the line, the tables and the floor. The kitchen manager checks every station before 3:30 PM. The manager plans the next day's menu and prep list. The last task is to lock the kitchen and the storeroom.",
      ],
    },
    {
      heading: "How event orders arrive",
      paragraphs: [
        "Event orders come to one email address. The kitchen manager reads it at 9:30 AM and 3:00 PM. Each order gets a reply the same day.",
      ],
      table: {
        head: ["Step", "What happens", "When"],
        rows: [
          ["1", "The city emails the order", "5 business days ahead or more"],
          ["2", "We confirm the menu, guest count and room", "Same day"],
          ["3", "We order any extra food", "4 business days ahead"],
          ["4", "We plan staff and vehicles", "3 business days ahead"],
          ["5", "The city confirms the final guest count", "2 business days ahead"],
          ["6", "We cook and pack the food", "Day of the event"],
          ["7", "We deliver, serve and clean", "Day of the event"],
          ["8", "We add the event to the monthly invoice", "End of the month"],
        ],
      },
    },
    {
      heading: "Staff by event size",
      paragraphs: [
        "Events range from 20 to 400 guests at city buildings. We staff each event by its guest count.",
      ],
      table: {
        head: ["Guests", "Servers", "Other staff", "We arrive"],
        rows: [
          ["20 to 50", "1", "None", "45 minutes before"],
          ["51 to 100", "2", "None", "1 hour before"],
          ["101 to 150", "2", "None", "1 hour before"],
          ["151 to 250", "2", "Owner", "1 hour 30 minutes before"],
          ["251 to 400", "2", "Owner and cook", "2 hours before"],
        ],
      },
    },
    {
      heading: "Delivering and serving events",
      paragraphs: [
        "Hot food goes into insulated carriers as soon as it is cooked. Cold food goes into coolers with ice packs. The servers load the carriers and drive them to the event. At the room, they arrange the buffet tables and the serving line. They keep hot food in chafing dishes and check it every 30 minutes.",
        "When the event ends, the servers clear the tables and the buffet. They carry all trash to the building's bins. They wipe every surface they used. The city's event host signs a delivery sheet before they leave. The cook joins large events only after the cafe lunch ends.",
      ],
    },
    {
      heading: "Short-notice orders",
      paragraphs: [
        "Exhibit A asks for 5 business days of notice for events. We accept every order placed with that much notice. Sometimes the city needs food sooner. We will accept a short-notice order when staff and food allow. The kitchen manager replies within 2 hours to say yes or no.",
        "For a small group, we can often deliver the next business day. We use the cafe menu for these orders. Short-notice orders never reduce lunch service at the cafe. Lunch for city staff always comes first.",
      ],
    },
    {
      heading: "Supervision",
      paragraphs: [
        "The kitchen manager is on site during all cafe service hours. The manager is also on site for all event cooking. The manager supervises the cook and both servers every day. Each morning at 10:30 AM, the team meets for 5 minutes. They review the menu, the guest count and any allergen notes. The manager writes each problem in the daily log.",
        "Our owner visits the cafe at least once a week. The owner reads the logs and talks with the kitchen manager. The owner meets the city's contact once a month.",
      ],
    },
    {
      heading: "Backup staff",
      paragraphs: [
        "We will not replace the kitchen manager without the city's written approval. When the manager is out for a day, a named backup runs the kitchen. If the cook is out, the kitchen manager cooks and a server covers the line. If one server is out, the kitchen manager helps on the line. If both servers are out, the owner works the line.",
        "Every backup is trained on the job before the contract starts. Every backup passes the city's background check first. We tell the city's contact by 9:00 AM about any absence.",
      ],
    },
    {
      heading: "What we do when something fails",
      paragraphs: ["Each problem has one person in charge and a time to fix it."],
      table: {
        head: ["Problem", "What we do", "Who acts", "Fixed within"],
        rows: [
          [
            "Cook is out sick",
            "Kitchen manager cooks and a server covers the line",
            "Kitchen manager",
            "Same day",
          ],
          [
            "Kitchen manager is out",
            "Backup manager runs the kitchen",
            "Backup manager",
            "Same day",
          ],
          ["Not enough food at lunch", "Serve the backup entrée from stock", "Cook", "15 minutes"],
          ["Hot food below safe temperature", "Reheat or discard the food", "Cook", "At once"],
          [
            "Fridge stops working",
            "Move food to the backup cooler",
            "Kitchen manager",
            "30 minutes",
          ],
          [
            "Power or gas fails",
            "Stop cooking and serve the cold menu",
            "Kitchen manager",
            "At once",
          ],
          ["Event vehicle fails", "Send a second vehicle with the food", "Owner", "1 hour"],
          [
            "Wrong or missing event food",
            "Cook and deliver the right dish",
            "Kitchen manager",
            "Same day",
          ],
          ["Supplier misses a delivery", "Buy from a local store", "Owner", "Same morning"],
          [
            "Inspection score below Grade A",
            "Fix each finding and ask for a new visit",
            "Kitchen manager",
            "10 days",
          ],
        ],
      },
    },
    {
      heading: "Food safety on the line",
      paragraphs: [
        "Hot food stays at 135°F or above on the line. Cold food stays at 41°F or below. The kitchen manager checks hot food every hour and logs each reading. Food below a safe temperature is reheated or discarded. Servers wear gloves and hair covers at all times. Each serving spoon is used for one dish only.",
        "Staff wash hands at the start of each shift. They wash again after breaks, trash and raw food. Raw meat is stored below cooked and ready food. Raw meat has its own cutting boards, in a separate color.",
      ],
    },
    {
      heading: "Temperature checks",
      paragraphs: ["We record hot and cold temperatures during every service."],
      table: {
        head: ["What we check", "When", "Safe range", "Who"],
        rows: [
          ["Fridges", "7:15 AM and 2:00 PM", "41°F or below", "Kitchen manager"],
          ["Freezers", "7:15 AM and 2:00 PM", "0°F or below", "Kitchen manager"],
          ["Cold food deliveries", "On arrival", "41°F or below", "Cook"],
          ["Cooked chicken", "End of cooking", "165°F or above", "Cook"],
          ["Hot line", "Every hour during lunch", "135°F or above", "Kitchen manager"],
          ["Cold line", "Every hour during lunch", "41°F or below", "Kitchen manager"],
          ["Cooling leftovers", "Every 30 minutes until cold", "41°F or below", "Kitchen manager"],
          ["Hot event food", "Loading and every 30 minutes", "135°F or above", "Servers"],
        ],
      },
    },
    {
      heading: "Cleaning schedule",
      paragraphs: [
        "We will keep a Grade A score at every county inspection. This schedule is posted in the kitchen.",
      ],
      table: {
        head: ["Area", "Task", "How often", "Done by"],
        rows: [
          ["Prep tables", "Wash and sanitize", "After each use", "Cook"],
          ["Hot line", "Clean and sanitize", "Daily after lunch", "Servers"],
          ["Dining tables", "Wipe and sanitize", "During and after lunch", "Servers"],
          ["Floors", "Sweep and mop", "Daily", "Servers"],
          ["Fridges", "Empty and wash the shelves", "Weekly", "Cook"],
          ["Hood filters", "Remove and wash", "Weekly", "Kitchen manager"],
          ["Ovens and stove", "Deep clean", "Weekly", "Cook"],
          ["Walls and ceiling", "Wash", "Monthly", "Kitchen manager"],
          ["Event carriers", "Wash and sanitize", "After each event", "Servers"],
        ],
      },
    },
    {
      heading: "Waste and leftovers",
      paragraphs: [
        "We plan food amounts from the last 4 weeks of badge counts. This keeps waste low and food fresh. The cook writes all discarded food in a waste log. The owner reads the waste log each week. If one dish is often left over, we cook less of it.",
        "Leftovers that never left the kitchen are cooled and used within 2 days. Food that sat on the line is never served again. We recycle cans, boxes and cooking oil where the building allows.",
      ],
    },
    {
      heading: "Quality checks",
      paragraphs: ["The kitchen manager checks quality at every service."],
      table: {
        head: ["What we check", "How often", "Who"],
        rows: [
          ["Taste and look of each dish", "Before lunch opens", "Kitchen manager"],
          ["Portion size", "Every service", "Cook"],
          ["Allergen labels on the line", "Every service", "Servers"],
          ["Food matches the posted menu", "Daily", "Kitchen manager"],
          ["Event food matches the order email", "Before food leaves the kitchen", "Servers"],
          ["Guest comments", "Weekly", "Kitchen manager"],
          ["Cleaning log is complete", "Daily", "Kitchen manager"],
          ["Logs and counts", "Weekly", "Owner"],
        ],
      },
    },
    {
      heading: "Guest comments",
      paragraphs: [
        "Guests can leave a comment card at the cafe. They can also email the kitchen manager. The kitchen manager reads every comment each week. We answer named comments within 2 business days. We share a short comment summary with the city each month. Popular dishes stay on the menu cycle. Dishes with poor comments are changed.",
      ],
    },
    {
      heading: "Menu planning",
      paragraphs: [
        "The menu runs on a four-week cycle. Every day has a hot entrée and a vegetarian choice. All meat is halal, and every menu item has an allergen label. The kitchen manager plans each cycle with the owner. We send the city each new cycle 2 weeks before it starts.",
        "We change the cycle twice a year, for warm and cool months. We use guest comments and waste logs to choose changes. Holiday weeks may have one special lunch, agreed with the city.",
      ],
    },
    {
      heading: "Training over the year",
      paragraphs: [
        "Every staff member has one training topic each month. Each session lasts 1 hour, before or after service.",
      ],
      table: {
        head: ["Month", "Topic", "Who attends"],
        rows: [
          ["Month 1", "City rules, badges and building safety", "All staff"],
          ["Month 2", "Allergens and food labels", "All staff"],
          ["Month 3", "Halal food handling", "All staff"],
          ["Month 4", "Hot and cold holding temperatures", "All staff"],
          ["Month 5", "Knife and burn safety", "Kitchen staff"],
          ["Month 6", "Guest service on the line", "Servers"],
          ["Month 7", "Cleaning and sanitizing", "All staff"],
          ["Month 8", "Safe driving and loading", "Servers"],
          ["Month 9", "Event buffet service", "Servers and owner"],
          ["Month 10", "Fire safety and first aid", "All staff"],
          ["Month 11", "Practice inspection walk", "All staff"],
          ["Month 12", "The year's logs and lessons", "Kitchen manager and owner"],
        ],
      },
    },
    {
      heading: "Working in city buildings",
      paragraphs: [
        "Every staff member passes the city's background check before starting work. Every staff member wears a city identification badge at work. Staff wear clean uniforms with our company name. Staff follow each building's rules for parking, doors and keys. We report any lost badge or key to the city the same day.",
      ],
    },
    {
      heading: "Plan for the first 6 weeks",
      paragraphs: ["This plan starts on the day the city sends the Notice to Proceed."],
      table: {
        head: ["Week", "What we do"],
        rows: [
          ["Week 1", "Start city background checks for all staff"],
          ["Week 1", "Order uniforms, carriers and small kitchen tools"],
          ["Week 2", "Apply for the cafe food service permit"],
          ["Week 2", "Walk the cafe kitchen with the city's contact"],
          ["Week 3", "Deep clean and stock the cafe kitchen"],
          ["Week 3", "Send the first four-week menu to the city"],
          ["Week 4", "Train staff on city rules and the menu"],
          ["Week 5", "Hold 2 practice lunches for the team"],
          ["Week 5", "County permit inspection of the cafe"],
          ["Week 6", "First day of lunch service"],
        ],
      },
    },
    {
      heading: "Reports to the city",
      paragraphs: ["We send the city clear records each month."],
      table: {
        head: ["Report", "What it shows", "Where it goes", "How often"],
        rows: [
          [
            "Monthly invoice",
            "Daily meal counts and each event served",
            "The city's contact",
            "Monthly",
          ],
          ["Temperature logs", "Hot and cold readings", "Kept at the cafe", "Daily"],
          [
            "Event sheet",
            "Guests, menu and delivery time",
            "The city's contact",
            "After each event",
          ],
          ["Incident note", "What happened and how we fixed it", "The city's contact", "Same day"],
          ["Cleaning log", "Tasks done and staff initials", "Kept at the cafe", "Daily"],
          [
            "Guest comment summary",
            "Main comments and our changes",
            "The city's contact",
            "Monthly",
          ],
        ],
      },
    },
    {
      heading: "Working with the city",
      paragraphs: [
        "Our kitchen manager is the city's contact for daily cafe matters. Our owner is the contact for the contract and invoices. We answer every city email within 1 business day. Sales tax is a separate line on each invoice.",
        "We meet the city's contact once a month to discuss service. Each meeting covers counts, comments, problems and next month's events. We send short notes from each meeting the same day.",
      ],
    },
  ],

  // Fayetteville, Tab 2: Experience and references. About 2 pages.
  "sec-experience": [
    {
      heading: "How our team runs large events",
      paragraphs: [
        "Each large event starts with a written plan. The plan lists the menu, the guest count and the room layout. It names who cooks, who drives and who serves. We cook in stages so food reaches the room hot. One person leads the event from arrival to the end of cleaning.",
        "We arrive early to arrange the tables and the buffet. We keep a second serving line ready for crowds over 150 guests. We check food temperatures every 30 minutes until service ends.",
      ],
    },
    {
      heading: "Lessons from past jobs",
      paragraphs: [
        "Daily meal programs taught us to plan by count, not by guess. We now order food from recent counts. Large events taught us to staff the serving line first. Military dining work taught us to keep strict records. We keep a log for every temperature and every delivery. Each lesson is part of the plan in this proposal.",
      ],
    },
    {
      heading: "Kinds of work and what they show",
      paragraphs: ["This table links each kind of past work to the cafe."],
      table: {
        head: ["Kind of work", "What it shows", "Where it helps here"],
        rows: [
          ["Daily school meals", "Cooking at high daily volume", "The weekday cafe lunch"],
          [
            "Meal delivery to many sites",
            "Safe transport and timing",
            "Event delivery to city buildings",
          ],
          [
            "Military dining support",
            "Strict food safety records",
            "Temperature logs and inspections",
          ],
          ["Short-order line work", "Fast service in fixed breaks", "Crew breaks at lunch"],
          [
            "Church event catering",
            "Events of 80 to 400 guests",
            "City events of up to 400 guests",
          ],
          ["Allergen-labeled meals", "A label on every tray", "Allergen-safe cafe menus"],
        ],
      },
    },
    {
      heading: "How references can be reached",
      paragraphs: [
        "Our two references are listed on Form 5. Each listing gives a name, a role, a phone number and an email. Both references saw our work in person. The city may call or email them at any time. We have told each reference to expect a call.",
      ],
    },
    {
      heading: "How we plan a busy service day",
      paragraphs: [
        "A busy service day starts the afternoon before. We check the count, the menu and the food in stock. We prepare cold food and sauces the day before. On the day, hot food is cooked in batches. Each batch is timed to finish just before it is served. This keeps food hot and safe without long holding times.",
      ],
    },
    {
      heading: "Records on every job",
      paragraphs: [
        "We keep the same records on every job, large or small. Each job has a temperature log, a cleaning log and a delivery log. We note every problem and the fix in the same log. These records help us answer questions from buyers and inspectors. They also show us where to improve on the next job.",
      ],
    },
    {
      heading: "Why this experience fits the cafe",
      paragraphs: [
        "The cafe needs hot lunches every workday at a fixed time. It also needs events of up to 400 guests. Our past work covers both kinds of service. We have cooked at daily volume and catered large events. We have kept the records that public buyers expect. We will bring the same habits to the city's cafe.",
      ],
    },
  ],

  // Fayetteville, Tab 4: Menu and food safety. About 1 page.
  "sec-menu": [
    {
      heading: "Weekly menu cycle",
      paragraphs: ["Below is week 1 of our four-week menu cycle. All meat is halal."],
      table: {
        head: ["Day", "Hot entrée", "Vegetarian choice", "Side"],
        rows: [
          ["Monday", "Grilled chicken with rice", "Vegetable curry with rice", "Green salad"],
          [
            "Tuesday",
            "Beef meatballs in tomato sauce",
            "Baked pasta with beans",
            "Steamed broccoli",
          ],
          ["Wednesday", "Baked fish with lemon", "Falafel with hummus", "Roasted potatoes"],
          ["Thursday", "Chicken and vegetable stew", "Lentil soup with bread", "Fresh fruit"],
          ["Friday", "Beef burger on a bun", "Black bean burger on a bun", "Baked fries"],
        ],
      },
    },
    {
      heading: "Allergen handling",
      paragraphs: [
        "Every dish on the line has an allergen label. Labels name the major allergens, such as nuts, milk, eggs and wheat. We cook allergen-free dishes first, with clean tools and pans. Those dishes are covered and stored apart from other food. Servers change gloves before serving a guest with an allergy. Any guest can ask to see the full ingredient list.",
      ],
    },
    {
      heading: "Temperature logs",
      paragraphs: [
        "The kitchen manager checks hot and cold food every hour during lunch. Each reading goes in the daily temperature log. Hot food stays at 135°F or above. Cold food stays at 41°F or below. Food below a safe temperature is reheated or discarded. Logs are kept at the cafe for county inspectors and the city.",
      ],
    },
    {
      heading: "Special diets",
      paragraphs: [
        "Every day offers a vegetarian choice. All meat we serve is halal. We can make gluten-free or dairy-free meals with 1 day of notice. For events, the order form asks about special diets. Each special meal is labeled with the guest's name.",
      ],
    },
  ],

  // Camp Mackall: Technical capability. About 3 pages.
  "mk-s-tech": [
    {
      heading: "Each delivery run, step by step",
      paragraphs: [
        "We make two delivery runs on every training day. Each run serves all three delivery points. Breakfast and the field lunch are cooked from 2:00 AM. Dinner is cooked from 12:00 PM. Each run reaches every point by the time in the work statement.",
      ],
      table: {
        head: ["Step", "What happens", "Who"],
        rows: [
          ["1", "Cooks finish each meal and probe every pan", "Cooks"],
          ["2", "Meals are packed by delivery point", "Food service workers"],
          ["3", "Each carrier is checked and its temperature logged", "Food service workers"],
          ["4", "Carriers are loaded, first stop nearest the door", "Drivers"],
          ["5", "The vehicle leaves with 15 extra minutes for delays", "Driver"],
          ["6", "Meals are delivered and temperatures logged at each point", "Driver"],
          ["7", "A unit member signs the delivery sheet", "Driver"],
          ["8", "The driver calls the kitchen after the last point", "Driver"],
          ["9", "Carriers return to the kitchen for washing", "Driver"],
        ],
      },
    },
    {
      heading: "Packing meals for the road",
      paragraphs: [
        "Food service workers pack each meal by unit and delivery point. Hot food goes into insulated carriers. Cold food goes into insulated coolers with ice packs. Field lunches are packed in sealed boxes, one for each soldier. Each carrier has a label with the point, the meal and the count. A second worker checks each count against the headcount sheet. Carriers are loaded so the first stop is nearest the door.",
      ],
    },
    {
      heading: "Keeping food hot and cold on the road",
      paragraphs: [
        "Our containers keep safe temperatures for at least four hours. The longest trip, from loading to the last point, is about 2 hours.",
      ],
      table: {
        head: ["Food", "Container", "Safe temperature", "Checked"],
        rows: [
          [
            "Hot entrées",
            "Insulated carrier, heated first",
            "135°F or above",
            "Loading and delivery",
          ],
          [
            "Hot sides",
            "Insulated carrier, heated first",
            "135°F or above",
            "Loading and delivery",
          ],
          ["Salads and fruit", "Cooler with ice packs", "41°F or below", "Loading and delivery"],
          ["Milk and juice", "Cooler with ice packs", "41°F or below", "Loading and delivery"],
          ["Field lunch boxes", "Cooler with ice packs", "41°F or below", "Loading and delivery"],
          ["Bread and snacks", "Dry box", "Room temperature", "Loading"],
        ],
      },
    },
    {
      heading: "Vehicles and routes",
      paragraphs: [
        "The trip from our kitchen to the training site is about 45 miles. Each run uses a delivery vehicle with racks for the carriers. Drivers follow a fixed route through the three points. Before each run, the driver checks fuel, tires and lights. Drivers carry a printed map and the unit contacts for each point. If a road is closed, the driver uses the second route on the map. A backup vehicle covers any breakdown.",
      ],
    },
    {
      heading: "Staffing",
      paragraphs: ["The work is staffed by 2 cooks, 3 food service workers and 2 drivers."],
      table: {
        head: ["Role", "Number", "Shift", "Main job"],
        rows: [
          [
            "Cook",
            "2",
            "One from 2:00 AM, one from 12:00 PM",
            "Cooks each meal on the day it is served",
          ],
          [
            "Food service worker",
            "3",
            "Morning and afternoon",
            "Prepares cold food, packs meals and cleans",
          ],
          ["Driver", "2", "One for each run", "Loads, drives and delivers the meals"],
        ],
      },
    },
    {
      heading: "Food safety on the road",
      paragraphs: [
        "Hot food stays at 135°F or above, and cold food at 41°F or below. Staff check every container with a probe thermometer at loading. Drivers check again at each delivery point. Probes are cleaned and sanitized between readings. Vehicles are cleaned inside after every run. Raw food never travels with cooked meals. Every food handler completes food handler training before the first shift.",
      ],
    },
    {
      heading: "If a delivery is late",
      paragraphs: [
        "Drivers leave with 15 extra minutes for delays. If a driver expects to be late, the driver calls the unit contact at once. The driver also calls our kitchen. If a vehicle fails on the road, the backup vehicle leaves within 15 minutes. The food stays sealed in its carriers until the backup arrives.",
        "Any food outside the safe range is not served. We replace it with fresh food from the kitchen. We record every late delivery and its cause. We report it to the contracting officer the same day.",
      ],
    },
    {
      heading: "Quality checks",
      paragraphs: ["Each meal is checked before it leaves the kitchen."],
      table: {
        head: ["What we check", "When", "Who"],
        rows: [
          ["Menu matches the 21-day cycle", "Before cooking", "Cook"],
          ["Headcount changes are applied", "Before packing", "Cook"],
          ["Portion size and count", "During packing", "Food service worker"],
          ["Labels on every carrier", "Before loading", "Food service worker"],
          ["Food temperatures", "At loading and delivery", "Food service worker and driver"],
          ["Arrival time at each point", "Every run", "Driver"],
          ["Comments from the units", "Weekly", "Owner"],
        ],
      },
    },
    {
      heading: "Records",
      paragraphs: [
        "We keep a record of every meal we deliver. Temperature logs show each reading at loading and at delivery. Delivery sheets show the time, the count and who received the meals. Headcount changes are logged with the time we received them. All logs are kept for the contracting officer and shown on request. We keep records for the full contract and any option periods.",
      ],
    },
  ],
};

/** Used for any section with no blocks of its own. */
export const GENERIC_FILLER: FillerBlock[] = [
  {
    heading: "How we work",
    paragraphs: [
      "We are a small, owner-run catering company. Every job has one lead who is responsible for the work. We plan each job in writing before it starts. We keep our promises small and clear, and we keep them.",
    ],
  },
  {
    heading: "Quality",
    paragraphs: [
      "We check taste, portion and temperature before food is served. We fix any problem the same day. We ask each buyer for comments every month. We use those comments to improve the menu and the service.",
    ],
  },
  {
    heading: "Communication",
    paragraphs: [
      "Each buyer has one contact at our company. We answer emails and calls within 1 business day. We report any problem on the day it happens. We tell the buyer what we did to fix it.",
    ],
  },
  {
    heading: "Records",
    paragraphs: [
      "We keep logs for temperatures, cleaning, deliveries and counts. Each log is signed by the person who did the work. Buyers and inspectors can read our logs on request. We keep every log for the full contract.",
    ],
  },
  {
    heading: "Staff training",
    paragraphs: [
      "Every new staff member trains for one week before working alone. Training covers food safety, allergens, cleaning and guest service. Staff repeat the main topics each year. We keep a signed record of every session.",
    ],
  },
  {
    heading: "Food safety",
    paragraphs: [
      "Hot food stays at 135°F or above. Cold food stays at 41°F or below. Staff wash hands often and wear gloves to serve food. Raw and cooked food are always stored apart.",
    ],
  },
];
