/**************************************************************
* Author(s): Bryan Lee
* Last Updated: 9/19/2024
*
* File:: DefaultLayout.jsx
*
* Description:: This file establishes the layout schema for the web app.
*               In other words, the order of components
*               (Navbar, Main Content, and Footer).
*
**************************************************************/

// import React from 'react'
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
import { Outlet } from 'react-router-dom'

const DefaultLayout = () => {
    return (
        <>
            {/* <Navbar /> */}
            <Outlet />
            {/* <Footer /> */}
        </>
    )
}

export default DefaultLayout