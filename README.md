# 🧤 World Cup Goalie (V1.2) ⚽

A fast-paced, high-contrast retro arcade browser game built to test a goalkeeper's reflexes against accelerating, unpredictable shots. Inspired by Google's FIFA mini-games, this project flips the traditional striker-focused meta on its head, placing the player directly on the goal line.

🚀 **[Live Production Deployment on Netlify](https://worldcupgoalie.netlify.app)**

---

## 🎮 Gameplay Features

* **Reverse Perspective Metagame:** Control the goalkeeper's glove to intercept high-speed footballs before they cross the line.
* **Dynamic Progressive Difficulty:** As your save count increases, the game engine automatically scales difficulty by hyper-accelerating ball velocity and introducing highly unpredictable shot trajectories.
* **Global Top 5 Leaderboard:** Integrated database tracking that saves high scores and renders a live, competitive top 5 scoreboard.
* **Arcade Aesthetics & "Juice":** Features sharp custom pitch vector geometry, custom trailing particle systems, a retro chiptune soundtrack, and responsive audio triggers (including localized failure sounds).

---

## 🛠️ Tech Stack & Architecture

This project was built deliberately with **zero game engines and zero external frontend frameworks** to master low-level browser interaction and asset compilation.

* **Frontend Rendering:** HTML5 Canvas API & CSS Custom Variables.
* **Core Logic:** Object-Oriented Vanilla JavaScript (Phaser 3 Framework wrapper for game loop management).
* **Backend & Persistence:** Supabase Serverless PostgREST DB for real-time leaderboard storage.
* **DevOps & Hosting:** Netlify Cloud Hosting with Git-driven CI/CD automation.

---

## ⚡ Engineering & Computer Science Concepts Applied

Building this product from the ground up served as a practical application of core software engineering disciplines:

* **Event-Driven Architecture:** Mapping viewport mouse/touch coordinates to object vector translation without introducing input overhead or input lag.
* **State Management Machine:** Handling multi-scene routing (Main Menu ➡️ Gameplay Loop ➡️ Transition Canvas ➡️ Database Entry) while safely persisting user session scores through the local game registry.
* **Data Serialization:** Implementing structural queries to interact with Supabase instances, validating data payloads, and protecting database performance constraints.
* **Continuous Deployment Pipeline:** Creating an agile engineering workflow where local development pushes to the repository instantly execute production build deployments.

---

## 💻 Local Installation & Setup

If you want to clone this repository and run the engine locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/AbilAlgorithms/worldcup-goalkeeper.git](https://github.com/AbilAlgorithms/worldcup-goalkeeper.git)
   cd worldcup-goalkeeper
