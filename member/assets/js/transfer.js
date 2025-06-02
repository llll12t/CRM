// transfer.js

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

  // โหลดประวัติการโอนพ้อยท์ (ทั้ง TransferTo และ TransferFrom)
  async function loadTransferLogs() {
    try {
      const logRes = await apiGet("getLogsByMember", { memberId });
      if (logRes.status === "success") {
        // กรองเฉพาะ ActivityType='TransferTo' หรือ 'TransferFrom'
        let transferLogs = logRes.logs.filter(log => 
          log.ActivityType === "TransferTo" || log.ActivityType === "TransferFrom"
        );

        // เรียงจากใหม่สุด → เก่า
        transferLogs.sort((a, b) => {
          const parseDT = (str) => {
            const [datePart, timePart] = String(str).split(" ");
            if (!datePart || !timePart) return new Date(0);
            const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
            const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
            return new Date(y, m - 1, d, hh, mm);
          };
          return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
        });

        const ul = document.getElementById("transferLogList");
        if (!ul) return;
        ul.innerHTML = "";

        if (transferLogs.length === 0) {
          const liEmpty = document.createElement("li");
          liEmpty.className = "text-center text-gray-500";
          liEmpty.innerText = "ยังไม่มีการโอนพ้อยท์";
          ul.appendChild(liEmpty);
          return;
        }

        transferLogs.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between bg-gray-50 p-2 rounded";

          // แสดงรายละเอียด: ถ้าเป็น TransferTo แปลว่าโอนออก ถ้า TransferFrom แปลว่าได้พ้อยท์เข้า
          const infoSpan = document.createElement("span");
          const pts = Math.abs(parseInt(log.PointsChange, 10)) || 0;
          if (log.ActivityType === "TransferTo") {
            infoSpan.innerText = `โอน ${pts.toLocaleString()} พ้อยท์ ให้ ${log.RelatedTargetID}`;
            infoSpan.className = "text-sm text-red-600";
          } else {
            infoSpan.innerText = `ได้รับ ${pts.toLocaleString()} พ้อยท์ จาก ${log.RelatedTargetID}`;
            infoSpan.className = "text-sm text-green-600";
          }

          // แสดงวันที่และเวลา
          const dateSpan = document.createElement("span");
          dateSpan.className = "text-sm text-gray-600";
          dateSpan.innerText = log.LogTimestamp;

          li.appendChild(infoSpan);
          li.appendChild(dateSpan);
          ul.appendChild(li);
        });
      } else {
        console.error("getLogsByMember error:", logRes.message);
      }
    } catch (err) {
      console.error("Error fetching transfer logs:", err);
    }
  }

  // ฟังก์ชันสำหรับโอนพ้อยท์
  async function confirmTransfer() {
    const toInput = document.getElementById("toMemberInput");
    const ptsInput = document.getElementById("pointsInput");
    if (!toInput || !ptsInput) return;

    const toMemberId = toInput.value.trim();
    const ptsValue = parseInt(ptsInput.value, 10);

    if (!toMemberId) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสสมาชิกผู้รับ",
        confirmButtonText: "ตกลง"
      });
      return;
    }
    if (!ptsValue || ptsValue <= 0) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกจำนวนพ้อยท์ที่ถูกต้อง",
        confirmButtonText: "ตกลง"
      });
      return;
    }
    if (toMemberId === memberId) {
      Swal.fire({
        icon: "warning",
        title: "ไม่สามารถโอนไปยังตัวเองได้",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // ดึงยอดพ้อยท์ปัจจุบัน
    let currentPts = 0;
    try {
      const memRes = await apiGet("getMember", { memberId });
      if (memRes.status === "success") {
        currentPts = parseInt(memRes.member.PointsBalance, 10) || 0;
      }
    } catch {
      currentPts = 0;
    }

    if (currentPts < ptsValue) {
      Swal.fire({
        icon: "warning",
        title: "พ้อยท์ไม่เพียงพอ",
        text: `คุณมีพ้อยท์ ${currentPts.toLocaleString()} พ้อยท์ แต่ต้องการโอน ${ptsValue.toLocaleString()} พ้อยท์`,
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // ยืนยันการโอน
    const { isConfirmed } = await Swal.fire({
      title: `โอน ${ptsValue.toLocaleString()} พ้อยท์`,
      html: `
        <p>โอนไปยังสมาชิก: ${toMemberId}</p>
        <p>ใช้พ้อยท์: ${ptsValue.toLocaleString()} พ้อยท์</p>
        <p>คุณมีพ้อยท์คงเหลือ: ${currentPts.toLocaleString()} พ้อยท์</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันการโอน",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    // เรียก API เพื่อโอนพ้อยท์
    try {
      const res = await apiPost("transferPoints", {
        fromMemberId: memberId,
        toMemberId: toMemberId,
        pointsToTransfer: ptsValue
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "โอนพ้อยท์สำเร็จ",
          text: res.message,
          confirmButtonText: "ตกลง"
        });
        toInput.value = "";
        ptsInput.value = "";
        // อัปเดตยอดพ้อยท์และโหลดประวัติใหม่
        await updatePointDisplay();
        await loadTransferLogs();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถโอนพ้อยท์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("transferPoints error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // เรียกอัปเดตยอดพ้อยท์และโหลดประวัติการโอนพ้อยท์
  await updatePointDisplay();
  await loadTransferLogs();

  // ตั้ง Event ให้ปุ่มยืนยันโอนพ้อยท์
  const transferBtn = document.getElementById("transferButton");
  if (transferBtn) {
    transferBtn.addEventListener("click", confirmTransfer);
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
