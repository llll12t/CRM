// admin/assets/js/transfers.js

document.addEventListener("DOMContentLoaded", () => {
  const transfersTableBody = document.getElementById("transfersTableBody");
  const noTransfersMessage = document.getElementById("noTransfersMessage");
  const logoutButton = document.getElementById("logoutButton");

  // เรียกโหลดรายการโอนพ้อยท์ที่รอดำเนินการ
  async function loadTransfers() {
    try {
      const res = await apiGet("getPendingTransfers");
      if (res.status === "success") {
        const transfers = res.transfers || [];
        transfersTableBody.innerHTML = "";

        if (transfers.length === 0) {
          noTransfersMessage.classList.remove("hidden");
          return;
        }
        noTransfersMessage.classList.add("hidden");

        transfers.forEach(tx => {
          const tr = document.createElement("tr");

          // LogID
          const tdLogId = document.createElement("td");
          tdLogId.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdLogId.innerText = tx.LogID;
          tr.appendChild(tdLogId);

          // From MemberID
          const tdFrom = document.createElement("td");
          tdFrom.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdFrom.innerText = tx.MemberID;
          tr.appendChild(tdFrom);

          // To MemberID (RelatedTargetID)
          const tdTo = document.createElement("td");
          tdTo.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdTo.innerText = tx.RelatedTargetID;
          tr.appendChild(tdTo);

          // Points (ค่าบวก/ลบใน PointsChange แต่โอนเป็นลบสำหรับผู้โอน)
          const tdPoints = document.createElement("td");
          tdPoints.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          const pts = Math.abs(parseInt(tx.PointsChange, 10)) || 0;
          tdPoints.innerText = pts.toLocaleString();
          tr.appendChild(tdPoints);

          // LogTimestamp
          const tdTimestamp = document.createElement("td");
          tdTimestamp.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdTimestamp.innerText = tx.LogTimestamp;
          tr.appendChild(tdTimestamp);

          // Status (ควรเป็น "Pending")
          const tdStatus = document.createElement("td");
          tdStatus.className = "px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600";
          tdStatus.innerText = tx.Status;
          tr.appendChild(tdStatus);

          // Actions: อนุมัติ / ปฏิเสธ
          const tdActions = document.createElement("td");
          tdActions.className = "px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2";

          // Approve button
          const approveBtn = document.createElement("button");
          approveBtn.className = "text-green-600 hover:text-green-800";
          approveBtn.innerText = "อนุมัติ";
          approveBtn.addEventListener("click", () => confirmApprove(tx.LogID));
          tdActions.appendChild(approveBtn);

          // Reject button
          const rejectBtn = document.createElement("button");
          rejectBtn.className = "text-red-600 hover:text-red-800";
          rejectBtn.innerText = "ปฏิเสธ";
          rejectBtn.addEventListener("click", () => confirmReject(tx.LogID));
          tdActions.appendChild(rejectBtn);

          tr.appendChild(tdActions);
          transfersTableBody.appendChild(tr);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดรายการโอนพ้อยท์ได้",
          text: res.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("Error loading transfers:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // ยืนยันและอนุมัติรายการโอน
  async function confirmApprove(logId) {
    const { isConfirmed } = await Swal.fire({
      title: `อนุมัติการโอน ${logId}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันอนุมัติ",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    try {
      const res = await apiPost("approveTransfer", { logId: logId });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "อนุมัติสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        await loadTransfers();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถอนุมัติรายการนี้ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("approveTransfer error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // ยืนยันและปฏิเสธรายการโอน
  async function confirmReject(logId) {
    const { isConfirmed } = await Swal.fire({
      title: `ปฏิเสธการโอน ${logId}?`,
      text: "พ้อยท์จะถูกคืนให้ผู้โอน",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันปฏิเสธ",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    try {
      const res = await apiPost("rejectTransfer", { logId: logId });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "ปฏิเสธรายการสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        await loadTransfers();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถปฏิเสธรายการนี้ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("rejectTransfer error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // ปุ่มออกจากระบบ
  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // เรียกโหลดครั้งแรก
  loadTransfers();
});
