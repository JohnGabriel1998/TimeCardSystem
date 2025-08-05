const axios = require('axios');

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.post('http://localhost:5000/api/auth/register', userData);
    console.log('✅ Test user created successfully!');
    console.log('Username: testuser');
    console.log('Password: password123');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.error === 'User already exists') {
      console.log('✅ Test user already exists!');
      console.log('Username: testuser');
      console.log('Password: password123');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server first:');
      console.log('cd server && npm run dev');
    } else {
      console.error('❌ Error creating user:', error.response?.data || error.message);
    }
  }
}

createTestUser();
