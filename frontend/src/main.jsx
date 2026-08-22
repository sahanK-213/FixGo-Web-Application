import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Shops from '../Routes/Shops.jsx'
import Services from "../Routes/Services.jsx"
import Support from "../Routes/Support.jsx"
import ShopDetails from '../Routes/ShopDetails.jsx';
import Form from "../Routes/RegistrationForm.jsx"
import CustomerForm from "../components/Registration/CustomerForm.jsx"
import ShopForm from "../components/Registration/ShopOwnerForm.jsx"
import SignIn from '../components/SignIn.jsx'
import VerifyEmail from "../components/Registration/VerifyEmail.jsx"
import ForgotPassword from "../components/ForgotPassword.jsx"
import ResetPassword from "../components/ResetPassword.jsx"
import { ScrollToTop } from "../components/ScrollToTop";
import TermsConditions from "../Routes/TermsConditions.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <BrowserRouter>
      <ScrollToTop /> {/* This component ensures the page scrolls to top on every route change */}  
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/services" element={<Services />} />
        <Route path="/support" element={<Support />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/shop/:id" element={<ShopDetails />} />
        <Route path="/form" element={<Form />}>
          <Route path="customer" element={<CustomerForm />} />
          <Route path="shop-owner" element={<ShopForm />} />
        </Route>
        <Route path="/login" element={<SignIn />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>

  </StrictMode>
)
