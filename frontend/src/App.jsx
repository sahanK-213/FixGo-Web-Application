import  Home  from "../Routes/Home"
import { Toaster } from "react-hot-toast"
import './App.css'

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Home />
    </>
  )
}

export default App
