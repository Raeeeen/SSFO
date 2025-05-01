"use client";

import { database } from "@/app/lib/firebase";
import { ref, get } from "firebase/database";
import { useEffect, useState } from "react";
import Image from "next/image";

/* eslint-disable prefer-const, @typescript-eslint/no-explicit-any */

// Get all days of current month
function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const days = [];
  while (date.getMonth() === month - 1) {
    const day = date.getDate().toString().padStart(2, "0");
    days.push(day);
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Format like "01-Feb"
function formatShortDate(year: number, month: number, day: string) {
  const date = new Date(year, month - 1, parseInt(day));
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
}

const convertTo24HourFormat = (time12h: string) => {
    const [time, modifier] = time12h.split(" ");
  
    if (!time || !modifier) return null;
  
    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
  
    if (modifier.toUpperCase() === "PM" && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }
  
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };
  

// Helper function to calculate worked hours and minutes
const calculateWorkedHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return { hours: 0, minutes: 0 };
  
    const timeIn24 = convertTo24HourFormat(timeIn);
    const timeOut24 = convertTo24HourFormat(timeOut);
  
    if (!timeIn24 || !timeOut24) {
      console.warn("Invalid time conversion", { timeIn, timeOut });
      return { hours: 0, minutes: 0 };
    }
  
    const [inH, inM] = timeIn24.split(":").map(Number);
    const [outH, outM] = timeOut24.split(":").map(Number);
  
    const timeInDate = new Date(1970, 0, 1, inH, inM);
    const timeOutDate = new Date(1970, 0, 1, outH, outM);
  
    let diff = timeOutDate.getTime() - timeInDate.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
  
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); // Use 'const' instead of 'let'
  
    return { hours, minutes };
  };

export default function Home() {
  const [names, setNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [dtrData, setDtrData] = useState<Record<string, any>>({});

  const [searchQuery, setSearchQuery] = useState<string>("");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const currentMonthPath = `${year}-${month.toString().padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    const fetchNames = async () => {
      const snapshot = await get(ref(database, "embeddings"));
      const fetchedNames = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      setNames(fetchedNames);
    };
    fetchNames();
  }, []);

  useEffect(() => {
    const fetchDTR = async () => {
      if (!selectedName) return;
      const path = `logs/${selectedName}/${currentMonthPath}`;
      const snapshot = await get(ref(database, path));
      setDtrData(snapshot.exists() ? snapshot.val() : {});
    };
    fetchDTR();
  }, [selectedName, currentMonthPath]);

  const filteredNames = names.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTotalTime = () => {
    let totalHours = 0;
    let totalMinutes = 0;
    
    daysInMonth.forEach((day) => {
      const logs = dtrData[day] || {};
      
      // Calculate hours for AM and PM
      const amWorked = calculateWorkedHours(logs.AM_IN, logs.AM_OUT);
      const pmWorked = calculateWorkedHours(logs.PM_IN, logs.PM_OUT);
      
      totalHours += amWorked.hours + pmWorked.hours;
      totalMinutes += amWorked.minutes + pmWorked.minutes;
    });
    
    // Convert minutes to hours if necessary
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60; // Remaining minutes

    return { totalHours, totalMinutes };
  };

  const { totalHours, totalMinutes } = calculateTotalTime();

  return (
    <main className="flex min-h-screen bg-gray-100 py-8 print:bg-white print:block">
      {/* Sidebar - Names (hidden when printing) */}
      <div className="w-1/4 bg-white border-r border-gray-300 p-6 overflow-y-auto print:hidden">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Employee</h2>
        <div className="mb-4 text-black ">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <ul className="space-y-2">
          {filteredNames.map((name) => (
            <li
              key={name}
              onClick={() => setSelectedName(name)}
              className={`cursor-pointer px-4 py-2 rounded-lg ${selectedName === name
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-100 text-gray-800"}`}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white overflow-y-auto print:w-full print:px-4 print:py-6 relative">
        {/* Print Button (hidden when printing) */}
        <button
          onClick={() => window.print()}
          className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded print:hidden text-center"
        >
          Print PDF
        </button>

        <div className="p-6 print:pt-10 print:pb-10 print:px-4 flex justify-center">
          <div className="w-full max-w-3xl text-sm text-gray-800">
            {/* Header */}
            <div className="text-center mb-8 flex flex-col items-center">
            <Image
  src="/assets/dtrsystemicon.png"
  alt="Logo"
  width={80}
  height={80}
  className="object-contain mb-2"
/>

              <h1 className="text-base font-bold tracking-wide">DAILY TIME RECORD (DTR)</h1>
              <p className="text-xs font-bold">SSFO DUMALINAO SUB-OFFICE</p>
              <p className="text-xs mb-2 font-bold">{monthName} {year}</p>
            </div>

            {/* Name field */}
            <div className="mb-6">
              <p className="text-sm">
                <span className="font-semibold">Name:</span>{" "}
                <span className="border-b border-black inline-block w-64 ml-2 align-bottom">
                  {selectedName}
                </span>
              </p>
            </div>

            {/* Table Section */}
            <div className="mb-12">
              <div className="flex justify-center text-center">
                <table className="border border-black border-collapse text-xs w-auto">
                  <thead>
                    <tr>
                      <th className="border border-black px-1 py-1 w-16">Date</th>
                      <th className="border border-black px-1 py-1 w-16">A.M.</th>
                      <th className="border border-black px-1 py-1 w-16">Time-in</th>
                      <th className="border border-black px-1 py-1 w-16">Time-out</th>
                      <th className="border border-black px-1 py-1 w-16">P.M.</th>
                      <th className="border border-black px-1 py-1 w-16">Time-in</th>
                      <th className="border border-black px-1 py-1 w-16">Time-out</th>
                      <th className="border border-black px-1 py-1 w-20">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysInMonth.map((day) => {
                      const logs = dtrData[day] || {};
                      const formatted = formatShortDate(year, month, day);
                      return (
                        <tr key={day}>
                          <td className="border border-black px-1 py-1">{formatted}</td>
                          <td className="border border-black px-1 py-1"></td>
                          <td className="border border-black px-1 py-1">{logs.AM_IN || ""}</td>
                          <td className="border border-black px-1 py-1">{logs.AM_OUT || ""}</td>
                          <td className="border border-black px-1 py-1"></td>
                          <td className="border border-black px-1 py-1">{logs.PM_IN || ""}</td>
                          <td className="border border-black px-1 py-1">{logs.PM_OUT || ""}</td>
                          <td className="border border-black px-1 py-1"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-8 mt-10">
              <div className="text-sm">
                <span className="font-semibold">TOTAL: </span>
                <span className="border-b border-black inline-block w-64 align-bottom">
                  {totalHours} hours {totalMinutes} minutes
                </span>
              </div>

              <div className="mt-6">
                <p className="text-xs italic leading-snug text-center">
                  *I CERTIFY on my honor that the above is a true and correct report of the work performed,
                  record of which was made daily at the time of arrival at and departure from office.*
                </p>
              </div>

              <div className="flex justify-start mt-10">
                <div className="text-center text-sm">
                  <p className="font-semibold border-t border-black pt-1">MRS. ARLYN BOJOS</p>
                  <p>Municipal Facilitator</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
