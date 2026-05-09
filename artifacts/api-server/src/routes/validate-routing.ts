import { Router, type IRouter } from "express";

const router: IRouter = Router();

export const ABA_ROUTING_TABLE: Record<string, string> = {
  // Major national banks
  "021000021": "JPMorgan Chase Bank",
  "021000089": "Citibank",
  "026009593": "Bank of America",
  "121000248": "Wells Fargo Bank",
  "053000219": "Truist Bank",
  "044000037": "JPMorgan Chase Bank",
  "031100157": "Wells Fargo Bank",
  "121042882": "Wells Fargo Bank",
  "322271627": "JPMorgan Chase Bank",
  "021001033": "HSBC Bank USA",
  "022000020": "KeyBank",
  "041001039": "KeyBank",
  "021301115": "TD Bank",
  "053100300": "TD Bank",
  "031202084": "TD Bank",
  "011000015": "Bank of America",
  "051000017": "Bank of America",
  "071000039": "Bank of America",
  "091000019": "U.S. Bank",
  "081000210": "U.S. Bank",
  "042000013": "Fifth Third Bank",
  "011103093": "Citizens Bank",
  "241070417": "Fifth Third Bank",
  "065302173": "Regions Bank",
  "062005690": "Regions Bank",
  "111900659": "Capital One",
  "031176110": "Capital One",
  "056073502": "Bank of America",
  "267084131": "Navy Federal Credit Union",
  "256074974": "Pentagon Federal Credit Union",
  "314089681": "USAA Federal Savings Bank",
  "124303201": "USAA Federal Savings Bank",
  // South Carolina and southeast
  "053207766": "South State Bank",
  "053101121": "First Citizens Bank",
  "253270635": "SC Federal Credit Union",
  "253279258": "Palmetto Citizens Federal Credit Union",
  "253271978": "Founders Federal Credit Union",
  "053112605": "Synovus Bank",
  "061000104": "SunTrust (now Truist)",
  "061092387": "Truist Bank (Southeast)",
  "061113415": "Regions Bank Georgia",
  "053202364": "Carolina Alliance Bank",
  "053271765": "CresCom Bank",
  "053100494": "First Reliance Bank",
  "053902197": "Conway National Bank",
  "063100277": "SunTrust (now Truist) FL",
  // Credit unions & online banks
  "321180379": "Alliant Credit Union",
  "031101334": "Ally Bank",
  "124085024": "Ally Bank",
  "124303120": "Charles Schwab Bank",
  "121202211": "Golden 1 Credit Union",
  "291479434": "Visions Federal Credit Union",
  "281082538": "American Airlines Credit Union",
  "322282001": "Schools First Federal Credit Union",
  "307083052": "Ent Credit Union",
  "263182817": "Suncoast Credit Union",
  "272484398": "Michigan Schools & Government CU",
  // Additional major institutions
  "021001208": "BNY Mellon",
  "071006486": "Wintrust Bank",
  "103100195": "BOK Financial",
  "102000021": "Wells Fargo Colorado",
  "124000054": "ZB National Association",
};

function isValidABAChecksum(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const d = routing.split("").map(Number);
  const checksum =
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8]);
  return checksum % 10 === 0;
}

router.get("/validate-routing/:routingNumber", (req, res): void => {
  const routing = req.params.routingNumber;

  if (!isValidABAChecksum(routing)) {
    res.json({ valid: false, bankName: null, routingNumber: routing, message: "Invalid routing number" });
    return;
  }

  const bankName = ABA_ROUTING_TABLE[routing];
  if (!bankName) {
    res.json({ valid: false, bankName: null, routingNumber: routing, message: "Routing number not found in our database" });
    return;
  }
  res.json({
    valid: true,
    bankName,
    routingNumber: routing,
    message: `Routing number recognized: ${bankName}`,
  });
});

export default router;
