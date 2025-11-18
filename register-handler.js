// register-handler.js

// Chờ cho trang HTML được tải xong
document.addEventListener("DOMContentLoaded", () => {

  // Lấy các phần tử từ trang HTML
  const registerForm = document.getElementById("registerForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("password-confirm");
  const errorMessage = document.getElementById("error-message");

  // Gắn hàm xử lý khi người dùng nhấn nút "Đăng ký"
  registerForm.addEventListener("submit", async (event) => {
    
    // Ngăn form tự động gửi đi
    event.preventDefault();

    // Xóa thông báo lỗi cũ
    errorMessage.textContent = "";

    // Lấy giá trị từ các ô input
    const username = usernameInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // --- Bước 1: Kiểm tra mật khẩu có khớp không ---
    if (password !== passwordConfirm) {
      errorMessage.textContent = "Mật khẩu nhập lại không khớp!";
      return; // Dừng lại nếu không khớp
    }

    // --- Bước 2: Gửi dữ liệu đến backend ---
    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Gửi username và password
        // Đảm bảo backend của bạn cũng nhận key là 'username' và 'password'
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng ký THÀNH CÔNG
        alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        // Chuyển người dùng về trang đăng nhập
        window.location.href = "index.html";

      } else {
        // Đăng ký THẤT BẠI (ví dụ: tên người dùng đã tồn tại)
        errorMessage.textContent = data.message || "Đăng ký thất bại. Vui lòng thử lại.";
      }

    } catch (error) {
      // Lỗi (ví dụ: không kết nối được backend)
      console.error("Lỗi đăng ký:", error);
      errorMessage.textContent = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
    }
  });
});