import { render } from 'preact';
import { Router, Route } from './router';
import './index.css';

// Placeholder components for pages
const Dashboard = () => <div>Dashboard Page</div>;
const Schedules = () => <div>Schedules Page</div>;
const Configure = () => <div>Configure Page</div>;
const Settings = () => <div>Settings Page</div>;
const Maintenance = () => <div>Maintenance Page</div>;

export function App() {
  return (
    <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/configure" component={Configure} />
        <Route path="/settings" component={Settings} />
        <Route path="/maintenance" component={Maintenance} />
    </Router>
  );
}

render(<App />, document.getElementById('app'));
