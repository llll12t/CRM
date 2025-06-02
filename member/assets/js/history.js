// history.js

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

  // ฟังก์ชันอัปเดตยอดพ้อยท์ใน header
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

  // โหลดประวัติกิจกรรมทั้งหมด
  async function loadHistoryLogs() {
    try {
      const logRes = await apiGet("getLogsByMember", { memberId });
      if (logRes.status === "success") {
        let logs = logRes.logs;

        // เรียงจากใหม่สุด → เก่า
        logs.sort((a, b) => {
          const parseDT = (str) => {
            const [datePart, timePart] = String(str).split(" ");
            if (!datePart || !timePart) return new Date(0);
            const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
            const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
            return new Date(y, m - 1, d, hh, mm);
          };
          return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
        });

        const ul = document.getElementById("historyLogList");
        const noMsg = document.getElementById("noHistoryMessage");
        if (!ul || !noMsg) return;
        ul.innerHTML = "";

        if (logs.length === 0) {
          noMsg.classList.remove("hidden");
          return;
        }
        noMsg.classList.add("hidden");

        logs.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100";

          // ซ้าย: รายละเอียด (ActivityType + คำอธิบาย)
          const leftBox = document.createElement("div");
          leftBox.className = "flex flex-col";

          const typeSpan = document.createElement("span");
          typeSpan.className = "font-medium text-gray-800";
          typeSpan.innerText = log.ActivityType;

          const descSpan = document.createElement("span");
          descSpan.className = "text-sm text-gray-600";
          descSpan.innerText = log.Description || "-";

          leftBox.appendChild(typeSpan);
          leftBox.appendChild(descSpan);

          // กลาง: จำนวนพ้อยท์ (แสดง + หรือ − พร้อมสี)
          const changeSpan = document.createElement("span");
          const change = parseInt(log.PointsChange, 10) || 0;
          changeSpan.innerText = (change > 0 ? "+" : "") + change.toLocaleString() + " พ้อยท์";
          if (change > 0) {
            changeSpan.className = "font-medium text-green-600";
          } else if (change < 0) {
            changeSpan.className = "font-medium text-red-600";
          } else {
            changeSpan.className = "font-medium text-gray-600";
          }

          // ขวา: วันที่และเวลา
          const dateSpan = document.createElement("span");
          dateSpan.className = "text-sm text-gray-500";
          dateSpan.innerText = log.LogTimestamp;

          li.appendChild(leftBox);
          li.appendChild(changeSpan);
          li.appendChild(dateSpan);
          ul.appendChild(li);
        });
      } else {
        console.error("getLogsByMember error:", logRes.message);
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดประวัติได้",
          text: logRes.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("Error fetching history logs:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // เรียกอัปเดตยอดพ้อยท์และโหลดประวัติ
  await updatePointDisplay();
  await loadHistoryLogs();

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
