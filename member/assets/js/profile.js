// profile.js

document.addEventListener("DOMContentLoaded", async () => {
  // รอให้ LIFF ตรวจสอบและเตรียม memberId สำเร็จ
  await new Promise((resolve) => {
    const checkMember = () => {
      if (localStorage.getItem("memberId")) {
        resolve();
      } else {
        setTimeout(checkMember, 100);
      }
    };
    checkMember();
  });

  const memberId = localStorage.getItem("memberId");
  if (!memberId) return;

  // อัปเดตยอดพ้อยท์ใน header
  async function updatePointDisplay() {
    try {
      const memRes = await apiGet("getMember", { memberId });
      if (memRes.status === "success") {
        const pts = parseInt(memRes.member.PointsBalance, 10) || 0;
        const displayPtsElem = document.getElementById("pointsDisplay");
        if (displayPtsElem) {
          displayPtsElem.innerText = pts.toLocaleString();
        }
      }
    } catch (err) {
      console.error("Error fetching member points:", err);
    }
  }

  // ดึงข้อมูลโปรไฟล์มาแสดงในโหมดดู
  async function loadProfile() {
    try {
      const res = await apiGet("getMember", { memberId });
      if (res.status === "success") {
        const member = res.member;
        document.getElementById("displayName").innerText = member.Name || "-";
        document.getElementById("displayEmail").innerText = member.Email || "-";
        document.getElementById("displayPhone").innerText = member.Phone || "-";
        document.getElementById("displayAddress").innerText = member.Address || "-";
      } else {
        console.error("getMember error:", res.message);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  // แสดงโหมดแก้ไขและเติมค่าเดิมลงใน input
  async function enterEditMode() {
    try {
      const res = await apiGet("getMember", { memberId });
      if (res.status === "success") {
        const member = res.member;
        document.getElementById("inputName").value = member.Name || "";
        document.getElementById("inputEmail").value = member.Email || "";
        document.getElementById("inputPhone").value = member.Phone || "";
        document.getElementById("inputAddress").value = member.Address || "";
        document.getElementById("viewProfile").classList.add("hidden");
        document.getElementById("editProfile").classList.remove("hidden");
      } else {
        console.error("getMember error:", res.message);
      }
    } catch (err) {
      console.error("Error entering edit mode:", err);
    }
  }

  // ยกเลิกการแก้ไข กลับไปแสดงโหมดดู
  function cancelEdit() {
    document.getElementById("editProfile").classList.add("hidden");
    document.getElementById("viewProfile").classList.remove("hidden");
  }

  // บันทึกข้อมูลหลังแก้ไข
  async function saveProfile() {
    const nameValue = document.getElementById("inputName").value.trim();
    const emailValue = document.getElementById("inputEmail").value.trim();
    const phoneValue = document.getElementById("inputPhone").value.trim();
    const addressValue = document.getElementById("inputAddress").value.trim();

    // ไม่มีฟิลด์บังคับ นอกจากใส่ชื่อ ถ้าต้องการตรวจสอบเพิ่มเติมให้เพิ่มเงื่อนไข
    if (!nameValue) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อ",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    try {
      const res = await apiPost("updateMember", {
        memberId: memberId,
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
        address: addressValue
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "บันทึกข้อมูลสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        cancelEdit();
        await loadProfile();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถบันทึกข้อมูลได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("updateMember error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // เรียกอัปเดตยอดพ้อยท์และโหลดข้อมูลโปรไฟล์เริ่มต้น
  await updatePointDisplay();
  await loadProfile();

  // ตั้ง Event ให้ปุ่มแก้ไข
  const editBtn = document.getElementById("editProfileButton");
  if (editBtn) {
    editBtn.addEventListener("click", enterEditMode);
  }

  // ตั้ง Event ให้ปุ่มบันทึก
  const saveBtn = document.getElementById("saveProfileButton");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveProfile);
  }

  // ตั้ง Event ให้ปุ่มยกเลิก
  const cancelBtn = document.getElementById("cancelEditButton");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelEdit);
  }

  // ปุ่มออกจากระบบ
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      liff.logout();
      localStorage.removeItem("memberId");
      window.location.href = "../index.html";
    });
  }
});
