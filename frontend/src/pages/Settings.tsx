import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import api from '../utils/api';

export default function Settings() {
  const [denoiseLevel, setDenoiseLevel] = useState(3);
  const [contrastBoost, setContrastBoost] = useState(1.2);
  const [deskewEnabled, setDeskewEnabled] = useState(true);
  const [defaultEnhance, setDefaultEnhance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setDenoiseLevel(data.denoise_level ?? 3);
      setContrastBoost(data.contrast_boost ?? 1.2);
      setDeskewEnabled(data.deskew_enabled ?? true);
      setDefaultEnhance(data.default_enhance ?? true);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/settings', {
        denoise_level: denoiseLevel,
        contrast_boost: contrastBoost,
        deskew_enabled: deskewEnabled,
        default_enhance: defaultEnhance,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Enhancement Settings</h2>

      <div className="bg-white rounded-xl border p-6 max-w-lg space-y-6">
        {/* Default Enhance */}
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Enable Enhancement by Default</p>
            <p className="text-sm text-gray-500">Apply preprocessing to all uploads automatically</p>
          </div>
          <input
            type="checkbox"
            checked={defaultEnhance}
            onChange={(e) => setDefaultEnhance(e.target.checked)}
            className="w-5 h-5 accent-accent-500"
          />
        </label>

        {/* Denoise Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-gray-900">Denoise Level</label>
            <span className="text-sm text-accent-600 font-semibold">{denoiseLevel}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={denoiseLevel}
            onChange={(e) => setDenoiseLevel(Number(e.target.value))}
            className="w-full accent-accent-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Light</span>
            <span>Heavy</span>
          </div>
        </div>

        {/* Contrast Boost */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-gray-900">Contrast Boost</label>
            <span className="text-sm text-accent-600 font-semibold">{contrastBoost.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={contrastBoost}
            onChange={(e) => setContrastBoost(Number(e.target.value))}
            className="w-full accent-accent-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.5x</span>
            <span>3.0x</span>
          </div>
        </div>

        {/* Deskew */}
        <label className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Auto Deskew</p>
            <p className="text-sm text-gray-500">Automatically straighten tilted text</p>
          </div>
          <input
            type="checkbox"
            checked={deskewEnabled}
            onChange={(e) => setDeskewEnabled(e.target.checked)}
            className="w-5 h-5 accent-accent-500"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent-500 text-white py-3 rounded-lg font-semibold hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : saving ? (
            'Saving...'
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
