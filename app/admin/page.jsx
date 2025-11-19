"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  // AUTH
  const [authChecked, setAuthChecked] = useState(false);

  // USERS
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // EVENTS
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // BOOKINGS
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // MODALS
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserMode, setEditUserMode] = useState(false);
  const [userFormData, setUserFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
  });

  const [showEventForm, setShowEventForm] = useState(false);
  const [editEventMode, setEditEventMode] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    id: "",
    name: "",
    description: "",
    date: "",
    price: "",
    requiresAdult: false,
  });

  // Image preview modal for adult photos
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);

  // AUTH CHECK
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("admin_token");
    if (!token) router.push("/admin/login");
    else setAuthChecked(true);
  }, [router]);

  // FETCH DATA helpers
  const safeParse = async (res) => {
    // read text then attempt to parse JSON (safer with PHP noise)
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON from server:", text);
      throw new Error("Invalid JSON response from server (check PHP error logs).");
    }
  };

  // FETCH USERS
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("http://localhost/london-park/admin_get_users.php");
      const data = await safeParse(res);
      if (data.status === "success") setUsers(data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to load users. See console.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // FETCH EVENTS
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("http://localhost/london-park/admin_get_events.php");
      const data = await safeParse(res);
      if (data.status === "success") {
        const normalized = (data.events || []).map(ev => ({
          ...ev,
          // normalise numeric/boolean styles
          requires_adult: ev.requires_adult === 1 || ev.requires_adult === "1" || ev.requires_adult === true,
        }));
        setEvents(normalized);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      alert("Failed to load events. See console.");
    } finally {
      setLoadingEvents(false);
    }
  };

  // FETCH BOOKINGS (NEW)
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch("http://localhost/london-park/admin_get_bookings.php");
      const data = await safeParse(res);
      if (data.status === "success") {
        // Normalize field names and optionally enrich with event/user names
        const normalized = (data.bookings || []).map(b => {
          // Accept both booked_at and bookedAt
          const booked_at = b.booked_at || b.bookedAt || b.bookedAt || b.booked_at_sql || null;
          return {
            ...b,
            booked_at,
            // ensure IDs are numbers
            id: Number(b.id),
            user_id: b.user_id ? Number(b.user_id) : (b.userId ? Number(b.userId) : null),
            event_id: b.event_id ? Number(b.event_id) : (b.eventId ? Number(b.eventId) : null),
          };
        });
        setBookings(normalized);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      alert("Failed to load bookings. See console.");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchUsers();
      fetchEvents();
      fetchBookings();
    }
  }, [authChecked]);

  // INPUT HANDLERS
  const handleUserChange = (e) =>
    setUserFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEventChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // USER MODAL HANDLERS
  const openCreateUser = () => {
    setEditUserMode(false);
    setUserFormData({ id: "", name: "", email: "", password: "" });
    setShowUserForm(true);
  };
  const openEditUser = (user) => {
    setEditUserMode(true);
    setUserFormData({ id: user.id, name: user.name, email: user.email, password: "" });
    setShowUserForm(true);
  };
  const handleSaveUser = async () => {
    if (!userFormData.name || !userFormData.email) {
      return alert("Name and Email are required.");
    }
    if (!editUserMode && !userFormData.password) {
      return alert("Password is required for new users.");
    }

    try {
      const res = await fetch(
        `http://localhost/london-park/${editUserMode ? "admin_update_user.php" : "admin_create_user.php"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userFormData),
        }
      );
      const data = await safeParse(res);
      alert(data.message);
      if (data.status === "success") {
        setShowUserForm(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save user. See console.");
    }
  };
  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch("http://localhost/london-park/admin_delete_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await safeParse(res);
      alert(data.message);
      if (data.status === "success") fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user. See console.");
    }
  };

  // EVENT MODAL HANDLERS
  const openCreateEvent = () => {
    setEditEventMode(false);
    setEventFormData({ id: "", name: "", description: "", date: "", price: "", requiresAdult: false });
    setShowEventForm(true);
  };
  const openEditEvent = (event) => {
    setEditEventMode(true);
    setEventFormData({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      price: event.price,
      requiresAdult: !!event.requires_adult,
    });
    setShowEventForm(true);
  };
  const handleSaveEvent = async () => {
    if (!eventFormData.name || !eventFormData.date || !eventFormData.price) {
      return alert("Name, Date, and Price are required.");
    }

    // payload uses requiresAdult as 1/0 for PHP
    const payload = {
      id: eventFormData.id,
      name: eventFormData.name,
      description: eventFormData.description,
      date: eventFormData.date,
      price: eventFormData.price,
      requiresAdult: eventFormData.requiresAdult ? 1 : 0,
    };

    try {
      const res = await fetch(
        `http://localhost/london-park/${editEventMode ? "admin_update_event.php" : "admin_create_event.php"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await safeParse(res);
      alert(data.message);
      if (data.status === "success") {
        setShowEventForm(false);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save event. See console.");
    }
  };
  const handleDeleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch("http://localhost/london-park/admin_delete_event.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await safeParse(res);
      alert(data.message);
      if (data.status === "success") fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to delete event. See console.");
    }
  };

  // BOOKINGS actions (NEW)
  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Delete this booking?")) return;
    try {
      const res = await fetch("http://localhost/london-park/admin_delete_booking.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId }),
      });
      const data = await safeParse(res);
      alert(data.message);
      if (data.status === "success") fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to delete booking. See console.");
    }
  };

  const openImagePreview = (src) => {
    if (!src) {
      alert("No image available.");
      return;
    }
    setImagePreviewSrc(src);
  };

  const closeImagePreview = () => setImagePreviewSrc(null);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.push("/admin/login");
  };

  if (!authChecked) return <p className="p-6">Checking authentication…</p>;
  if (loadingUsers || loadingEvents || loadingBookings) return <p className="p-6">Loading data…</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded" onClick={openCreateUser}>+ User</button>
          <button className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded" onClick={openCreateEvent}>+ Event</button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* USERS TABLE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.created_at}</td>
                  <td className="p-3 flex gap-2">
                    <button className="bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded" onClick={() => openEditUser(u)}>Edit</button>
                    <button className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded" onClick={() => handleDeleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* EVENTS TABLE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Requires Adult</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">{e.id}</td>
                  <td className="p-3">{e.name}</td>
                  <td className="p-3">{e.description}</td>
                  <td className="p-3">{e.date}</td>
                  <td className="p-3">£{e.price}</td>
                  <td className="p-3">{e.requires_adult ? "Yes" : "No"}</td>
                  <td className="p-3 flex gap-2">
                    <button className="bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded" onClick={() => openEditEvent(e)}>Edit</button>
                    <button className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded" onClick={() => handleDeleteEvent(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BOOKINGS TABLE (NEW) */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Event</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Seat Type</th>
                <th className="p-3 text-left">Adult Photo</th>
                <th className="p-3 text-left">Booked At</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">{b.id}</td>
                  <td className="p-3">{b.user_name ?? "-"}</td>
                  <td className="p-3">{b.event_name ?? "-"}</td>
                  <td className="p-3">{b.quantity}</td>
                  <td className="p-3">{b.seat_type ?? "-"}</td>
                  <td className="p-3">
                    {b.adult_photo ? (
                      <button
                        className="text-sm underline text-blue-600"
                        onClick={() => openImagePreview(b.adult_photo)}
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-3">{b.booked_at ? new Date(b.booked_at).toLocaleString() : "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
                      onClick={() => handleDeleteBooking(b.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editUserMode ? "Edit User" : "Create User"}</h2>
            <input name="name" placeholder="Full Name" className="border p-2 w-full mb-3 rounded" value={userFormData.name} onChange={handleUserChange} />
            <input name="email" placeholder="Email Address" className="border p-2 w-full mb-3 rounded" value={userFormData.email} onChange={handleUserChange} />
            <input name="password" type="password" placeholder={editUserMode ? "New Password (optional)" : "Password"} className="border p-2 w-full mb-4 rounded" value={userFormData.password} onChange={handleUserChange} />
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setShowUserForm(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded" onClick={handleSaveUser}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editEventMode ? "Edit Event" : "Create Event"}</h2>
            <input name="name" placeholder="Event Name" className="border p-2 w-full mb-3 rounded" value={eventFormData.name} onChange={handleEventChange} />
            <textarea name="description" placeholder="Description" className="border p-2 w-full mb-3 rounded" value={eventFormData.description} onChange={handleEventChange}></textarea>
            <input name="date" type="date" className="border p-2 w-full mb-3 rounded" value={eventFormData.date} onChange={handleEventChange} />
            <input name="price" type="number" placeholder="Price" className="border p-2 w-full mb-3 rounded" value={eventFormData.price} onChange={handleEventChange} />
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" name="requiresAdult" checked={eventFormData.requiresAdult} onChange={handleEventChange} />
              Requires Adult
            </label>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setShowEventForm(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded" onClick={handleSaveEvent}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {imagePreviewSrc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white p-4 rounded max-w-3xl w-full mx-4">
            <div className="flex justify-end">
              <button onClick={closeImagePreview} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>
            <div className="mt-4">
              {/* If stored path is relative, prepend host */}
              <img
                src={imagePreviewSrc.startsWith("http") ? imagePreviewSrc : `http://localhost/london-park/${imagePreviewSrc}`}
                alt="Adult proof"
                className="max-h-[70vh] w-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}