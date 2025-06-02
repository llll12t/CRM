// admin/assets/js/promotions.js

document.addEventListener("DOMContentLoaded", () => {
  const inputEarnRate = document.getElementById("inputEarnRate");
  const inputUseRate = document.getElementById("inputUseRate");
  const savePromotionsButton = document.getElementById("savePromotionsButton");
  const logoutButton = document.getElementById("logoutButton");

  // โหลดค่าปัจจุบันจาก Settings
  async function loadPromotions() {
    try {
      // ดึง EARN_RATE
      const earnRes = await apiGet("getSetting", { key: "EARN_RATE" });
      if (earnRes !== null && earnRes.value !== undefined) {
        inputEarnRate.value = earnRes.value;
      }
    } catch (err) {
      console.error("Error fetching EARN_RATE:", err);
    }

    try {
      // ดึง USE_RATE
      const useRes = await apiGet("getSetting", { key: "USE_RATE" });
      if (useRes !== null && useRes.value !== undefined) {
        inputUseRate.value = useRes.value;
      }
    } catch (err) {
      console.error("Error fetching USE_RATE:", err);
    }
  }

  // บันทึกค่าพร้อมอัปเดต Settings
  async function savePromotions() {
    const earnRate = inputEarnRate.value.trim();
    const useRate = inputUseRate.value.trim();

    if (!earnRate || !useRate) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกทั้งค่า EARN_RATE และ USE_RATE",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // ยืนยันก่อนบันทึก
    const { isConfirmed } = await Swal.fire({
      title: "ยืนยันการบันทึกการตั้งค่า",
      html: `
        <p>EARN_RATE: ${earnRate}</p>
        <p>USE_RATE: ${useRate}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    // อัปเดต EARN_RATE
    try {
      const resEarn = await apiPost("updateSetting", { key: "EARN_RATE", value: earnRate });
      if (resEarn.status !== "success") {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถบันทึก EARN_RATE ได้",
          text: resEarn.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
        return;
      }
    } catch (err) {
      console.error("updateSetting EARN_RATE error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // อัปเดต USE_RATE
    try {
      const resUse = await apiPost("updateSetting", { key: "USE_RATE", value: useRate });
      if (resUse.status !== "success") {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถบันทึก USE_RATE ได้",
          text: resUse.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
        return;
      }
    } catch (err) {
      console.error("updateSetting USE_RATE error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "บันทึกการตั้งค่าเรียบร้อยแล้ว",
      confirmButtonText: "ตกลง"
    });
  }

  // อีเวนต์ลิสเทนเดอร์
  savePromotionsButton.addEventListener("click", savePromotions);
  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // เรียกโหลดค่าตอนเริ่มต้น
  loadPromotions();
});
