// src/context/FeatureFlagContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FeatureFlagContext = createContext({});

export function useFeatureFlags() {
    return useContext(FeatureFlagContext);
}

export function FeatureFlagProvider({ children }) {
    // ✅ 1. Agora pegamos não só o token, mas também o 'user' e o 'isLoading' do AuthContext
    const { user, isLoading: isAuthLoading } = useAuth();
    const [features, setFeatures] = useState({});
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    // ✅ 2. O useEffect agora "escuta" o 'user' e o 'isAuthLoading'
    useEffect(() => {
        const fetchFlags = async () => {
            setLoadingFeatures(true);
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

        // ✅ 3. A MÁGICA: A busca só acontece se a autenticação NÃO estiver carregando E houver um usuário.
        if (!isAuthLoading && user) {
            fetchFlags();
        } else if (!isAuthLoading && !user) {
            // Se o carregamento terminou e não há usuário (logout), limpa os dados.
            setFeatures({});
            setLoadingFeatures(false);
        }
    }, [user, isAuthLoading]); // Roda sempre que o status de autenticação muda.

    const isEnabled = (key) => !!features[key];

    return (
        <FeatureFlagContext.Provider value={{ isEnabled, loadingFeatures }}>
            {/* Removemos o '!loadingFeatures' daqui para evitar que a tela pisque */}
            {children}
        </FeatureFlagContext.Provider>
    );
}