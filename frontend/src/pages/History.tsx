import { useState, useEffect } from 'react';
import { Clock, FileText } from 'lucide-react';
import api from '../utils/api';

interface Scan {
  id: string;
  filename: string;
  text: string;
  confidence: number;
  created_at: string;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/ocr/history')
      .then(({ data }) => setScans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scan History</h2>
      {scans.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={48} className="mx-auto mb-4" />
          <p>No scans yet. Upload a handwriting image to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{scan.filename || 'Untitled scan'}</span>
                    <span className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full">
                      {scan.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{scan.text}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm ml-4 whitespace-nowrap">
                  <Clock size={14} />
                  {new Date(scan.created_at).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
