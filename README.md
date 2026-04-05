# 2006-SCE3-67

# SilverConnect
*A community-driven platform that helps elderly reconnect with their community.*

<p align='center'>
  <img src="/SilverConnect/frontend/public/logo.svg" width=150 />
</p>            
<p align="center">
    <a href="https://github.com/softwarelab3/2006-SCE3-67/tree/main/SilverConnect/frontend">Frontend</a>
    <a href="https://github.com/softwarelab3/2006-SCE3-67/tree/main/SilverConnect/backend">Backend</a>
    <a href="https://www.youtube.com/watch?v=SxK-QA6tR-0">Demo Video</a>
</p>

---

## Overview

**SilverConnect** is designed to reduce **social isolation** and support **active ageing** in elderly communities.  
Many seniors struggle to stay socially engaged because information about community activities is scattered across different channels.

SilverConnect **brings everything into one place**, enabling elderly to:
- Discover **nearby activities**
- Create **personalised day trip plans**
- Connect with **caregivers** and **volunteers** for companionship

Caregivers help elderly manage schedules, while volunteers join activities to provide social support.

---

## Demo Video

🔗 https://www.youtube.com/watch?v=SxK-QA6tR-0

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| **Activity Discovery** | Browse & register for community activities using simplified UI. |
| **Personalised Day Trip Planner** | Type preferences like “eat then relax” to generate route recommendations. |
| **NLP Intent Detection** | Detects keywords like *eat, relax, walk* to map to activity types. |
| **Companion Matching** | Volunteers can request to accompany elderly for outings. |
| **Caregiver Support** | Caregivers can view and manage registered activities. |
| **Location Mapping** | Maps hawker centres, parks, and community clubs using real coordinates. |

---

## How Route Planning Works

- Uses **Node-NLP** to classify activity intent
- Pulls real location data from **data.gov.sg**
- Determines nearest route path using **Haversine Distance**
- Presents plan as:  
  `Start → Hawker Centre → Park → Community Club` (or based on preferred order)

---

## Tech Stack

### Frontend
- React.js  
- TypeScript  
- Tailwind CSS  

### Backend
- Node.js + Express  
- PostgreSQL  
- Node-NLP  

---

## Setup Instructions

# Getting Started with SilverConnect Web Application

These instructions will help you set up and run the **frontend** and **backend** of the SilverConnect web application locally.

---

## 1. Clone the Repository
```bash
git clone <your-repo-url>
```

---

## 2. Install Node.js  
Download and install Node.js (includes `npm`):  
👉 [Download Node.js](https://nodejs.org/en/download)

---

## 3. Run the Frontend
1. Open a **first terminal** (cmd).  
2. Navigate to the frontend folder:
   **cd C:\2006-SCE3-67\SilverConnect\frontend**
3. Install dependencies and start the dev server: **npm install && npm run dev**
4. Open your browser and go to:  
   👉 [http://localhost:5173](http://localhost:5173)


## 4. Set Up the Backend
### Install PostgreSQL
1. Download and install PostgreSQL:  
   👉 [Install PostgreSQL Guide](https://www.w3schools.com/postgresql/postgresql_install.php)  
2. After installation, open **SQL Shell (psql)**.  Type sql in search bar.
3. Press **Enter** through all prompts until asked for a password. Type:
   **postgres**
4. Create the database:
   **CREATE DATABASE silverconnect;**

### Start the Backend
1. Open a **second terminal**.  
2. Navigate to the backend folder:
   **cd C:\2006-SCE3-67\SilverConnect\backend**
3. Install dependencies and start the backend server: **npm install && npm run dev**

## 5. External APIs

1. **Community Clubs GeoJson Dataset**
   https://data.gov.sg/datasets/d_9de02d3fb33d96da1855f4fbef549a0f/view
2. **Hawker Centres GeoJson Dataset**
   https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view
3. **NParks GeoJson Dataset**
   https://data.gov.sg/datasets/d_0542d48f0991541706b58059381a6eca/view


## 6. Contributors
The following contributors have contributed to the whole Software Developement Life-cycle, including (not exhausive):

1. Ideation and refinement
2. Generation of functional and non-funtional requirements
3. Generation of Use Cases and Descriptions
4. UI/UX Mockup and Prototyping (Figma)
5. Design of Architecture Diagram, Class Diagram, Sequence Diagrams, and Dialog Map Diagram
6. Development of Application
7. Black-box and White-box Testing
8. Documentations

| Name                 | GitHub Username                                               | Role       |
|--------------------- | ------------------------------------------------------------- | ---------- |
| Lucas Cheong Wai     | [lucascheongwai](https://github.com/lucascheongwai)           | Full-Stack |
| Wu Songxin           | [wsxcode](https://github.com/wsxcode)                         | Full-Stack |
| Sivakumar Magina     | [magina2302](https://github.com/magina2302)                   | Full-Stack |
| Lim Jia Yi           | [Jacklo237](https://github.com/Jacklo237)                     | Full-Stack |
| Nicodemus Noel Lee   | [Nicowouw](https://github.com/Nicowouw)                       | Full-Stack |


