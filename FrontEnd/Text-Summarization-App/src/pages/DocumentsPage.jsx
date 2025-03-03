import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi } from '../services/api';
import { DocumentTextIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await documentsApi.getAll();
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents. Please try again.');
      console.error(err);
    } finally/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}