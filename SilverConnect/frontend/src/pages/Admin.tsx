import { api } from "../api/client";

export default function AdminUI() {
  async function manageActivities() {
    await api("/admin/activities");
    alert("Managing activities");
  }
  async function manageReviews() {
    await api("/admin/reviews");
    alert("Managing reviews");
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <button onClick={manageActivities}>Manage Activities</button>
      <button onClick={manageReviews}>Manage Reviews</button>
    </div>
  );
}
