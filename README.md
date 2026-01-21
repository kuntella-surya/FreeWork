##  FreeWork

FreeWork is a full-stack marketplace platform designed to connect customers with nearby service professionals such as plumbers, electricians, photographers, mechanics, and other offline freelancers. The system supports the complete workflow from both sides of the marketplace: clients can post service requirements, while freelancers can showcase their skills, discover relevant jobs, submit bids, communicate in real time, and build reputation through ratings and reviews.

From the **client side**, users can:
- Search service providers based on location, skills, budget, and availability  
- Post detailed job requirements  
- Receive and compare multiple bids  
- View profiles, ratings, and reviews  
- Hire the most suitable professional  

From the **freelancer side**, professionals can:
- Create rich profiles with skills, certifications, portfolio, and work history  
- Get location-based job recommendations  
- Place bids on nearby projects  
- Chat with clients in real time  
- Manage ongoing work and grow visibility through ratings and feedback  

Machine learning and NLP techniques such as TF-IDF, cosine similarity, skill extraction (SpaCy), and sentiment analysis (VADER) are used to improve job discovery and relevance ranking. Geospatial indexing enables proximity-based matching between clients and freelancers.
FreeWork is a MERN-stack platform connecting clients and local service professionals for offline jobs, offering job posting, bidding, real-time communication, and profile management. The platform is inspired by Fiverr and Upwork, tailored for on-ground, local services

---

## Key Features

### 🔐 User Authentication & Profiles
- Secure JWT-based login and registration  
- Detailed freelancer profiles (skills, portfolio, certifications, experience, ratings)  
- Client reviews and work history  

### 📌 Job Posting & Bidding System
- Clients post jobs with title, description, budget, duration, skills, and location  
- Freelancers submit proposals and bids  
- Negotiation and project assignment  

### 💬 Real-Time Messaging
- One-to-one chat using Socket.IO  
- Unread message count and live updates  
- Messages stored in MongoDB  

### 🤖 ML & NLP Features 
- Live search suggestions using TF-IDF + Cosine Similarity  
- Skill extraction using SpaCy  
- Sentiment analysis using VADER  

### 📍 Geospatial Search
- Location-based matching using MongoDB 2dsphere index  
- Nearby job discovery  

### 🎨 Modern Responsive UI
- React + Bootstrap  
- Dark mode, blur effects, smooth animations  
- Mobile responsive design  

---

## Tech Stack

**Frontend:**  
- React.js, Bootstrap

**Backend:**  
- Node.js, Express.js

**ML / NLP:**  
- Python, Flask, SpaCy, NLTK (VADER), Scikit-learn  

**Database:**  
- MongoDB


---

## My Role

I **solely designed and developed the entire FreeWork platform** from scratch. Responsibilities included:  
- Designing and implementing the frontend with React.js and Bootstrap for a responsive, user-friendly UI  
- Developing RESTful APIs, authentication, and real-time messaging with Node.js, Express, MongoDB, and Socket.IO  
- Building ML-based job matching, skill extraction, and sentiment analysis pipelines using Python, SpaCy, VADER, and Scikit-learn  
- Implementing geospatial search for location-based service discovery with MongoDB 2dsphere indexes  
- Deploying frontend and backend on Vercel and Heroku with secure JWT authentication  
- Ensuring end-to-end functionality, performance optimization, and cross-platform responsiveness  

---

