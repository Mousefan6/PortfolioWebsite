/**
 * For adding new pages
 */

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import DefaultLayout from './layouts/DefaultLayout.jsx';

// Import the subpages
import LandingPage from "./LandingPage/LandingPage.tsx";

function App() {
    document.title = "Portfolio Website";

    return (
        <Router basename="/PortfolioWebsite">
            <Routes>
                <Route element={<DefaultLayout />}>
                    <Route path="/" element={<LandingPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
