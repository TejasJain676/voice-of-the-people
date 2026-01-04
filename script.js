// ===================== FORM SUBMISSION =====================
document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('issueForm');
  const popup = document.getElementById('pdfPopup');
  const pdfLink = document.getElementById('pdfDownloadLink');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    // Client-side validation
    if (
      !fd.get('name') ||
      !fd.get('phone') ||
      !fd.get('email') ||
      !fd.get('city') ||
      !fd.get('description') ||
      !fd.get('image') ||
      !fd.get('image').name
    ) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/submit-complaint', {
        method: 'POST',
        body: fd
      });

      const data = await res.json();

      if (!res.ok) {
        alert('❌ ' + data.error);
        return;
      }

      // ✅ Show popup + set PDF link
      pdfLink.href = data.pdfUrl;
      popup.style.display = 'flex';

      form.reset();

    } catch (err) {
      alert('❌ Cannot connect to backend. Is the server running?');
    }
    // Simple scroll reveal
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.15 }
);

// Apply to sections
document.querySelectorAll(".box, .mission h2, .mission p").forEach(el => {
  el.style.opacity = 0;
  el.style.transform = "translateY(40px)";
  el.style.transition = "0.8s ease";
  observer.observe(el);
});

  });
});

// ===================== POPUP CLOSE =====================
function closePdfPopup() {
  document.getElementById('pdfPopup').style.display = 'none';
}

