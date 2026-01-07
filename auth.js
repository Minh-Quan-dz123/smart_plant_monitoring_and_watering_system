// auth.js

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");

  loginForm.addEventListener("submit", async (event) => {
    
    event.preventDefault(); 
    errorMessage.textContent = "";

    const email = usernameInput.value; 
    const password = passwordInput.value;

    try {
      const response = await fetch("http://localhost:3000/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Gửi dữ liệu đi với key là "email"
        body: JSON.stringify({ 
          email: email,     
          password: password 
        }), 
      });

      // Kiểm tra phản hồi từ Server
      if (response.ok) {
        const data = await response.json();
        
        // Lưu token (nếu backend trả về access_token)
        if (data.access_token || data.token) {
           localStorage.setItem("userToken", data.access_token || data.token);
        }
        
        alert("Đăng nhập thành công!");
        window.location.href = "main.html"; // Chuyển hướng
        return;
      }

      // Nếu thất bại
      const errorData = await response.json();
      errorMessage.textContent = errorData.message || "Email hoặc mật khẩu không đúng.";

    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      errorMessage.textContent = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
    }
  });

});
