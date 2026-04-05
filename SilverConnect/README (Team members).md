# 🚀 Getting Started with SilverConnect Web Application

These instructions will help you set up and run the **frontend** and **backend** of the SilverConnect web application locally.

---

## 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SilverConnect
```

---

## 2. Install Node.js  
Download and install Node.js (includes `npm`):  
👉 [Download Node.js](https://nodejs.org/en/download)

---

## 3. Run the Frontend
1. Open a **first terminal** (cmd or shell).  
2. Navigate to the frontend folder:
   cd SilverConnect/frontend
3. Install dependencies and start the dev server: npm install && npm run dev
4. Open your browser and go to:  
   👉 [http://localhost:5173](http://localhost:5173)


## 4. Set Up the Backend

### Install PostgreSQL
1. Download and install PostgreSQL:  
   👉 [Install PostgreSQL Guide](https://www.w3schools.com/postgresql/postgresql_install.php)  
2. After installation, open **SQL Shell (psql)**.  Type sql in search bar.
3. Press **Enter** through all prompts until asked for a password. Type:
   postgres
4. Create the database:
   CREATE DATABASE silverconnect;

### Start the Backend
1. Open a **second terminal**.  
2. Navigate to the backend folder:
   cd SilverConnect/backend
3. Install dependencies and start the backend server: npm install && npm run dev