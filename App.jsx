import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { DiscordAuthProvider } from '@/lib/DiscordAuthContext';
import DiscordProtectedRoute from '@/components/DiscordProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Login from '@/pages/Login';
import Overview from '@/pages/Overview';
import Configuration from '@/pages/Configuration';
import Messages from '@/pages/Messages';
import Whitelist from '@/pages/Whitelist';
import Logs from '@/pages/Logs';

function App() {