// api.js

// ตั้งค่า URL ของ Google Apps Script Web App (นำ URL ที่ได้จากการ Deploy มาวางตรงนี้)
const GAS_URL = "https://script.google.com/macros/s/AKfycbyaWOgaqrIqOlePad0g1wVUnP4to3LZLlnHYhvRs1JjX4sq2yZ1E6NBFuF3JkGwiKrGDA/exec";

/**
 * เรียก API แบบ GET
 * @param {string} route - ชื่อ route ที่จะเรียก (เช่น "getMember", "listMembers", ฯลฯ)
 * @param {Object} params - อ็อบเจ็กต์ของพารามิเตอร์ที่จะส่งผ่าน query string (เช่น { memberId: "M0001" })
 * @returns {Promise<Object>} - ผลลัพธ์ JSON ที่ API ส่งกลับ
 */
async function apiGet(route, params = {}) {
  // สร้าง query string เริ่มต้นด้วย route
  let qs = `?route=${route}`;
  // ไล่เพิ่ม key/value ใน params ลงไปใน query string
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== "") {
      qs += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }
  }
  const response = await fetch(`${GAS_URL}${qs}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return await response.json();
}

/**
 * เรียก API แบบ POST
 * @param {string} route - ชื่อ route ที่จะเรียก (เช่น "createMember", "earnPoints", ฯลฯ)
 * @param {Object} data - อ็อบเจ็กต์ข้อมูลที่จะส่งใน body ของ POST (JSON)
 * @returns {Promise<Object>} - ผลลัพธ์ JSON ที่ API ส่งกลับ
 */
async function apiPost(route, data = {}) {
  const url = `${GAS_URL}?route=${route}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}
