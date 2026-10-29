
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API request failed");
        }
        return response.json();
      })
      .then((data) => setApiStatus(data.message))
      .catch(() => setApiStatus("Cannot connect to API"));
  }, []);

  return (
    <main>
      <h1>EventPro</h1>
      <p>Conference Management System</p>

      <h2>Backend connection</h2>
      <p>{apiStatus}</p>
    </main>
  );
}

export default App;
