/**
 * Parts guide: the main parts of a car, grouped by system, with a plain description of what each part does.
 * This is general information about part TYPES, not fitment: it never says a part fits a given make, model or
 * year. Fitment is confirmed with the customer (chassis number) before ordering.
 *
 * `match` is matched (case-insensitive, "contains") against our product names to show whether we stock it and
 * which picture to use.
 */
export type GuidePart = { name: string; match: string; what: string };
export type GuideSystem = { slug: string; title: string; intro: string; parts: GuidePart[] };

export const partsGuide: GuideSystem[] = [
  {
    slug: "engine",
    title: "Engine",
    intro: "Turns fuel into the power that moves the vehicle.",
    parts: [
      { name: "Cylinder head", match: "cylinder head", what: "Sits on top of the engine block and holds the valves and spark plugs or injectors. It seals the combustion chambers." },
      { name: "Cylinder head gasket", match: "cylinder head gasket", what: "Seals the join between the engine block and the cylinder head so oil, coolant and combustion gas stay where they belong." },
      { name: "Piston and piston rings", match: "piston", what: "The piston moves up and down in the cylinder; the rings seal it against the cylinder wall and control oil." },
      { name: "Crankshaft", match: "crankshaft", what: "Turns the up-and-down movement of the pistons into rotation that drives the gearbox." },
      { name: "Camshaft", match: "cam shaft", what: "Opens and closes the engine valves at the right moment." },
      { name: "Timing belt / chain", match: "timing", what: "Keeps the crankshaft and camshaft in step. If it fails the engine can be badly damaged." },
      { name: "Engine valve", match: "engine valve", what: "Lets air and fuel into the cylinder and exhaust gas out." },
      { name: "Main and con rod bearings", match: "bearing", what: "Thin shells that let the crankshaft and connecting rods spin smoothly with a film of oil." },
      { name: "Engine mounting", match: "engine mounting", what: "Rubber and metal supports that hold the engine in the body and absorb vibration." },
      { name: "Oil pump", match: "oil pump", what: "Pushes engine oil around the engine to lubricate and cool moving parts." },
      { name: "Oil seal and gaskets", match: "gasket", what: "Seal joints and shafts to stop oil and coolant leaks." },
      { name: "Fan belt", match: "fan belt", what: "Drives the alternator, water pump, power steering pump and A/C compressor from the engine." },
    ],
  },
  {
    slug: "fuel-air",
    title: "Fuel and air",
    intro: "Delivers clean air and fuel to the engine.",
    parts: [
      { name: "Fuel pump", match: "fuel pump", what: "Moves fuel from the tank to the engine at the right pressure." },
      { name: "Fuel filter", match: "filter fuel", what: "Catches dirt and water before they reach the injectors or injection pump." },
      { name: "Injector pump", match: "injector pump", what: "On diesel engines, sends fuel to the injectors at very high pressure." },
      { name: "Air filter", match: "air filter", what: "Cleans the air going into the engine. A blocked one wastes fuel and power." },
      { name: "Turbocharger", match: "turbo charger", what: "Uses exhaust gas to force more air into the engine for more power." },
      { name: "Intercooler", match: "intercooler", what: "Cools the compressed air from the turbo so the engine can burn more fuel efficiently." },
      { name: "Vacuum pump", match: "vacuum pump", what: "Provides vacuum that helps the brake booster work on diesel engines." },
    ],
  },
  {
    slug: "cooling-ac",
    title: "Cooling and air conditioning",
    intro: "Keeps the engine at the right temperature and the cabin comfortable.",
    parts: [
      { name: "Radiator", match: "radiator", what: "Passes engine heat from the coolant to the air." },
      { name: "Water pump", match: "water pump", what: "Circulates coolant through the engine and radiator." },
      { name: "Fan clutch / radiator fan", match: "fan", what: "Pulls air through the radiator, especially at low speed." },
      { name: "A/C compressor", match: "compressor", what: "Pressurises the refrigerant so the air conditioning can cool the cabin." },
      { name: "A/C condenser", match: "condenser", what: "Releases heat from the refrigerant, like a small radiator in front of the engine radiator." },
      { name: "Evaporator", match: "evaporator", what: "Inside the dashboard: it cools the air that blows into the cabin." },
      { name: "Expansion valve", match: "expansion valve", what: "Controls how much refrigerant enters the evaporator." },
      { name: "Heater blower", match: "blower", what: "The fan that pushes air through the vents." },
    ],
  },
  {
    slug: "brakes",
    title: "Brakes",
    intro: "Slow and stop the vehicle safely.",
    parts: [
      { name: "Brake pads", match: "brake pad", what: "Press on the disc to slow the wheel. They wear down and need replacing." },
      { name: "Brake disc (rotor)", match: "disc rotor", what: "The metal disc the pads grip. Worn or warped discs cause shaking when braking." },
      { name: "Brake caliper", match: "calliper", what: "Holds the pads and squeezes them against the disc when you press the pedal." },
      { name: "Brake drum and shoes", match: "brake shoe", what: "On many rear axles, shoes press outward against a drum to brake." },
      { name: "Brake master cylinder", match: "b.m.c", what: "Turns pedal pressure into hydraulic pressure for the brake lines." },
      { name: "Brake booster", match: "brake booster", what: "Makes the brake pedal easier to press." },
      { name: "Wheel cylinder", match: "wheel cylinder", what: "Pushes the brake shoes outward in drum brakes." },
      { name: "ABS sensor", match: "abs sensor", what: "Reads wheel speed so the ABS can stop the wheels locking." },
      { name: "Handbrake cable", match: "hand brake", what: "Connects the handbrake lever to the rear brakes." },
    ],
  },
  {
    slug: "suspension-steering",
    title: "Suspension and steering",
    intro: "Give a smooth ride and let you control the vehicle.",
    parts: [
      { name: "Shock absorber", match: "shock absorber", what: "Controls the bounce of the springs so the vehicle stays stable and comfortable." },
      { name: "Coil spring", match: "coil spring", what: "Carries the weight of the vehicle and absorbs bumps." },
      { name: "Lower and upper arm", match: "arm", what: "Link the wheel hub to the body and let the wheel move up and down." },
      { name: "Arm bushes", match: "bush", what: "Rubber sleeves that cushion the joints in the suspension and cut noise." },
      { name: "Ball joint", match: "ball joint", what: "A pivot that lets the wheel steer and move with the suspension." },
      { name: "Tie rod end", match: "tie rod", what: "Connects the steering rack to the wheel so it turns when you steer." },
      { name: "Stabilizer link and bush", match: "stabilizer", what: "Connect the anti-roll bar to the suspension to reduce body roll in corners." },
      { name: "Steering rack", match: "steering rack", what: "Converts the rotation of the steering wheel into side-to-side movement of the wheels." },
      { name: "Power steering pump", match: "power steering pump", what: "Provides the hydraulic assistance that makes steering light." },
      { name: "Steering knuckle", match: "knuckle", what: "Holds the wheel hub and bearing and connects to the steering and suspension." },
    ],
  },
  {
    slug: "drivetrain",
    title: "Gearbox, clutch and drive",
    intro: "Carry the engine's power to the wheels.",
    parts: [
      { name: "Clutch plate and cover", match: "clutch", what: "Connect and disconnect the engine from the gearbox when changing gear (manual vehicles)." },
      { name: "Gearbox mounting", match: "gear box mounting", what: "Supports the gearbox and absorbs vibration." },
      { name: "Drive shaft and CV joint", match: "drive shaft", what: "Send power from the gearbox or differential to the wheels while allowing them to move and steer." },
      { name: "Propeller shaft", match: "properal shaft", what: "Carries power from the gearbox to the rear (or front) differential." },
      { name: "Universal joint", match: "universal joint", what: "Lets the propeller shaft bend as the suspension moves." },
      { name: "Wheel hub bearing", match: "hub bearing", what: "Lets the wheel spin freely with little friction." },
      { name: "Differential", match: "diff", what: "Lets the left and right wheels turn at different speeds in corners." },
    ],
  },
  {
    slug: "electrical",
    title: "Electrical and sensors",
    intro: "Start the engine, charge the battery and report to the computer.",
    parts: [
      { name: "Starter motor", match: "starter", what: "Turns the engine over to start it." },
      { name: "Alternator", match: "alternator", what: "Charges the battery and powers the electrics while the engine runs." },
      { name: "Crankshaft sensor", match: "crankshaft sensor", what: "Tells the engine computer how fast the engine is turning, so it can time the spark and fuel." },
      { name: "Oxygen sensor", match: "oxgen sensor", what: "Measures oxygen in the exhaust so the engine computer can keep fuel use and emissions in balance." },
      { name: "Window machine", match: "window machine", what: "The motor and mechanism that raises and lowers a power window." },
      { name: "Wiper motor", match: "wiper motor", what: "Drives the windscreen wipers." },
    ],
  },
  {
    slug: "lighting",
    title: "Lights",
    intro: "See and be seen.",
    parts: [
      { name: "Headlamp", match: "head lamp", what: "Lights the road ahead." },
      { name: "Fog lamp", match: "fog lamp", what: "Low, wide beam for fog, rain and dust." },
      { name: "Rear lamp", match: "rear lamp", what: "Tail, brake and indicator lights at the back." },
      { name: "Corner lamp", match: "corner lamp", what: "Indicator and side light at the front corner." },
    ],
  },
  {
    slug: "body",
    title: "Body and trim",
    intro: "The outside shell and what is fitted to it.",
    parts: [
      { name: "Front bumper", match: "bumper", what: "Absorbs low-speed impacts and frames the front of the vehicle." },
      { name: "Grille", match: "grill", what: "Lets air reach the radiator and gives the front its look." },
      { name: "Bonnet (hood)", match: "bonet", what: "The panel over the engine." },
      { name: "Fender", match: "fender", what: "The panel over each wheel." },
      { name: "Side mirror", match: "side mirror", what: "Lets the driver see along the sides of the vehicle." },
      { name: "Door handle", match: "door handle", what: "Opens the door from outside or inside." },
    ],
  },
  {
    slug: "filters-fluids",
    title: "Filters and fluids",
    intro: "Routine service items.",
    parts: [
      { name: "Oil filter", match: "filter oil", what: "Removes dirt from engine oil." },
      { name: "A/C (cabin) filter", match: "ac filter", what: "Cleans the air that enters the cabin." },
      { name: "Engine oil", match: "engine oil", what: "Lubricates and cools the engine." },
      { name: "Brake fluid", match: "brake fluid", what: "The fluid that carries pressure in the brake system." },
      { name: "Coolant", match: "coolant", what: "Carries heat away from the engine and protects it from freezing and corrosion." },
    ],
  },
  {
    slug: "exhaust",
    title: "Exhaust",
    intro: "Carries exhaust gas away and quietens the engine.",
    parts: [
      { name: "Exhaust pipe and muffler", match: "exhaust", what: "Carries exhaust gas to the back and reduces noise." },
      { name: "Muffler support", match: "muffer support", what: "Rubber hanger that holds the exhaust under the vehicle." },
    ],
  },
];
