# 💬 Chat App Frontend

A modern **real-time chat frontend** built with **Next.js**, **React**, **Redux Toolkit**, **React Query**, and **Socket.IO**.  
It provides a responsive, interactive UI for one-to-one and group chats, including messaging, file attachments, and video calls.

---

## ⚙️ Tech Stack

- **Next.js** – React framework for production  
- **React.js** – Frontend library  
- **Redux Toolkit** – State management  
- **React Query** – Server state management and caching  
- **Socket.IO Client** – Real-time event handling  
- **Context API** – Socket and user context management  
- **Tailwind CSS** – (if used) for UI styling  

---

## 🚀 Features

- 🔐 **Authentication**
  - User login and registration using backend JWT APIs
- 💬 **Chat**
  - One-to-one and group chat support  
  - Send and receive messages in real time  
  - Send images, files, and attachments  
  - Online/offline user indicator
- 📹 **Video Calls**
  - One-to-one video call support (WebRTC + Socket.IO)
- 👥 **Group Management**
  - Create new groups, add/remove members
- ⚡ **Realtime Updates**
  - Powered by **Socket.IO** and React Context for instant sync
========================================
💬 CHAT APP FRONTEND - SETUP & INSTALLATION GUIDE
========================================

A frontend built with Next.js, React, Redux Toolkit, React Query, and Socket.IO.

----------------------------------------
🔧 PREREQUISITES
----------------------------------------
1. Node.js (v18+ recommended)
2. npm or yarn package manager
3. Chat App Backend running at http://localhost:8000

----------------------------------------
📂 PROJECT SETUP
----------------------------------------

1. Clone the repository
   git clone https://github.com/FaizanFazal12/chatapp-frontend
   cd chat-app-frontend

2. Install dependencies
   npm install

3. Create a .env.local file in the project root with the following variable:
   ----------------------------------------
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ----------------------------------------

4. Start the development server
   npm run dev

----------------------------------------
🚀 APPLICATION RUNNING
----------------------------------------
The frontend will start at:
http://localhost:3000

Make sure the backend server is running on:
http://localhost:8000

----------------------------------------
🧠 TECHNOLOGIES USED
----------------------------------------
- Next.js
- React.js
- Redux Toolkit
- React Query
- Socket.IO Client
- Context API
- (Optional) Tailwind CSS for styling

----------------------------------------
✅ YOU'RE READY TO GO!
----------------------------------------
Your Chat App frontend is now running locally.
Login, start chatting, and enjoy real-time updates!

## 🧩 Project Structure

