import { h } from 'preact';

export const Layout = ({ children }) => {
    return (
        <div class="app-container">
            {children}
        </div>
    );
};
