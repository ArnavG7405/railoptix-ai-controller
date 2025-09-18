import React, { useState, useEffect } from 'react';
import type { Alert, RailwayData, Action } from '../types';
import { AlertTriangleIcon } from './icons';

interface AlertsProps {
  alerts: Alert[];
  data: RailwayData;
  setData: React.Dispatch<React.SetStateAction<RailwayData | null>>;
  onAction: (action: Action, source: 'alert', sourceId: string) => void;
}

const getSeverityClasses = (severity: Alert['severity']) => {
  switch (severity) {
    case 'High': return 'bg-red-500/20 text-red-300 border-red-500';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
    case 'Low': return 'bg-blue-500/20 text-blue-300 border-blue-500';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
  }
};

const Alerts: React.FC<AlertsProps> = ({ alerts, data, setData, onAction }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (alerts.some(a => a.expiresAt && a.expiresAt < now)) {
      setData(currentData => {
        if (!currentData) return null;
        const newAlerts = currentData.alerts.filter(a => a.expiresAt && a.expiresAt >= now);
        return { ...currentData, alerts: newAlerts };
      });
    }
  }, [now, alerts, setData]);

  return (
    <div className="bg-brand-bg-light p-4 rounded-lg border border-brand-border shadow-lg">
      <h2 className="text-lg font-semibold text-brand-text-primary mb-4 flex items-center">
        <AlertTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
        Critical Alerts
      </h2>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
        {alerts.length > 0 ? alerts.map(alert => {
            const createdAt = parseInt(alert.id.split('-').pop() || `${now}`, 10);
            const initialDuration = alert.expiresAt ? alert.expiresAt - createdAt : 60000;
            const timeLeft = alert.expiresAt ? alert.expiresAt - now : 0;
            const percentage = Math.max(0, (timeLeft / initialDuration) * 100);

            return (
              <div key={alert.id} className={`p-3 rounded-md border-l-4 ${getSeverityClasses(alert.severity)}`}>
                <p className="font-semibold text-sm">{alert.message}</p>
                {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {alert.suggestedActions.map((action, index) => (
                             <button
                                key={`${alert.id}-action-${index}`}
                                onClick={() => onAction(action, 'alert', alert.id)}
                                className="text-xs px-2 py-1 rounded transition-colors bg-brand-border hover:bg-brand-border/70 text-brand-text-secondary"
                            >
                                {action.displayText}
                            </button>
                        ))}
                    </div>
                )}
                {alert.expiresAt && (
                  <div className="w-full bg-black/20 rounded-full h-1 mt-3">
                      <div 
                          className="bg-current h-1 rounded-full"
                          style={{ width: `${percentage}%`, transition: 'width 0.5s linear' }}>
                      </div>
                  </div>
                )}
              </div>
            )
        }) : (
            <p className="text-sm text-brand-text-secondary text-center py-4">No critical alerts.</p>
        )}
      </div>
    </div>
  );
};

export default Alerts;