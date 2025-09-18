// src/context/FeatureFlagContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const FeatureFlagContext = createContext({});

export function useFeatureFlags() {
    return useContext(FeatureFlagContext);
}

export function FeatureFlagProvider({ children }) {
    const [features, setFeatures] = useState({});
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    // ✅ O useEffect volta a rodar apenas uma vez, no carregamento inicial da página.
    useEffect(() => {
        const fetchFlags = async () => {
            setLoadingFeatures(true);
            try {
                // A chamada agora é para a rota pública que não falhará.
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
    }, []); // O array vazio [] faz com que rode no início.

    const isEnabled = (key) => !!features[key];

    return (
        <FeatureFlagContext.Provider value={{ isEnabled, loadingFeatures }}>
            {/* Usamos a verificação de loading para evitar que a página "pisque" */}
            {!loadingFeatures && children}
        </FeatureFlagContext.Provider>
    );
}