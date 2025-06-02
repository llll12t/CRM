// admin/assets/js/products.js

document.addEventListener("DOMContentLoaded", () => {
  const productsTableBody = document.getElementById("productsTableBody");
  const addProductButton = document.getElementById("addProductButton");
  const productModal = document.getElementById("productModal");
  const modalTitle = document.getElementById("modalTitle");
  const productForm = document.getElementById("productForm");
  const inputProductName = document.getElementById("inputProductName");
  const inputPointsCost = document.getElementById("inputPointsCost");
  const inputStock = document.getElementById("inputStock");
  const inputImageURL = document.getElementById("inputImageURL");
  const inputCategory = document.getElementById("inputCategory");
  const inputIsActive = document.getElementById("inputIsActive");
  const saveProductButton = document.getElementById("saveProductButton");
  const cancelProductButton = document.getElementById("cancelProductButton");
  const logoutButton = document.getElementById("logoutButton");

  let editMode = false;
  let editProductId = null;

  // Load and display all products
  async function loadProducts() {
    try {
      const res = await apiGet("listProducts");
      if (res.status === "success") {
        const products = res.products;
        productsTableBody.innerHTML = "";
        products.forEach(prod => {
          const tr = document.createElement("tr");

          // ProductID
          const tdId = document.createElement("td");
          tdId.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdId.innerText = prod.ProductID;
          tr.appendChild(tdId);

          // Name
          const tdName = document.createElement("td");
          tdName.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdName.innerText = prod.ProductName || "-";
          tr.appendChild(tdName);

          // PointsCost
          const tdCost = document.createElement("td");
          tdCost.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdCost.innerText = (parseInt(prod.PointsCost, 10) || 0).toLocaleString();
          tr.appendChild(tdCost);

          // Stock
          const tdStock = document.createElement("td");
          tdStock.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdStock.innerText = parseInt(prod.Stock, 10) || 0;
          tr.appendChild(tdStock);

          // Category
          const tdCategory = document.createElement("td");
          tdCategory.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdCategory.innerText = prod.Category || "-";
          tr.appendChild(tdCategory);

          // Status
          const tdStatus = document.createElement("td");
          tdStatus.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdStatus.innerText = prod.IsActive || "-";
          tr.appendChild(tdStatus);

          // Actions
          const tdActions = document.createElement("td");
          tdActions.className = "px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2";

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.className = "text-blue-600 hover:text-blue-800";
          editBtn.innerText = "แก้ไข";
          editBtn.addEventListener("click", () => openEditModal(prod));
          tdActions.appendChild(editBtn);

          // Toggle Status button
          const toggleBtn = document.createElement("button");
          toggleBtn.className = prod.IsActive === "Active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800";
          toggleBtn.innerText = prod.IsActive === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน";
          toggleBtn.addEventListener("click", () => confirmToggleStatus(prod));
          tdActions.appendChild(toggleBtn);

          tr.appendChild(tdActions);
          productsTableBody.appendChild(tr);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดสินค้าได้",
          text: res.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("Error loading products:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Open modal for adding a new product
  function openAddModal() {
    editMode = false;
    editProductId = null;
    modalTitle.innerText = "เพิ่มสินค้าใหม่";
    inputProductName.value = "";
    inputPointsCost.value = "";
    inputStock.value = "";
    inputImageURL.value = "";
    inputCategory.value = "";
    inputIsActive.value = "Active";
    productModal.classList.remove("hidden");
  }

  // Open modal for editing an existing product
  function openEditModal(prod) {
    editMode = true;
    editProductId = prod.ProductID;
    modalTitle.innerText = "แก้ไขข้อมูลสินค้า";
    inputProductName.value = prod.ProductName || "";
    inputPointsCost.value = prod.PointsCost || "";
    inputStock.value = prod.Stock || "";
    inputImageURL.value = prod.ImageURL || "";
    inputCategory.value = prod.Category || "";
    inputIsActive.value = prod.IsActive || "Active";
    productModal.classList.remove("hidden");
  }

  // Close the modal
  function closeModal() {
    productModal.classList.add("hidden");
  }

  // Save product (create or update)
  async function saveProduct() {
    const name = inputProductName.value.trim();
    const cost = parseInt(inputPointsCost.value, 10);
    const stock = parseInt(inputStock.value, 10);
    const imageUrl = inputImageURL.value.trim();
    const category = inputCategory.value.trim();
    const isActive = inputIsActive.value;

    if (!name || isNaN(cost) || isNaN(stock)) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    if (editMode) {
      // Update existing product
      try {
        const res = await apiPost("updateProduct", {
          productId: editProductId,
          productName: name,
          pointsCost: cost,
          stock: stock,
          imageUrl: imageUrl,
          category: category,
          isActive: isActive
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "อัปเดตข้อมูลสินค้าสำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadProducts();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถอัปเดตข้อมูลสินค้าได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("updateProduct error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } else {
      // Create new product
      try {
        const res = await apiPost("createProduct", {
          productName: name,
          pointsCost: cost,
          stock: stock,
          imageUrl: imageUrl,
          category: category,
          isActive: isActive
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "เพิ่มสินค้าสำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadProducts();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถสร้างสินค้าใหม่ได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("createProduct error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    }
  }

  // Confirm and toggle product status (Active ↔ Inactive)
  async function confirmToggleStatus(prod) {
    const newStatus = prod.IsActive === "Active" ? "Inactive" : "Active";
    const { isConfirmed } = await Swal.fire({
      title: `เปลี่ยนสถานะสินค้า ${prod.ProductID}?`,
      text: `ต้องการเปลี่ยนสถานะเป็น "${newStatus}" ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    try {
      const res = await apiPost("updateProduct", {
        productId: prod.ProductID,
        isActive: newStatus
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "เปลี่ยนสถานะสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        await loadProducts();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถเปลี่ยนสถานะสินค้าได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("toggle status error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Event listeners
  addProductButton.addEventListener("click", openAddModal);
  cancelProductButton.addEventListener("click", closeModal);
  saveProductButton.addEventListener("click", saveProduct);

  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // Initial load
  loadProducts();
});
