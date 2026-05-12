import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, Clock, Wifi, CreditCard, DollarSign } from "lucide-react";

const ATMs = [
  {
    id: 1,
    name: "Crestline Bank — Downtown Columbia",
    address: "245 Meeting St",
    city: "Columbia, SC 29201",
    distance: "0.2 mi",
    hours: "Open 24/7",
    features: ["Surcharge-Free", "Deposits", "Drive-Thru"],
    type: "branch",
    phone: "(803) 555-0100",
  },
  {
    id: 2,
    name: "Crestline Bank — Harbison",
    address: "1820 Sam Rittenberg Blvd",
    city: "Columbia, SC 29407",
    distance: "4.1 mi",
    hours: "Open 24/7",
    features: ["Surcharge-Free", "Deposits"],
    type: "branch",
    phone: "(843) 555-0101",
  },
  {
    id: 3,
    name: "Co-op ATM — Harris Teeter",
    address: "710 Folly Rd",
    city: "Columbia, SC 29412",
    distance: "5.8 mi",
    hours: "6 AM – 11 PM",
    features: ["Surcharge-Free"],
    type: "partner",
    phone: null,
  },
  {
    id: 4,
    name: "Co-op ATM — Publix King St",
    address: "580 King St",
    city: "Columbia, SC 29403",
    distance: "1.2 mi",
    hours: "7 AM – 10 PM",
    features: ["Surcharge-Free"],
    type: "partner",
    phone: null,
  },
  {
    id: 5,
    name: "Co-op ATM — CVS Pharmacy",
    address: "300 Wappoo Rd",
    city: "Columbia, SC 29407",
    distance: "3.4 mi",
    hours: "Open 24/7",
    features: ["Surcharge-Free"],
    type: "partner",
    phone: null,
  },
  {
    id: 6,
    name: "Crestline Bank — Fort Jackson",
    address: "4900 Centre Pointe Dr",
    city: "North Columbia, SC 29418",
    distance: "9.3 mi",
    hours: "Open 24/7",
    features: ["Surcharge-Free", "Deposits", "Drive-Thru"],
    type: "branch",
    phone: "(843) 555-0102",
  },
  {
    id: 7,
    name: "Co-op ATM — Walgreens",
    address: "1502 Sam Rittenberg Blvd",
    city: "Columbia, SC 29407",
    distance: "3.9 mi",
    hours: "Open 24/7",
    features: ["Surcharge-Free"],
    type: "partner",
    phone: null,
  },
  {
    id: 8,
    name: "Co-op ATM — Bi-Lo Supermarket",
    address: "1739 Maybank Hwy",
    city: "Johns Island, SC 29455",
    distance: "12.1 mi",
    hours: "7 AM – 9 PM",
    features: ["Surcharge-Free"],
    type: "partner",
    phone: null,
  },
];

const featureIcons: Record<string, React.ElementType> = {
  "Surcharge-Free": DollarSign,
  "Deposits": CreditCard,
  "Drive-Thru": Navigation,
};

export default function AtmLocator() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "branch" | "partner">("all");

  const filtered = ATMs.filter(atm => {
    const matchSearch = !search.trim() ||
      atm.name.toLowerCase().includes(search.toLowerCase()) ||
      atm.address.toLowerCase().includes(search.toLowerCase()) ||
      atm.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || atm.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary" data-testid="text-page-title">ATM & Branch Locator</h1>
        <p className="text-sm text-gray-400 mt-1">Find surcharge-free ATMs and Crestline Bank branches near you.</p>
      </div>

      {/* Map placeholder */}
      <div className="relative bg-gray-100 rounded-2xl overflow-hidden h-56 border border-gray-200">
        <iframe
          title="Crestline Bank Locations"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53386.09!2d-79.9581!3d32.7765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88fe7a42efbe3807%3A0x37539ca37578d9d6!2sCharleston%2C%20SC!5e0!3m2!1sen!2sus!4v1"
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute top-3 left-3 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-xs font-medium text-gray-700">
          <Wifi className="w-3.5 h-3.5 text-[#1A5C38]" />
          {ATMs.length} locations in your area
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by address or zip code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "branch", "partner"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#1A5C38] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f === "branch" ? "Our Branches" : "Partner ATMs"}
            </button>
          ))}
        </div>
      </div>

      {/* ATM list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(atm => (
          <Card key={atm.id} className="shadow-sm border-border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    atm.type === "branch" ? "bg-[#1A5C38]/10" : "bg-gray-100"
                  }`}>
                    <MapPin className={`w-4 h-4 ${atm.type === "branch" ? "text-[#1A5C38]" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{atm.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{atm.address}</p>
                    <p className="text-xs text-gray-400">{atm.city}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#1A5C38] bg-blue-50 px-2 py-1 rounded-full flex-shrink-0">
                  {atm.distance}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{atm.hours}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {atm.features.map(f => {
                  const Icon = featureIcons[f] ?? DollarSign;
                  return (
                    <span key={f} className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                      <Icon className="w-3 h-3" /> {f}
                    </span>
                  );
                })}
              </div>

              {atm.phone && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a href={`tel:${atm.phone}`} className="text-xs text-[#1A5C38] hover:underline font-medium">
                    {atm.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-600">No locations found</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">55,000+ Surcharge-Free ATMs Nationwide</p>
            <p className="text-sm text-gray-400 mt-0.5">As a Crestline Bank member, you have access to the CO-OP ATM Network — the largest credit union ATM network in the US.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
