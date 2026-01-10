import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DescriptionPage from './DescriptionPage';
import '../../index.css';

function DescriptionApp() {
    return (
        <DescriptionPage />
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <DescriptionApp />
    </StrictMode>
);
