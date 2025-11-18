"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [booking, setBooking] = useState({});
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");

  // --- FIX: SAFE MERGE FUNCTION ---
  const updateBooking = (eventId, data) => {
    setBooking((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] || {}),
        ...data,
      },
    }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = localStorage.getItem("user_id");
      const token = localStorage.getItem("user_token");
      const name = localStorage.getItem("user_name");

      if (!id || !token) {
        router.push("/login");
      } else {
        setUserId(id);
        setUserName(name || "");
        loadEvents();
        loadBookedTickets(id);
      }
    }
  }, [router]);

  const loadEvents = async () => {
    try {
      const res = await fetch("http://localhost/london-park/get_events.php");
      const data = await res.json();

      const normalized = (data.events || []).map((ev) => ({
        ...ev,
        requiresAdult: Number(ev.requires_adult) === 1,
      }));

      setEvents(normalized);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const loadBookedTickets = async (id) => {
    try {
      const res = await fetch("http://localhost/london-park/get_bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      const data = await res.json();
      setBookedTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to load booked tickets:", err);
    }
  };

  const handleBook = async (ev) => {
    const b = booking[ev.id] || {};
    const quantity = b.quantity || 1;

    if (ev.requiresAdult && !b.adult_photo) {
      return alert("You must upload an adult photo for this event.");
    }

    if (ev.requiresAdult && quantity > 8) {
      return alert("Cannot book more than 8 tickets for adult events.");
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("eventId", ev.id);
    formData.append("quantity", quantity);
    formData.append("seat_type", b.seat_type || "without_table");

    if (ev.requiresAdult) {
      formData.append("adult_photo", b.adult_photo);
    }

    try {
      const res = await fetch("http://localhost/london-park/book_ticket.php", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON:", text);
        return alert("Booking failed. Invalid server response.");
      }

      if (data.status === "success") {
        alert("Ticket booked successfully!");
        setBookedTickets((prev) => [
          ...prev,
          { ...ev, quantity, seat_type: b.seat_type || "without_table" },
        ]);
        setBooking((prev) => ({ ...prev, [ev.id]: {} }));
      } else {
        alert(data.message || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      alert("Booking failed. Try again.");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-700">Welcome, {userName}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booked Tickets */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Booked Tickets</h2>
          {bookedTickets.length === 0 ? (
            <p>No tickets booked yet.</p>
          ) : (
            bookedTickets.map((t, idx) => (
              <div
                key={t.id || idx}
                className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-200"
              >
                <h3 className="font-bold">{t.name}</h3>
                <p>Date: {t.date}</p>
                <p>Quantity: {t.quantity}</p>
                <p>
                  Seat Type:{" "}
                  {t.seat_type === "with_table" ? "With Table" : "Without Table"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Available Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Events</h2>
          {events.length === 0 ? (
            <p>No events available currently.</p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{ev.name}</h3>
                  {ev.requiresAdult && (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                      Adult Required
                    </span>
                  )}
                </div>

                <p>{ev.description}</p>
                <p>Date: {ev.date}</p>
                <p>Price: £{ev.price}</p>

                <div className="mt-3 space-y-2">
                  {/* Quantity */}
                  <div>
                    <label className="block text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={ev.requiresAdult ? 8 : 100}
                      value={booking[ev.id]?.quantity || 1}
                      onChange={(e) => {
                        let qty = parseInt(e.target.value) || 1;
                        if (ev.requiresAdult && qty > 8) qty = 8;
                        updateBooking(ev.id, { quantity: qty });
                      }}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  {/* Seat Type */}
                  <div>
                    <label className="block text-gray-600 mb-1">Seat Type</label>
                    <select
                      value={booking[ev.id]?.seat_type || "without_table"}
                      onChange={(e) =>
                        updateBooking(ev.id, { seat_type: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="without_table">Without Table</option>
                      <option value="with_table">With Table</option>
                    </select>
                  </div>

                  {/* Adult Photo */}
                  {ev.requiresAdult && (
                    <div>
                      <label className="block text-gray-600 mb-1">
                        Upload Adult Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          updateBooking(ev.id, {
                            adult_photo: e.target.files[0],
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Book */}
                  <button
                    onClick={() => handleBook(ev)}
                    className="mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                  >
                    Book Ticket
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}