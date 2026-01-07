<<<<<<< HEAD
// register-handler.js

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("password-confirm");
  const errorMessage = document.getElementById("error-message");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";

    const email = emailInput.value;
    const username = usernameInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (password !== passwordConfirm) {
      errorMessage.textContent = "Mật khẩu nhập lại không khớp!";
      return;
    }

    try {
      // 1. Gửi yêu cầu
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: username,
          password: password,
        }),
      });

      // --- PHẦN SỬA LỖI Ở ĐÂY ---
      
      // 2. Kiểm tra xem Server có chấp nhận không (Status code 200-299)
      if (response.ok) {
        // Nếu thành công, hiển thị thông báo ngay mà KHÔNG CẦN đọc response.json()
        // vì Backend có thể trả về rỗng.
        alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        window.location.href = "index.html";
        return; 
      }

      // 3. Nếu thất bại (ví dụ lỗi trùng Email), lúc này mới cố đọc JSON lỗi
      try {
        const data = await response.json();
        errorMessage.textContent = data.message || "Đăng ký thất bại.";
      } catch (jsonError) {
        // Nếu Server báo lỗi nhưng cũng không trả về JSON
        errorMessage.textContent = "Đăng ký thất bại (Lỗi Server).";
      }

    } catch (error) {
      console.error("Lỗi mạng:", error);
      errorMessage.textContent = "Không thể kết nối đến máy chủ.";
    }
  });
=======
// register-handler.js

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("password-confirm");
  const errorMessage = document.getElementById("error-message");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessage.textContent = "";

    const email = emailInput.value;
    const username = usernameInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (password !== passwordConfirm) {
      errorMessage.textContent = "Mật khẩu nhập lại không khớp!";
      return;
    }

    try {
      // 1. Gửi yêu cầu
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: username,
          password: password,
        }),
      });

      // --- PHẦN SỬA LỖI Ở ĐÂY ---
      
      // 2. Kiểm tra xem Server có chấp nhận không (Status code 200-299)
      if (response.ok) {
        // Nếu thành công, hiển thị thông báo ngay mà KHÔNG CẦN đọc response.json()
        // vì Backend có thể trả về rỗng.
        alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        window.location.href = "index.html";
        return; 
      }

      // 3. Nếu thất bại (ví dụ lỗi trùng Email), lúc này mới cố đọc JSON lỗi
      try {
        const data = await response.json();
        errorMessage.textContent = data.message || "Đăng ký thất bại.";
      } catch (jsonError) {
        // Nếu Server báo lỗi nhưng cũng không trả về JSON
        errorMessage.textContent = "Đăng ký thất bại (Lỗi Server).";
      }

    } catch (error) {
      console.error("Lỗi mạng:", error);
      errorMessage.textContent = "Không thể kết nối đến máy chủ.";
    }
  });
>>>>>>> fc4be9b (done)
});