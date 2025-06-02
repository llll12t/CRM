// liff-init.js

/**
 * ฟังก์ชันสำหรับเริ่มต้น LIFF และตรวจสอบสถานะการล็อกอิน
 * ถ้ายังไม่ล็อกอิน ให้เปลี่ยนหน้าไปล็อกอิน
 * ถ้าล็อกอินแล้ว ให้ตรวจสอบว่ามีสมาชิกในระบบหรือไม่ (ผ่าน API)
 * ถ้าไม่มี ให้สร้างสมาชิกใหม่ผ่าน API แล้วเก็บ memberId ไว้ใน localStorage
 * สุดท้าย แสดงชื่อสมาชิกหรือทำงานส่วนอื่น ๆ ต่อได้เลย
 */

async function liffInitAndCheckLogin() {
  try {
    // เริ่มต้น LIFF ด้วย LIFF ID ของคุณ
    await liff.init({ liffId: "2007514355-94vaVQb3" });

    // ถ้ายังไม่ล็อกอิน ให้เปลี่ยนไปหน้าล็อกอินของ LINE
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ถ้าล็อกอินแล้ว ให้ดึงข้อมูลโปรไฟล์ของผู้ใช้งาน
    const profile = await liff.getProfile();
    const lineUserId = profile.userId;

    // เรียก API เพื่อตรวจสอบว่ามีสมาชิกในระบบหรือยัง
    const listRes = await apiGet("listMembers");
    let existingMember = null;
    if (listRes.status === "success") {
      existingMember = listRes.members.find(m => m.LineUserID === lineUserId);
    }

    // ถ้าไม่พบในระบบ ให้สร้างสมาชิกใหม่
    if (!existingMember) {
      const createRes = await apiPost("createMember", {
        lineUserId: lineUserId,
        name: profile.displayName || "",
        email: "",
        phone: "",
        address: ""
      });
      if (createRes.status === "success") {
        existingMember = { MemberID: createRes.memberId };
      } else {
        // ถ้าเกิดข้อผิดพลาดในการสร้างสมาชิก ให้แจ้งเตือน แล้วหยุดทำงาน
        alert("เกิดข้อผิดพลาดในการสมัครสมาชิก: " + createRes.message);
        return;
      }
    }

    // เก็บ memberId ไว้ใน localStorage เพื่อเรียกใช้ในหน้าอื่น ๆ ต่อไป
    localStorage.setItem("memberId", existingMember.MemberID);

    // (ถ้าต้องการแสดงชื่อสมาชิกบนหน้า HTML ให้ทำที่นี่)
    const nameElem = document.getElementById("memberName");
    if (nameElem) {
      // ถ้ารหัสสมาชิกตรงกับสมาชิกเดิม ให้แสดงชื่อ ถ้ามี
      nameElem.innerText = profile.displayName || existingMember.MemberID;
    }
  } catch (err) {
    console.error("LIFF init error:", err);
  }
}

// ฟังก์ชันเรียกใช้เมื่อโหลดหน้าเสร็จสิ้น
document.addEventListener("DOMContentLoaded", () => {
  liffInitAndCheckLogin();

  // ปุ่มออกจากระบบ: ถ้ามี ให้เรียก LIFF logout แล้วรีเฟรชหน้า
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      liff.logout();
      localStorage.removeItem("memberId");
      // รีเฟรชหน้าเพื่อให้กลับไปสถานะล็อกอินใหม่
      window.location.reload();
    });
  }
});
