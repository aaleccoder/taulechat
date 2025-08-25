import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";



function App() {
  function callFetchTest() {
    invoke("fetch_test")
      .then(() => {
        console.log("fetch_test invoked!");
      })
      .catch((e) => {
        console.error("Error invoking fetch_test:", e);
      });
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <main className="min-h-screen mx-auto justify-center items-center flex">
        <div>
          <p>Hello world</p>
          <button onClick={callFetchTest}>Invoke fetch_test</button>
        </div>
      </main>
    </ThemeProvider>
  );
}

export default App;
