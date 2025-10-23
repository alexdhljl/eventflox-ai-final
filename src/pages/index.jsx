import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import CreateEvent from "./CreateEvent";

import EventDetail from "./EventDetail";

import Reports from "./Reports";

import CopyEvent from "./CopyEvent";

import JoinEvent from "./JoinEvent";

import EventRegister from "./EventRegister";

import EventCheckIn from "./EventCheckIn";

import PaymentSuccess from "./PaymentSuccess";

import Subscription from "./Subscription";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    CreateEvent: CreateEvent,
    
    EventDetail: EventDetail,
    
    Reports: Reports,
    
    CopyEvent: CopyEvent,
    
    JoinEvent: JoinEvent,
    
    EventRegister: EventRegister,
    
    EventCheckIn: EventCheckIn,
    
    PaymentSuccess: PaymentSuccess,
    
    Subscription: Subscription,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/CreateEvent" element={<CreateEvent />} />
                
                <Route path="/EventDetail" element={<EventDetail />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/CopyEvent" element={<CopyEvent />} />
                
                <Route path="/JoinEvent" element={<JoinEvent />} />
                
                <Route path="/EventRegister" element={<EventRegister />} />
                
                <Route path="/EventCheckIn" element={<EventCheckIn />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}