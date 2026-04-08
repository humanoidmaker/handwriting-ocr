import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Copy, Volume2, Sparkles, Check } from 'lucide-react';
import api from '../utils/api';

interface OCRLine {
  text: string;
  confidence: number;
  bbox: number[];
}

interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  lines: OCRLine[];
  preprocessing_applied: string[];
  preprocessed_image: string;
}

export default function Read() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enhance, setEnhance] = useState(true);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = enhance ? '/ocr/read-enhanced' : '/ocr/read';
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setEditedText(data.text);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'OCR failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(editedText);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Read Handwriting</h2>
        <p className="text-gray-500 mt-1">Upload a handwriting sample and let AI read it for you</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-accent-500 bg-accent-50' : 'border-gray-300 hover:border-accent-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
        ) : (
          <div className="space-y-3">
            <Upload className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 font-medium">Drag and drop an image here, or click to browse</p>
            <p className="text-gray-400 text-sm">Supports JPG, PNG, WEBP up to 10MB</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enhance}
            onChange={(e) => setEnhance(e.target.checked)}
            className="w-4 h-4 accent-accent-500"
          />
          <Sparkles size={16} className="text-accent-500" />
          <span className="text-sm text-gray-700">Enhanced mode (best for impaired handwriting)</span>
        </label>
        <button
          onClick={analyze}
          disabled={!file || loading}
          className="ml-auto bg-accent-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {error && <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Images Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Original
              </h3>
              <img src={preview} alt="Original" className="rounded-lg border w-full" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Preprocessed
              </h3>
              <img src={result.preprocessed_image} alt="Preprocessed" className="rounded-lg border w-full" />
            </div>
          </div>

          {/* Preprocessing Steps */}
          <div className="flex flex-wrap gap-2">
            {result.preprocessing_applied.map((step) => (
              <span
                key={step}
                className="bg-accent-50 text-accent-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {step}
              </span>
            ))}
          </div>

          {/* Extracted Text */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Extracted Text</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Confidence: <strong className="text-accent-600">{result.confidence}%</strong>
                </span>
                <button
                  onClick={copyText}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-accent-500 transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={speak}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-accent-500 transition-colors"
                >
                  <Volume2 size={16} />
                  Speak
                </button>
              </div>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[150px] p-4 bg-gray-50 border rounded-lg text-lg leading-relaxed resize-y focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Line-by-line confidence */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Line-by-Line Analysis</h3>
            <div className="space-y-3">
              {result.lines.map((line, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-400 w-8">#{i + 1}</span>
                  <span className="flex-1 text-gray-800">{line.text}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-accent-500"
                        style={{ width: `${line.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {line.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
