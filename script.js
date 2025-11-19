// Replace with your own token if needed
const AQI_TOKEN='a3f9c940ae8b39b5b1e542cfea24aaaad1229fc3';

const modalData={
  "aqi_delhi":{"label":"AQI — Delhi","value":"--","explain":"Air quality index for Delhi.","actions":["Use masks, reduce pollution"]},
  "aqi_mumbai":{"label":"AQI — Mumbai","value":"--","explain":"Air quality index for Mumbai.","actions":["Plant trees, use public transport"]},
  "aqi_kolkata":{"label":"AQI — Kolkata","value":"--","explain":"Air quality index for Kolkata.","actions":["Support clean energy"]},
  "aqi_bengaluru":{"label":"AQI — Bengaluru","value":"--","explain":"Air quality index for Bengaluru.","actions":["Carpool, conserve energy"]},
  "aqi_chennai":{"label":"AQI — Chennai","value":"--","explain":"Air quality index for Chennai.","actions":["Limit stubble burning, tree plantation"]},
  "gdp":{"label":"GDP per Capita","value":"--","explain":"India’s GDP per capita.","actions":["Support local businesses, skill development"]},
  "happiness":{"label":"World Happiness Rank","value":"126/143","explain":"Well-being indicator.","actions":["Community engagement, mental health initiatives"]}
};

function openCard(key){
  const m = modalData[key];
  if(!m) return;
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <h2>${m.label}</h2>
    <p><strong>Current:</strong> ${m.value}</p>
    <p>${m.explain}</p>
    <h3>How citizens can help</h3>
    <ul><li>${m.actions.join('</li><li>')}</li></ul>
  `;
  modal.hidden = false; // only show when a card is clicked
}

function closeModal(){
  document.getElementById('modal').hidden = true;
}
async function fetchAQI(city){
  try{const r=await fetch('https://api.waqi.info/feed/'+city+'/?token='+AQI_TOKEN);const j=await r.json();
  if(j&&j.status==='ok'&&j.data&&j.data.aqi!=undefined)return j.data.aqi;return null;}catch(e){console.error(e);return null;}
}
async function fetchGDP(){
  try{const r=await fetch('https://api.worldbank.org/v2/country/IND/indicator/NY.GDP.PCAP.CD?format=json&per_page=1');const j=await r.json();
  if(j&&j[1]&&j[1][0]&&j[1][0].value)return Math.round(j[1][0].value);return null;}catch(e){console.error(e);return null;}
}

async function updateLive(){
  const last=document.getElementById('last-updated');if(last)last.textContent=new Date().toLocaleString();
  const cities={'aqi_delhi':'delhi','aqi_mumbai':'mumbai','aqi_kolkata':'kolkata','aqi_bengaluru':'bangalore','aqi_chennai':'chennai'};
  for(const key in cities){const aqi=await fetchAQI(cities[key]);if(aqi!==null){const el=document.getElementById('num-'+key);if(el)el.textContent=aqi;modalData[key].value=aqi;}}
  const gdp=await fetchGDP();if(gdp!==null){const el=document.getElementById('num-gdp');if(el)el.textContent=gdp;modalData['gdp'].value=gdp;}
}
// Submit handling (append to your existing script.js or import)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('issueForm');
  const popup = document.getElementById('issuePopup');
  const draftEl = document.getElementById('draftText');
  const copyBtn = document.getElementById('copyDraft');
  const downloadBtn = document.getElementById('downloadPdf');
  const gotoBtn = document.getElementById('gotoPortal');
  const closeBtn = document.getElementById('popupClose');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    // Simple client-side checks
    if (!fd.get('name') || !fd.get('area') || !fd.get('city') || !fd.get('description') || !fd.get('image')) {
      alert('Please fill all required fields (name, area, city, description, image).');
      return;
    }

    // Post to server endpoint
    try {
      const res = await fetch('/api/submit-issue', { method:'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit error');

      // Show draft in popup
      draftEl.textContent = data.draftText;
      popup.style.display = 'flex';

      // set actions
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(data.draftText).then(()=>alert('Draft copied to clipboard.'));
      };
      downloadBtn.onclick = () => {
        window.open(`/api/issue-pdf/${data.id}`, '_blank');
      };
      gotoBtn.onclick = () => {
        // open mapped portal in new tab
        window.open(data.portalUrl, '_blank');
      };
    } catch (err) {
      alert('Error submitting issue: ' + err.message);
    }
  });

  closeBtn.onclick = () => popup.style.display = 'none';
});

window.onload=updateLive;

