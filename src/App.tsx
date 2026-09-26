import React, { useState } from "react";
import "./App.css";
import { Calculator } from "./calculator";
import { Onboarding } from "./components/Onboarding";
import { Recovery } from "./components/Recovery";
import { Vault } from "./components/Vault";
import { hasAuthRecord } from "./helpers/auth";

type AppView = "setup" | "locked" | "unlocked" | "recovery";

function App() {
  const [view, setView] = useState<AppView>(() =>
    hasAuthRecord() ? "locked" : "setup"
  );

  return (
    <div className="App">
      <h1 className="title">Calculator App</h1>
      {view === "setup" && <Onboarding onComplete={() => setView("locked")} />}
      {view === "locked" && (
        <Calculator
          onUnlock={() => setView("unlocked")}
          onRecover={() => setView("recovery")}
        />
      )}
      {view === "unlocked" && <Vault onLock={() => setView("locked")} />}
      {view === "recovery" && (
        <Recovery
          onRecovered={() => setView("locked")}
          onCancel={() => setView("locked")}
        />
      )}
    </div>
  );
}

export default App;
