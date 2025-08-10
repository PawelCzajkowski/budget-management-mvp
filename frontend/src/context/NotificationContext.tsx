import React, { createContext, useContext, useState, ReactNode } from 'react';
import ErrorAlert from '../components/ErrorAlert';
import NotificationAlert from '../components/NotificationAlert';

interface Notification {
    id: string;
    message: string;
    type: 'error' | 'info';
}

interface NotificationContextType {
    showError: (message: string) => void;
    showNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: 'error' | 'info') => {
        const id = Math.random().toString(36).substring(7);
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const showError = (message: string) => {
        addNotification(message, 'error');
    };

    const showNotification = (message: string) => {
        addNotification(message, 'info');
    };

    return (
        <NotificationContext.Provider value={{ showError, showNotification }}>
            {children}
            {notifications.map(notification => (
                notification.type === 'error' ? (
                    <ErrorAlert
                        key={notification.id}
                        message={notification.message}
                        onClose={() => removeNotification(notification.id)}
                    />
                ) : (
                    <NotificationAlert
                        key={notification.id}
                        message={notification.message}
                        onClose={() => removeNotification(notification.id)}
                    />
                )
            ))}
        </NotificationContext.Provider>
    );
};
