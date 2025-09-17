// src/context/FeatureFlagContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FeatureFlagContext = createContext({});

export function useFeatureFlags() {
    return useContext(FeatureFlagContext);
}

export function FeatureFlagProvider({ children }) {
    const [features, setFeatures] = useState({});
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const response = await api.get('/api/feature-flags');
                const flags = response.data.reduce((acc, flag) => {
                    acc[flag.feature_key] = flag.is_enabled;
                    return acc;
                }, {});
                setFeatures(flags);
            } catch (error) {
                console.error("Falha ao carregar as funcionalidades do site.", error);
            } finally {
                setLoadingFeatures(false);
            }
        };
        fetchFlags();
    }, []);

    const isEnabled = (key) => !!features[key];

    return (
        <FeatureFlagContext.Provider value={{ isEnabled, loadingFeatures }}>
            {!loadingFeatures && children}
        </FeatureFlagContext.Provider>
    );
}