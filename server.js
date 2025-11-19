// server.js
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public'))); // if you put index/html in public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Database setup
const db = new sqlite3.Database('./issues.db', (err) => {
  if (err) console.error(err);
});
db.run(`CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  issueType TEXT,
  description TEXT,
  imagePath TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// City -> portal mapping (sample list; extend as needed)
const portalMap = {
  'mumbai': 'https://portal.mcgm.gov.in/',
  'pune': 'https://pmc.gov.in/',
  'nashik': 'https://nashikcorp.in/',
  'delhi': 'https://mcdonline.nic.in/',
  'bangalore': 'https://www.bengaluru.cityportal.in/', // example; update with actual
  'hyderabad': 'https://www.greaterhyd.gov.in/',
  'chennai': 'https://chennaicorporation.gov.in/',
  'kolkata': 'https://www.kmcgov.in/',
  'ahmedabad': 'https://ahmedabadcity.gov.in/',
  'default': 'https://pgportal.gov.in/' // Central grievance portal
};

// Helper to find portal URL from city string
function findPortalUrl(city) {
  if (!city) return portalMap['default'];
  const key = city.toString().trim().toLowerCase();
  // try exact then partial match
  if (portalMap[key]) return portalMap[key];
  for (const k of Object.keys(portalMap)) {
    if (key.includes(k)) return portalMap[k];
  }
  return portalMap['default'];
}

// Endpoint to submit the issue
app.post('/api/submit-issue', upload.single('image'), (req, res) => {
  try {
    const { name, contact, area, city, issueType, description } = req.body;
    if (!name || !area || !city || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!req.file) return res.status(400).json({ message: 'Image required' });

    const imagePath = '/uploads/' + req.file.filename;
    db.run(
      `INSERT INTO issues (name, contact, area, city, issueType, description, imagePath) VALUES (?,?,?,?,?,?,?)`,
      [name, contact || '', area, city, issueType || '', description, imagePath],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'DB insert failed' });
        }
        const id = this.lastID;

        // generate draft text
        const draftText = `Subject: ${issueType || 'Local Issue'} - ${area}, ${city}\nSubmitted By: ${name}\nContact: ${contact || 'Not provided'}\nDate: ${new Date().toLocaleString()}\n\nDescription:\n${description}\n\nAttached Image URL: ${req.protocol}://${req.get('host')}${imagePath}`;

        // get portal
        const portalUrl = findPortalUrl(city);

        // respond with id, draftText, portalUrl
        return res.json({ id, draftText, portalUrl });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to generate or serve PDF for a saved issue
app.get('/api/issue-pdf/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM issues WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).send('Not found');

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-disposition', `attachment; filename=complaint_${id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(16).text('Official Complaint Draft', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Subject: ${row.issueType || 'Local Issue'} - ${row.area}, ${row.city}`);
    doc.moveDown();
    doc.text(`Submitted By: ${row.name}`);
    if (row.contact) doc.text(`Contact: ${row.contact}`);
    doc.text(`Date: ${row.createdAt}`);
    doc.moveDown();
    doc.text('Description:', { bold: true });
    doc.text(row.description);
    doc.moveDown();
    if (row.imagePath) {
      const imgPath = path.join(__dirname, row.imagePath);
      if (fs.existsSync(imgPath)) {
        try {
          doc.addPage().fontSize(14).text('Attached Image (evidence):', { underline: true });
          doc.image(imgPath, { fit: [450, 400], align: 'center' });
        } catch (e) {
          console.error('PDF image add error', e);
        }
      }
    }
    doc.end();
  });
});

// Admin endpoint to list issues (simple JSON)
// In production protect with authentication
app.get('/admin/issues', (req, res) => {
  db.all('SELECT * FROM issues ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
