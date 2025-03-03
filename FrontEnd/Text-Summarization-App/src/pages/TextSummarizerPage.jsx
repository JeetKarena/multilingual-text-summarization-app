import { useState } from 'react';
import { summarizationApi } from '../services/api';

export default function TextSummarizerPage() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [maxLength, setMaxLength] = useState(150);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ru', name: 'Russian' },
  ];

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await summarizationApi.summarizeText({
        text,
        language,
        max_length: maxLength,
      });
      
      setSummary(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to summarize text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Text Summarizer</h1>
        <p className="mt-1 text-gray-500">Enter text to generate a concise summary</p>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
              Text to Summarize
            </label>
            <textarea
              id="text"
              rows={10}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
              placeholder="Enter or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Summary Length
              </label>
              <input
                type="number"
                id="maxLength"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value, 10))}
                min={50}
                max={500}
              />
            </div>
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleSummarize}
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:bg-primary-300"
            >
              {loading ? 'Summarizing...' : 'Summarize'}
            </button>
          </div>
        </div>
      </div>
      
      {summary && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Summary</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-line">{summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}