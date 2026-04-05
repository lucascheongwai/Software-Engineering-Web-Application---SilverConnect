import { api } from "../api/client";

export default function ReviewUI() {
  async function submitReview() {
    await api("/reviews", { method: "POST", body: JSON.stringify({ rating: 5, comments: "Great!" }) });
    alert("Review submitted");
  }
  async function editReview() {
    await api("/reviews/1", { method: "PUT", body: JSON.stringify({ rating: 4, comments: "Updated!" }) });
    alert("Review edited");
  }
  async function deleteReview() {
    await api("/reviews/1", { method: "DELETE" });
    alert("Review deleted");
  }
  async function reportReview() {
    await api("/reviews/1/report", { method: "POST" });
    alert("Review reported");
  }

  return (
    <div>
      <h2>Reviews</h2>
      <button onClick={submitReview}>Submit Review</button>
      <button onClick={editReview}>Edit Review</button>
      <button onClick={deleteReview}>Delete Review</button>
      <button onClick={reportReview}>Report Review</button>
    </div>
  );
}
