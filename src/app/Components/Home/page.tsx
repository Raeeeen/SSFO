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
  const [names, setNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [dtrData, setDtrData] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthName = now.toLocaleDateString("en-US", { month: "long" })
  const currentMonthPath = `${year}-${month.toString().padStart(2, "0")}`
  const daysInMonth = getDaysInMonth(year, month)

  useEffect(() => {
    const img = new window.Image() // Use the native Image constructor
    img.src = "/assets/dtrsystemicon.png?v=1"
    img.onload = () => setImageLoaded(true) // Set imageLoaded to true when the image is loaded
  }, [])

  useEffect(() => {
    const fetchNames = async () => {
      const snapshot = await get(ref(database, "embeddings"))
      const fetchedNames = snapshot.exists() ? Object.keys(snapshot.val()) : []
      setNames(fetchedNames)
    }
    fetchNames()
  }, [])

  useEffect(() => {
    const fetchDTR = async () => {
      if (!selectedName) return
      const path = `logs/${selectedName}/${currentMonthPath}`
      const snapshot = await get(ref(database, path))
      setDtrData(snapshot.exists() ? snapshot.val() : {})
    }
    fetchDTR()
  }, [selectedName, currentMonthPath])

  const filteredNames = names.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calculateTotalTime = () => {
    let totalHours = 0
    let totalMinutes = 0

    daysInMonth.forEach((day) => {
      const logs = dtrData[day] || {}
      const amWorked = calculateWorkedHours(logs.AM_IN, logs.AM_OUT)
      const pmWorked = calculateWorkedHours(logs.PM_IN, logs.PM_OUT)

      totalHours += amWorked.hours + pmWorked.hours
      totalMinutes += amWorked.minutes + pmWorked.minutes
    })

    totalHours += Math.floor(totalMinutes / 60)
    totalMinutes = totalMinutes % 60

    return { totalHours, totalMinutes }
  }

  const printContent = () => {
    if (!imageLoaded) {
      alert("Image is still loading. Please wait and try printing again.")
      return
    }

    // Open a new print window
    const printWindow = window.open("", "", "width=800,height=600")

    if (!printWindow) {
      alert("Failed to open print window.")
      return
    }

    // Log the content to make sure it's there
    const printAreaContent = document.getElementById("print-area")?.innerHTML
    console.log(printAreaContent) // Check if this has the expected content

    // Write content to the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 2rem;
              background: white;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid black;
              padding: 0.25rem;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div id="print-area">
            ${printAreaContent}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Ensure the print dialog opens only after the content is ready
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const { totalHours, totalMinutes } = calculateTotalTime()

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "2rem",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #d1d5db",
          padding: "1.5rem",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            marginBottom: "1rem",
            color: "#374151",
          }}
        >
          Employee
        </h2>
        <div style={{ marginBottom: "1rem", color: "black" }}>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
            }}
          />
        </div>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {filteredNames.map((name) => (
            <li
              key={name}
              onClick={() => setSelectedName(name)}
              style={{
                cursor: "pointer",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: selectedName === name ? "#dbeafe" : "#f3f4f6",
                color: selectedName === name ? "#1d4ed8" : "#1f2937",
                fontWeight: selectedName === name ? "500" : "normal",
                marginBottom: "0.5rem",
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div
        id="print-area"
        style={{
          flexGrow: 1,
          backgroundColor: "#ffffff",
          overflowY: "auto",
          padding: "1.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={printContent} // updated from window.print()
          className="no-print"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.75rem",
            backgroundColor: "#e53e3e",
            color: "white",
            borderRadius: "0.375rem",
          }}
        >
          Print
        </button>

        <div
          style={{
            padding: "1.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "768px",
              fontSize: "0.875rem",
              color: "#4a4a4a",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/assets/dtrsystemicon.png?v=1"
                  alt="Logo"
                  width={80}
                  height={80}
                  style={{ objectFit: "contain", marginBottom: "0.5rem" }}
                  priority // Ensures the image is loaded sooner
                />
              </div>

              <h1
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  letterSpacing: "0.05rem",
                }}
              >
                DAILY TIME RECORD (DTR)
              </h1>
              <p style={{ fontSize: "0.75rem", fontWeight: "700" }}>
                SSFO DUMALINAO SUB-OFFICE
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  marginBottom: "0.5rem",
                  fontWeight: "700",
                }}
              >
                {monthName} {year}
              </p>
            </div>

            {/* Name field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.875rem" }}>
                <span style={{ fontWeight: "700" }}>Name:</span>{" "}
                <span
                  style={{
                    borderBottom: "1px solid black",
                    display: "inline-block",
                    width: "16rem",
                    marginLeft: "0.5rem",
                  }}
                >
                  {selectedName}
                </span>
              </p>
            </div>

            {/* Table Section */}
            <div style={{ marginBottom: "3rem", overflowX: "auto" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <table
                  style={{
                    border: "1px solid black",
                    borderCollapse: "collapse",
                    fontSize: "0.75rem",
                    width: "100%",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        A.M.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        Time-in
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        Time-out
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        P.M.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        Time-in
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "4rem",
                        }}
                      >
                        Time-out
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "0.25rem",
                          width: "5rem",
                        }}
                      >
                        Signature
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysInMonth.map((day) => {
                      const logs = dtrData[day] || {}
                      const formatted = formatShortDate(year, month, day)
                      return (
                        <tr key={day}>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          >
                            {formatted}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          ></td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          >
                            {logs.AM_IN || ""}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          >
                            {logs.AM_OUT || ""}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          ></td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          >
                            {logs.PM_IN || ""}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          >
                            {logs.PM_OUT || ""}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "0.25rem",
                            }}
                          ></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Section */}
            <div
              style={{
                marginTop: "3rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontWeight: "700" }}>TOTAL: </span>
                <span
                  style={{
                    borderBottom: "1px solid black",
                    display: "inline-block",
                    width: "16rem",
                    verticalAlign: "bottom",
                  }}
                >
                  {totalHours} hours {totalMinutes} minutes
                </span>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  *I CERTIFY on my honor that the above is a true and correct
                  report of the work performed, record of which was made daily
                  at the time of arrival at and departure from office.*
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginTop: "2.5rem",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "0.875rem",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      borderTop: "1px solid black",
                      paddingTop: "0.25rem",
                    }}
                  >
                    MARIFIE T. ASUBAR
                  </p>
                  <p>OIC - SSFO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body,
          html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            background: white;
            transform: scale(0.75); /* Adjusted for manual fit */
            transform-origin: top left;
          }
          .no-print {
            display: none !important;
          }

          /* Set page size and margins */
          @page {
            size: A4;
            margin: 5mm; /* Smaller margins to fit content */
          }

          /* Reduce font size for better fitting */
          #print-area {
            font-size: 0.7rem; /* Further reduced font size */
          }

          /* Table adjustments */
          table {
            width: 100%;
            font-size: 0.7rem; /* Reduced font size in table */
          }
          th,
          td {
            padding: 0.2rem; /* Reduced padding for smaller content */
          }

          /* Footer adjustments */
          .footer-section {
            margin-top: 2.5rem; /* Adjusted margin for footer */
            font-size: 0.7rem; /* Reduced footer font size */
            line-height: 1.4; /* Reduced line height to save space */
          }

          /* Footer content spacing */
          .footer-section div {
            margin-top: 0.5rem; /* Reduced space between footer content */
          }
          .footer-section p {
            margin: 0;
          }
        }
      `}</style>
    </main>
  )
}
