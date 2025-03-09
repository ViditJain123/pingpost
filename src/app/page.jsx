"use client"

import axios from "axios";

export default function Home() {
  const handleClick = async () => {
    const signInUrl = await axios.get("/api/linkedin/redirect");
    console.log(signInUrl.data);
    window.location.href = signInUrl.data.authUrl;
  }
  return (
    <div>
      <h1 className="pl-28 ">Welcome to Pingpost</h1>
      <button onClick={handleClick} className="pl-28 pt-28">Sign in with linkedin</button>
    </div>
  );
}