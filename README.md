# Password Manager

A secure password management application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This application allows users to store, generate, and check passwords for various applications while ensuring security through encryption and data breach checking.

## Features

- User authentication (register/login)
- Secure password storage
- Random password generation
- Password strength checking
- Data breach detection using HaveIBeenPwned API
- Copy to clipboard functionality
- Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd password-manager
```

2. Install backend dependencies:

```bash
npm install
```

3. Install frontend dependencies:

```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/password-manager
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

5. Start MongoDB on your local machine.

## Running the Application

1. Start the backend server:

```bash
npm run dev
```

2. In a new terminal, start the frontend development server:

```bash
cd client
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Security Features

- Passwords are hashed using bcrypt
- JWT-based authentication
- Secure password storage in MongoDB
- Password breach checking using HaveIBeenPwned API
- HTTPS support (in production)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

