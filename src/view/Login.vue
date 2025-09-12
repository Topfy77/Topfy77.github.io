<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import apolloClient from "../apollo.js";
import { gql } from "@apollo/client/core";

const router = useRouter();
const email = ref("");
const password = ref("");
const showSuccess = ref(false);
const showError = ref(false);

const GET_EMPLOYEE = gql`
  query GetEmployee($email: String!, $password: String!) {
    Bus_employee(where: {epy_email: {_eq: $email}, epy_password: {_eq: $password}}) {
       epy_email
       epy_name
    epy_password
    epy_id
    }
  }
`;

async function goHome() {
  if (!email.value || !password.value) {
    alert("ກະລຸນາປ້ອນ Email ແລະ Password");
    return;
  }

  try {
    const result = await apolloClient.query({
      query: GET_EMPLOYEE,
      variables: {
        email: email.value,
        password: password.value,
      },
    });

    const employee = result.data.Bus_employee[0]; 
    if (employee) {
     
      showSuccess.value = true;

    
      localStorage.setItem("epy_id", employee.epy_id);

      setTimeout(() => {
        showSuccess.value = false;
        router.push("/dashboard");
      }, 1500);
    } else {
      
      showError.value = true;
      setTimeout(() => {
        showError.value = false;
      }, 2000);
    }
  } catch (err) {
    console.error(err);
    alert("ມີຂໍ້ຜິດພາດເກີດຂຶ້ນ");
  }
}

</script>
<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>
      <input type="text" placeholder="Email" v-model="email" />
      <input type="password" placeholder="Password" v-model="password" />
      <button @click="goHome">Login</button>
    </div>

    <div v-if="showSuccess" class="success-popup">
      <p>ເຂົ້າສູ່ລະບົບສຳເລັດ!</p>
    </div>

    <div v-if="showError" class="error-popup">
      <p>ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!</p>
    </div>
  </div>
</template>

<style scoped>


.error-popup {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  background: #e74c3c;
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
  font-size: 1.2em;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  animation: popupFade 0.5s forwards;
  z-index: 999;
}
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #b1dcf0, #ecf9fe);
  font-family: 'Noto Sans Lao', 'Roboto', sans-serif;
}

.login-card {
  background-color: #fff;
  padding: 50px 40px;
  border-radius: 25px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 360px;
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
}

.login-card h1 {
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 2rem;
}

.login-card input {
  width: 100%;
  padding: 14px 18px;
  margin: 12px 0;
  border-radius: 12px;
  border: 1px solid #ccc;
  font-size: 1rem;
  box-sizing: border-box;
  transition: 0.3s;
}

.login-card input:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 10px rgba(106, 17, 203, 0.5);
  outline: none;
}

.login-card input::placeholder {
  color: #aaa;
}

.login-card button {
  width: 100%;
  padding: 14px 0;
  margin-top: 20px;
  background: linear-gradient(135deg, #7196ed, #4372e0);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: 0.3s;
}

.login-card button:hover {
  background: linear-gradient(135deg, #2575fc, #6a11cb);
  transform: scale(1.05);
}

/* Success & Error Popup */
.success-popup, .error-popup {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  padding: 20px 30px;
  border-radius: 15px;
  font-size: 1.3rem;
  font-weight: 500;
  box-shadow: 0 5px 25px rgba(0,0,0,0.3);
  z-index: 999;
  animation: popupFade 0.5s forwards;
  color: #fff;
}

.success-popup {
  background: linear-gradient(135deg, #4caf50, #2ecc71);
}

.error-popup {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

@keyframes popupFade {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

</style>
