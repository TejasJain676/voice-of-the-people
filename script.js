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


  });
});

// ===================== POPUP CLOSE =====================
function closePdfPopup() {
  document.getElementById('pdfPopup').style.display = 'none';
}


